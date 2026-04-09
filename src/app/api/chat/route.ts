import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getMentorById } from "@/lib/ai-mentors";
import { createClient } from "@/lib/supabase/server";
import { getMentorMarketContext, extractTickersFromMessage, extractDatesFromMessage, fetchHistoricalPrice } from "@/lib/market-data";
import { LAZY_RICH_CONSTITUTION } from "@/constants/constitution";
import { getAppEcosystemMap } from "@/lib/ai-ecosystem";
import { chatRateLimiter, chatAuthRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Mark as dynamic to avoid build-time pre-rendering issues with environment variables
export const dynamic = "force-dynamic";

// Max message constraints to prevent abuse
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;

export async function POST(req: NextRequest) {
    // Rate limiting check
    const clientIp = getClientIp(req);

    if (!process.env.OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: "AI 서비스가 현재 설정되지 않았습니다." }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
        });
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // Create Supabase client for server-side
    const supabase = await createClient();

    try {
        const body = await req.json();
        const { messages, mentorId, sessionId, userId } = body;

        // Input validation
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: "메시지가 필요합니다." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (messages.length > MAX_MESSAGES) {
            return new Response(JSON.stringify({ error: "대화가 너무 깁니다. 새 대화를 시작해주세요." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Truncate overly long messages
        const sanitizedMessages = messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: typeof m.content === "string" ? m.content.slice(0, MAX_MESSAGE_LENGTH) : "",
        }));

        // Get AI Mentor
        const mentor = getMentorById(mentorId);
        if (!mentor) {
            return new Response(JSON.stringify({ error: "Mentor not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get authenticated user ID from session for security
        let authUserId: string | null = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                authUserId = user.id;
            }
        } catch (authErr) {
            // Auth check failed — treat as unauthenticated
        }

        // Apply rate limiting based on auth status
        const limiter = authUserId ? chatAuthRateLimiter : chatRateLimiter;
        const rateCheck = limiter.check(authUserId || clientIp);
        if (!rateCheck.allowed) {
            return rateLimitResponse(rateCheck.retryAfterMs);
        }

        // Security: Only use the server-verified auth ID, never trust client-provided userId
        const effectiveUserId = authUserId;

        // Fetch user's portfolio for context injection
        let portfolioContext = "";

        let userTickers: string[] = [];

        if (effectiveUserId) {
            const { data: portfolioData } = await supabase
                .from("portfolios")
                .select("ticker, quantity, avg_price")
                .eq("user_id", effectiveUserId);

            if (portfolioData && portfolioData.length > 0) {
                userTickers = portfolioData.map((p) => p.ticker);
                const holdings = portfolioData
                    .map(
                        (p) =>
                            `종목명: ${p.ticker}, 수량: ${p.quantity}주, 평균단가: ${p.avg_price?.toLocaleString()}원`
                    )
                    .join("\n");
                portfolioContext = `

[사용자 상태: 로그인 ✅ | 포트폴리오 ✅]
${holdings}

위 포트폴리오 정보를 참고하여, 사용자의 보유 종목에 대해 구체적으로 언급하며 조언해주세요.
포트폴리오 분석을 요청받으면 절대 "어떤 종목을 갖고 계신가요?"라고 되묻지 말고 위 데이터를 사용하세요.`;
            } else {
                // Logged in but empty portfolio
                portfolioContext = `

[사용자 상태: 로그인 ✅ | 포트폴리오 ❌ (미등록)]
포트폴리오 분석을 명시적으로 요청한 경우에만 [ACTION:PORTFOLIO:create]를 사용하세요.
그 외에는 App Ecosystem Map의 다른 도구들을 자율적으로 활용하세요.`;
            }
        } else {
            // Not logged in
            portfolioContext = `

[사용자 상태: 비로그인 (게스트)]
포트폴리오 분석을 명시적으로 요청한 경우에만 [ACTION:LOGIN]을 사용하세요.
그 외에는 App Ecosystem Map의 다른 도구들을 자율적으로 활용하세요.`;
        }

        // 질문에서 종목 추출 (포트폴리오에 없어도 데이터 가져오기 위함)
        const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
        const questionTickers = extractTickersFromMessage(lastMessage.content || "");

        // 포트폴리오 종목 + 질문 종목 합치기 (중복 제거, 질문한 종목 우선)
        const allTickers = Array.from(new Set([...questionTickers, ...userTickers].map(t => t.trim())));

        // 💡 UX 향상 및 속도 최적화: 마켓 데이터 Lazy Execution (조건부 로딩)
        // 유저 질문에 특정 시장/투자 관련 뉘앙스가 있을 때만 데이터를 로딩합니다.
        const marketKeywords = ["시장", "시황", "주식", "주가", "전망", "금리", "환율", "비트코인", "투자", "포트폴리오", "펀드", "섹터", "배당", "매수", "매도", "수익", "어때", "분석", "종목"];
        const messageUpper = (lastMessage?.content || "").toUpperCase();
        const hasMarketKeyword = marketKeywords.some(kw => messageUpper.includes(kw.toUpperCase()));
        
        // 질의에서 명시적으로 언급한 티커가 있거나, 투자 관련 키워드가 있을 경우에만 조회
        // 이를 통해 평상시 인사나 단순 문의에 대한 응답 속도를 비약적으로 높입니다.
        const shouldFetchMarketData = questionTickers.length > 0 || hasMarketKeyword;

        // Fetch persona-specific market data (캐싱 적용)
        let marketDataContext = "";
        
        if (shouldFetchMarketData) {
            try {
                const mentorData = await getMentorMarketContext(mentorId, allTickers);
                if (mentorData) {
                    marketDataContext = `\n\n${mentorData}`;
                }

                // 추가: 날짜 감지 및 과거 데이터 조회
                const questionDates = extractDatesFromMessage(lastMessage.content || "");
                if (questionDates.length > 0 && allTickers.length > 0) {
                    let historicalContext = "\n\n[📜 과거 데이터 조회 결과]";
                    for (const date of questionDates) {
                        for (const ticker of allTickers.slice(0, 3)) { // 너무 많으면 토큰 낭비이므로 상위 3개만
                            const price = await fetchHistoricalPrice(ticker, date);
                            if (price) {
                                historicalContext += `\n- ${ticker} (${date}): ${price.toLocaleString()} USD (종가 기준)`;
                            }
                        }
                    }
                    if (historicalContext !== "\n\n[📜 과거 데이터 조회 결과]") {
                        marketDataContext += historicalContext;
                    }
                }
            } catch (error) {
                console.error("[Chat] Market data fetch failed (non-blocking):", error);
                // 시장 데이터 실패해도 채팅은 계속 진행
            }
        } else {
            console.log("[ChatAPI] ⚡ 최적화: 단순 일상 대화로 간주하여 Market Data 로딩 건너뜀 (Latency 이득 확보)");
        }

        // Build system message: Constitution > Shared Instructions > Persona > Dynamic Context (Portfolio, Market) > Ecosystem Map
        const ecosystemMap = getAppEcosystemMap();

        // First-message CTA guarantee: ensure at least 1 action tag in the very first response
        const userMessageCount = messages.filter((m: { role: string }) => m.role === "user").length;
        const firstMessageCTA = userMessageCount <= 1
            ? `\n\n[🎯 첫 답변 규칙] 이 대화의 첫 번째 답변입니다. 유저가 앱의 다양한 기능을 발견할 수 있도록, 반드시 1개 이상의 [ACTION:...] 태그를 답변 마지막에 포함하세요. 맥락과 가장 관련 있는 도구를 자연스럽게 제안하세요.`
            : "";

        const systemMessage = `${LAZY_RICH_CONSTITUTION}

═══ [핵심 인공지능 지침] ═══
1. 결론부터 말하세요 (BLUF): 설명하기 전에 "데이터상 매력적인 구간으로 보입니다" 또는 "지금은 관망이 필요해 보입니다" 등 객관적인 분석 결과를 먼저 밝히세요.
2. 법적 책임 원천 차단 (최우선 규칙): 당신은 절대 '권장합니다', '추천합니다', '매수/매도 하세요' 같은 직접적인 투자 조언이나 권유 형태의 표현을 사용할 수 없습니다. 당신의 답변은 오직 통계와 철학을 기반으로 한 '가상 견해'이며 제한된 데이터 내의 분석일 뿐, 실제 투자 여부는 사용자 책임 하에 이뤄져야 합니다.
3. 안전한 표현 사용: 확정적이거나 행동을 지시하는 표현("무조건 사세요", "지금이 저점입니다") 대신 유보적이고 분석적인 표현("확률적으로 흥미로운 구간일 수 있습니다", "데이터 관점에서 고려해볼 만합니다")으로 다듬어 표현하세요.
4. 데이터 인용 필수: 제공된 수치(PER, 낙폭, 이평선 괴리 등)를 근거로 논리를 펼치세요.
5. 시각화 활용: 수치 비교나 추세 설명이 필요하면 반드시 차트 데이터를 생성하세요.
   포맷: [CHART_DATA] {"type": "bar"|"line"|"pie", "title": "...", "data": [{"name": "X축", "val": 10}, ...], "dataKeys": ["val"]} [/CHART_DATA]
   주의: 반드시 유효한 JSON 문법을 지켜야 합니다. (Key와 String 값은 반드시 큰따옴표(") 사용, 작은따옴표(') 사용 금지)
   차트는 설명 중간 적절한 위치에 삽입하세요.
6. 존댓말(해요체/합쇼체) 사용
7. [언어 규칙]: 기본적으로 반드시 한국어로 답변하세요. 단, 사용자가 영어나 베트남어로 질문하는 경우에만 해당 언어로 답변하세요.

═══ 당신의 페르소나 ═══
${mentor.systemPrompt}

${portfolioContext}
${marketDataContext}

${ecosystemMap}${firstMessageCTA}`;

        // Save user message to database (Non-blocking으로 변경하여 OpenAI 응답을 기다리게 하지 않음)
        if (sessionId && messages.length > 0) {
            const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1];
            if (lastUserMessage.role === "user") {
                supabase.from("chat_messages").insert({
                    session_id: sessionId,
                    role: "user",
                    content: lastUserMessage.content,
                }).then(({ error: saveError }) => {
                    if (saveError) console.error("[ChatAPI] User message save error:", saveError.message);
                    else console.log("[ChatAPI] User message saved to DB");
                });
            }
        }

        // Call OpenAI with streaming (gpt-4o-mini is efficient)

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemMessage },
                ...sanitizedMessages.map((m: { role: string; content: string }) => ({
                    role: m.role as "user" | "assistant",
                    content: m.content,
                })),
            ],
            stream: true,
            max_tokens: 1000,
            temperature: 0.8,
        });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                let fullResponse = "";

                try {
                    for await (const chunk of response) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            fullResponse += content;
                            // SSE format: data: JSON_STRING\n\n
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                            );
                        }
                    }

                    // Save assistant message to database after streaming completes
                    if (sessionId && fullResponse) {
                        const { error: saveError } = await supabase.from("chat_messages").insert({
                            session_id: sessionId,
                            role: "assistant", // "system"이 아니라 "assistant"
                            content: fullResponse,
                        });
                        if (saveError) console.error("[ChatAPI] Assistant message save error:", saveError.message);
                        else console.log("[ChatAPI] Assistant message saved to DB");
                    }

                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response(
            JSON.stringify({ error: "채팅 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

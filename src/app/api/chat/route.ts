import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getGuruById } from "@/lib/guru-personas";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPersonaMarketContext, extractTickersFromMessage } from "@/lib/market-data";
import { LAZY_RICH_CONSTITUTION } from "@/constants/constitution";

// Mark as dynamic to avoid build-time pre-rendering issues with environment variables
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    // Initialize OpenAI inside the handler to prevent build-time crashes if API key is missing
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || "placeholder",
    });

    // Create Supabase client for server-side
    const supabase = await createClient();

    try {
        const { messages, personaId, sessionId, userId } = await req.json();
        console.log(`[ChatAPI] POST called for session: ${sessionId}, user: ${userId}`);

        // Get persona
        const persona = getGuruById(personaId);
        if (!persona) {
            return new Response(JSON.stringify({ error: "Persona not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get authenticated user ID from session for security
        let authUserId = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                authUserId = user.id;
            }
        } catch (authErr) {
            console.error("[ChatAPI] Auth check failed:", authErr);
        }

        // Validate client provided userId matches authenticated user (if provided)
        if (userId && userId !== authUserId) {
            console.warn(`[ChatAPI] Security Warning: Client provided userId (${userId}) does not match authenticated user (${authUserId})`);
            // Optional: You could reject here, but for now we'll just use the authenticated ID if available
        }

        // Use authenticated ID if available, fallback to client provided (or null)
        const effectiveUserId = authUserId || userId;

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

[사용자의 현재 포트폴리오]
${holdings}

위 포트폴리오 정보를 참고하여, 사용자의 보유 종목에 대해 구체적으로 언급하며 조언해주세요. 예를 들어 "삼성전자 포지션이 크시네요" 또는 "테슬라 평균가가 좀 높으신 편이에요" 같이 개인화된 대화를 해주세요.`;
            } else {
                // Logged in but empty portfolio
                portfolioContext = `

[사용자의 포트폴리오 상태]
현재 사용자는 로그인은 했으나 포트폴리오를 아직 등록하지 않은 상태입니다.

[⛔️ 필수 지침 - 절대 위반 금지]
포트폴리오 명시적 분석 요청 시: 사용자가 "내 포트폴리오 분석해줘", "진단해줘" 등 자신의 자산에 대한 분석을 명시적으로 요청할 경우, 절대로 "어떤 종목을 가지고 계신가요?"라고 되묻거나 채팅창에서 정보를 입력받으려 하지 마세요. 반드사 당신의 페르소나 성향에 맞는 톤앤매너로 포트폴리오 데이터가 비어있음을 안내하고 종목 등록을 권유하세요. 답변의 맨 마지막 줄에 반드시 다음 태그를 포함하여 버튼을 생성하세요: [ACTION:CREATE_PORTFOLIO]

일반적인 질문(시황/철학 등) 답변 시: 개인화된 분석이나 포트폴리오 기반 조언이 곁들여지면 유용할 것이라 판단되는 경우, 질문에 대한 답변(투자 철학, 시장 전망 등)을 먼저 충실히 제공하세요. 그 후 마지막에 자연스럽게 현재 포트폴리오가 비어있음을 언급하며 종목 등록을 권장하세요. 답변의 맨 마지막 줄에 반드시 다음 태그를 포함하여 버튼을 생성하세요: [ACTION:CREATE_PORTFOLIO]
`;
            }
        } else {
            // Not logged in
            portfolioContext = `

[사용자의 포트폴리오 상태]
현재 사용자는 로그인하지 않은 상태입니다.

[⛔️ 필수 지침 - 절대 위반 금지]
비로그인 유저의 포트폴리오 분석 요청 시: 사용자가 "내 포트폴리오 분석해줘" 등 자신의 자산 분석을 명시적으로 요청할 경우, 당신의 페르소나 성향에 100% 동기화된 톤앤매너로 포트폴리오 데이터가 없어서 분석해드릴 수 없음을 창의적으로 설명하세요. 평범한 말투는 절대 금지합니다. 간단한 회원가입으로 나만의 포트폴리오를 만들고 맞춤형 분석을 받아보라는 내용을 패르소나 철학을 담아 매력적으로 권유하세요. 답변의 맨 마지막 줄에 정확히 다음 태그를 출력하세요: [ACTION:GO_TO_PROFILE]

일반적인 질문 답변 중 포트폴리오 피드백이 필요한 경우: 질문에 대한 답변(투자 철학, 시장 전망 등)을 먼저 충실히 제공하세요. 마지막에 자연스럽게 비로그인 상태임을 언급하며 회원가입 및 포트폴리오 구성을 권장하세요. 답변의 맨 마지막 줄에 정확히 다음 태그를 출력하세요: [ACTION:GO_TO_PROFILE]

🚨 공통 주의사항: 태그를 '회원가입하러 가기' 등으로 번역하지 마세요. 오직 [ACTION:GO_TO_PROFILE] 라고만 출력해야 버튼이 정상적으로 작동합니다.
`;
        }

        // 질문에서 종목 추출 (포트폴리오에 없어도 데이터 가져오기 위함)
        const lastMessage = messages[messages.length - 1];
        const questionTickers = extractTickersFromMessage(lastMessage.content || "");

        // 포트폴리오 종목 + 질문 종목 합치기 (중복 제거, 질문한 종목 우선)
        const allTickers = Array.from(new Set([...questionTickers, ...userTickers].map(t => t.trim())));

        // Fetch persona-specific market data (캐싱 적용)
        let marketDataContext = "";
        try {
            const personaData = await getPersonaMarketContext(personaId, allTickers);
            if (personaData) {
                marketDataContext = `\n\n${personaData}`;
            }
        } catch (error) {
            console.error("[Chat] Market data fetch failed (non-blocking):", error);
            // 시장 데이터 실패해도 채팅은 계속 진행
        }

        // Build system message: Constitution > Persona > Portfolio > Market Data
        const systemMessage = `${LAZY_RICH_CONSTITUTION}

═══ 당신의 페르소나 ═══
${persona.systemPrompt}

[중요 지침]
결론부터 말하세요 (BLUF): 설명하기 전에 "데이터상 매력적인 구간으로 보입니다" 또는 "지금은 관망이 필요해 보입니다" 등 객관적인 분석 결과를 먼저 밝히세요.
법적 책임 원천 차단 (최우선 규칙): 당신은 절대 '권장합니다', '추천합니다', '매수/매도 하세요' 같은 직접적인 투자 조언이나 권유 형태의 표현을 사용할 수 없습니다. 당신의 답변은 오직 통계와 철학을 기반으로 한 '가상 견해'이며 제한된 데이터 내의 분석일 뿐, 실제 투자 여부는 사용자 책임 하에 이뤄져야 합니다.
안전한 표현 사용: 확정적이거나 행동을 지시하는 표현("무조건 사세요", "지금이 저점입니다") 대신 유보적이고 분석적인 표현("확률적으로 흥미로운 구간일 수 있습니다", "데이터 관점에서 고려해볼 만합니다")으로 다듬어 표현하세요.
데이터 인용 필수: 위 대괄호 안에 제공된 수치(PER, 낙폭, 이평선 괴리 등)를 근거로 논리를 펼치세요.
시각화 활용: 수치 비교나 추세 설명이 필요하면 반드시 차트 데이터를 생성하세요.
  포맷: [CHART_DATA] {"type": "bar"|"line"|"pie", "title": "...", "data": [{"name": "X축", "val": 10}, ...], "dataKeys": ["val"]} [/CHART_DATA]
  주의: 반드시 유효한 JSON 문법을 지켜야 합니다. (Key와 String 값은 반드시 큰따옴표(") 사용, 작은따옴표(') 사용 금지)
  차트는 설명 중간 적절한 위치에 삽입하세요.
존댓말(해요체/합쇼체) 사용
[언어 규칙]: 기본적으로 반드시 한국어로 답변하세요. 단, 사용자가 영어나 베트남어로 질문하는 경우에만 해당 언어로 답변하세요.
${portfolioContext}${marketDataContext}`;

        // Save user message to database
        if (sessionId && messages.length > 0) {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage.role === "user") {
                const { error: saveError } = await supabase.from("chat_messages").insert({
                    session_id: sessionId,
                    role: "user",
                    content: lastUserMessage.content,
                });
                if (saveError) console.error("[ChatAPI] User message save error:", saveError.message);
                else console.log("[ChatAPI] User message saved to DB");
            }
        }

        // Call OpenAI with streaming (gpt-4o-mini is efficient)
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not configured in environment variables.");
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemMessage },
                ...messages.map((m: { role: string; content: string }) => ({
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
            JSON.stringify({ error: "Failed to process chat request" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

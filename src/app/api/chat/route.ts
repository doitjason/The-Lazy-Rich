import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getGuruById } from "@/lib/guru-personas";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPersonaMarketContext, extractTickersFromMessage } from "@/lib/market-data";
import { CORE_CONSTITUTION } from "@/constants/constitution";

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

        // Fetch user's portfolio for context injection
        // Fetch user's portfolio for context injection
        let portfolioContext = "";

        let userTickers: string[] = [];

        if (userId) {
            const { data: portfolioData } = await supabase
                .from("portfolios")
                .select("ticker, quantity, avg_price")
                .eq("user_id", userId);

            if (portfolioData && portfolioData.length > 0) {
                userTickers = portfolioData.map((p) => p.ticker);
                const holdings = portfolioData
                    .map(
                        (p) =>
                            `- ${p.ticker}: ${p.quantity}주 (평균가: ${p.avg_price?.toLocaleString()}원)`
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
사용자가 "내 포트폴리오 분석해줘", "진단해줘" 등 **자신의 자산에 대한 분석을 요청할 경우**:
1. **절대로** "어떤 종목을 가지고 계신가요?"라고 되묻거나 채팅창에서 정보를 입력받으려 하지 마세요.
2. **반드시** "포트폴리오 데이터가 비어있습니다. 정확한 진단을 위해 먼저 보유 종목을 등록해주세요."라고 정중히 안내하세요.
3. 답변의 맨 마지막에는 **반드시** 다음 태그를 포함하여 바로가기 버튼을 생성하세요: [ACTION:CREATE_PORTFOLIO]
`;
            }
        } else {
            // Not logged in
            portfolioContext = `

[사용자의 포트폴리오 상태]
현재 사용자는 **로그인하지 않은 상태**입니다.

[⛔️ 필수 지침 - 절대 위반 금지]
사용자가 "내 포트폴리오 분석해줘" 등 **자신의 자산에 대한 분석을 요청할 경우**:

1. **상황 설명**: "앗, 포트폴리오 데이터가 없어서 아직 분석해드릴 수가 없네요."라고 
친절하게 설명해주세요.
2. **행동 유도**: "간단한 회원가입으로 나만의 포트폴리오를 만들고, 맞춤형 분석을 받아보세요!"라고 
기대감을 주며 부드럽게 권유해주세요.
3. **버튼 생성**: 답변의 맨 마지막 줄에 정확히 다음 태그를 출력하세요: [ACTION:GO_TO_PROFILE]
   - 🚨 **주의**: 태그를 '회원가입하러 가기' 등으로 번역하지 마세요. 오직 **[ACTION:GO_TO_PROFILE]** 라고만 출력해야 버튼이 정상적으로 작동합니다.
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
            const [commonData, personaData] = await Promise.all([
                import("@/lib/market-data").then(m => m.fetchCommonMarketData()),
                getPersonaMarketContext(personaId, allTickers)
            ]);

            let commonContext = "";
            if (commonData) {
                const { commonDataToPrompt } = await import("@/lib/market-data");
                commonContext = commonDataToPrompt(commonData);
            }

            if (personaData || commonContext) {
                marketDataContext = `\n\n${commonContext}\n\n${personaData || ""}`;
            }
        } catch (error) {
            console.error("[Chat] Market data fetch failed (non-blocking):", error);
            // 시장 데이터 실패해도 채팅은 계속 진행
        }

        // Build system message: Constitution > Persona > Portfolio > Market Data
        const systemMessage = `${CORE_CONSTITUTION}

═══ 당신의 페르소나 ═══
${persona.systemPrompt}

[중요 지침]
- **결론부터 말하세요 (BLUF)**: 설명하기 전에 "데이터상 매력적인 구간으로 보입니다" 또는 "지금은 관망이 필요해 보입니다" 등 당신의 **전문적 견해(Opinion)**를 먼저 밝히세요.
- **회피형 말투 금지**: "~하는 것이 중요합니다", "~를 체크해보세요" 등 유저에게 공을 넘기는 표현 금지.
- **법적 안전 준수**: "무조건 사세요", "지금이 저점입니다" 같은 확정적 표현 절대 금지. 대신 "확률적으로 유리한 구간", "분할 매수로 접근할 만한 가격대"처럼 표현하세요.
- **데이터 인용 필수**: 위 [ ] 안에 제공된 수치(PER, 낙폭, 이평선 괴리 등)를 근거로 논리를 펼치세요.
- **시각화 활용**: 수치 비교나 추세 설명이 필요하면 반드시 차트 데이터를 생성하세요.
  - 포맷: [CHART_DATA] {"type": "bar"|"line"|"pie", "title": "...", "data": [{"name": "X축", "val": 10}, ...], "dataKeys": ["val"]} [/CHART_DATA]
  - **주의**: 반드시 유효한 JSON 문법을 지켜야 합니다. (Key와 String 값은 반드시 큰따옴표(") 사용, 작은따옴표(') 사용 금지)
  - 차트는 설명 중간 적절한 위치에 삽입하세요.
- 존댓말(해요체/합쇼체) 사용
- **[언어 규칙]**: 기본적으로 **반드시 한국어**로 답변하세요. 단, 사용자가 영어나 베트남어로 질문하는 경우에만 해당 언어로 답변하세요.
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

import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getGuruById } from "@/lib/guru-personas";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Create Supabase ADMIN client for server-side (bypasses RLS)
// Falls back to anon key if service role key is not set
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { messages, personaId, sessionId, userId } = await req.json();

        // Get persona
        const persona = getGuruById(personaId);
        if (!persona) {
            return new Response(JSON.stringify({ error: "Persona not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch user's portfolio for context injection
        let portfolioContext = "";
        if (userId) {
            const { data: portfolioData } = await supabaseAdmin
                .from("portfolios")
                .select("ticker, quantity, avg_price")
                .eq("user_id", userId);

            if (portfolioData && portfolioData.length > 0) {
                const holdings = portfolioData
                    .map(
                        (p) =>
                            `- ${p.ticker}: ${p.quantity}주 (평균가: ${p.avg_price?.toLocaleString()}원)`
                    )
                    .join("\n");
                portfolioContext = `

[사용자의 현재 포트폴리오]
${holdings}

위 포트폴리오 정보를 참고하여, 사용자의 보유 종목에 대해 구체적으로 언급하며 조언해주세요. 예를 들어 "자네 삼성전자 포지션이 크군" 또는 "테슬라 평균가가 꽤 높은데" 같이 개인화된 대화를 해주세요.`;
            }
        }

        // Build system message with persona and portfolio context
        const systemMessage = `${persona.systemPrompt}${portfolioContext}

[중요 지침]
- 사용자가 질문한 언어로 대답하세요 (영어로 물으면 영어로, 한국어로 물으면 한국어로, 베트남어로 물으면 베트남어로)
- 특정 종목에 대해 "사라", "팔아라" 같은 직접적인 투자 조언은 피하세요
- 대신 분석 방법, 투자 원칙, 사고 프레임워크를 가르쳐주세요
- 이 대화는 교육 목적이며, 실제 투자 결정의 책임은 사용자에게 있음을 인식하세요`;

        // Save user message to database
        if (sessionId && messages.length > 0) {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage.role === "user") {
                await supabaseAdmin.from("chat_messages").insert({
                    session_id: sessionId,
                    role: "user",
                    content: lastUserMessage.content,
                });
            }
        }

        // Call OpenAI with streaming
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

        // Create a TransformStream for streaming response
        const encoder = new TextEncoder();

        let fullResponse = "";

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of response) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            fullResponse += content;
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                            );
                        }
                    }

                    // Save assistant message to database after streaming completes
                    if (sessionId && fullResponse) {
                        await supabaseAdmin.from("chat_messages").insert({
                            session_id: sessionId,
                            role: "assistant",
                            content: fullResponse,
                        });
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

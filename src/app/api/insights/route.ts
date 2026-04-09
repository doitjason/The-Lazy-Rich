import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { insightsRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Mark as dynamic to avoid build-time issues with environment variables
export const dynamic = "force-dynamic";

// Save insight (summarize conversation to 3 lines)
export async function POST(req: NextRequest) {
    try {
        const clientIp = getClientIp(req);
        
        const body = await req.json();
        const { userId, sessionId, messages } = body;

        if (!userId || !messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "올바른 요청 데이터가 필요합니다." },
                { status: 400 }
            );
        }

        // Limit message length
        const sanitizedMessages = messages.map((m: any) => ({
            role: m.role,
            content: typeof m.content === "string" ? m.content.slice(0, 2000) : "",
        })).slice(-20); // Only use the last 20 messages for insights

        const supabase = await createClient();

        // Security check: Validate the request comes from the authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== userId) {
            return NextResponse.json(
                { error: "인증되지 않은 사용자입니다." },
                { status: 401 }
            );
        }

        // Rate limit check
        const rateCheck = insightsRateLimiter.check(user.id || clientIp);
        if (!rateCheck.allowed) {
            return rateLimitResponse(rateCheck.retryAfterMs);
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "AI 서비스가 현재 설정되지 않았습니다." },
                { status: 503 }
            );
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Use GPT to summarize the conversation into 3 lines
        const conversationText = sanitizedMessages
            .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
            .join("\n");

        const summaryResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `당신은 투자 대화를 요약하는 전문가입니다. 
주어진 대화에서 가장 중요한 투자 인사이트 3가지를 추출하여 한국어로 요약해주세요.
형식:
1. [첫 번째 핵심 인사이트]
2. [두 번째 핵심 인사이트]  
3. [세 번째 핵심 인사이트]

각 줄은 간결하고 실행 가능한 조언이어야 합니다.`,
                },
                {
                    role: "user",
                    content: conversationText,
                },
            ],
            max_tokens: 300,
            temperature: 0.5,
        });

        const summary = summaryResponse.choices[0]?.message?.content || "";

        // Save to database
        const { data, error } = await supabase
            .from("saved_insights")
            .insert({
                user_id: userId,
                summary: summary,
            })
            .select()
            .single();

        if (error) {
            console.error("Insight save error:", error);
            return NextResponse.json(
                { error: "인사이트 저장 중 오류가 발생했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({ insight: data, summary });
    } catch (error) {
        console.error("Insights API Error:", error);
        return NextResponse.json(
            { error: "서버 내부 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// Get saved insights for a user
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
        return NextResponse.json(
            { error: "사용자 ID가 필요합니다." },
            { status: 400 }
        );
    }

    const supabase = await createClient();

    // Security check: Validate the request comes from the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
        return NextResponse.json(
            { error: "인증되지 않은 사용자입니다." },
            { status: 401 }
        );
    }

    const { data, error } = await supabase
        .from("saved_insights")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json(
            { error: "Failed to fetch insights" },
            { status: 500 }
        );
    }

    return NextResponse.json({ insights: data });
}

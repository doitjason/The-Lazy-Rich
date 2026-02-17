import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Mark as dynamic to avoid build-time issues with environment variables
export const dynamic = "force-dynamic";

function getClients() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
    );
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || "placeholder",
    });
    return { supabase, openai };
}

// Save insight (summarize conversation to 3 lines)
export async function POST(req: NextRequest) {
    try {
        const { userId, sessionId, messages } = await req.json();

        if (!userId || !messages || messages.length === 0) {
            return NextResponse.json(
                { error: "userId and messages are required" },
                { status: 400 }
            );
        }

        const { supabase, openai } = getClients();

        // Use GPT to summarize the conversation into 3 lines
        const conversationText = messages
            .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
            .join("\n");

        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not configured.");
        }

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
                { error: "Failed to save insight" },
                { status: 500 }
            );
        }

        return NextResponse.json({ insight: data, summary });
    } catch (error) {
        console.error("Insights API Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Get saved insights for a user
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
        return NextResponse.json(
            { error: "userId is required" },
            { status: 400 }
        );
    }

    const { supabase } = getClients();

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

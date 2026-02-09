import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Create a new chat session
export async function POST(req: NextRequest) {
    try {
        const { userId, personaId } = await req.json();

        if (!userId || !personaId) {
            return NextResponse.json(
                { error: "userId and personaId are required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("chat_sessions")
            .insert({
                user_id: userId,
                persona_id: personaId,
            })
            .select()
            .single();

        if (error) {
            console.error("Session creation error:", error);
            return NextResponse.json(
                { error: "Failed to create session" },
                { status: 500 }
            );
        }

        return NextResponse.json({ session: data });
    } catch (error) {
        console.error("Session API Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Get sessions for a user
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
        return NextResponse.json(
            { error: "userId is required" },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json(
            { error: "Failed to fetch sessions" },
            { status: 500 }
        );
    }

    return NextResponse.json({ sessions: data });
}

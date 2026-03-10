import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mark as dynamic to avoid build-time issues with environment variables
export const dynamic = "force-dynamic";

// Create or find a chat session
export async function POST(req: NextRequest) {
    try {
        const { userId, mentorId } = await req.json();

        if (!userId || !mentorId) {
            return NextResponse.json(
                { error: "userId and mentorId are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Security: Validate authenticated user matches requested userId
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid user session" },
                { status: 401 }
            );
        }

        // 1. Check if a session already exists for this mentor
        const { data: existingSession, error: findError } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("user_id", userId)
            .eq("persona_id", mentorId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingSession) {
            // Optimization: Fetch the last few messages together with the session to improve load speed
            const { data: messages } = await supabase
                .from("chat_messages")
                .select("id, role, content")
                .eq("session_id", existingSession.id)
                .order("created_at", { ascending: false })
                .limit(50);

            return NextResponse.json({ 
                session: existingSession,
                messages: (messages || []).reverse() // Chronological order
            });
        }

        // 2. If not, create a new one
        const { data, error } = await supabase
            .from("chat_sessions")
            .insert({
                user_id: userId,
                persona_id: mentorId,
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

        return NextResponse.json({ 
            session: data,
            messages: [] // New session has no messages
        });
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

    const supabase = await createClient();

    // Security: Validate authenticated user matches requested userId
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
        return NextResponse.json(
            { error: "Unauthorized: Invalid user session" },
            { status: 401 }
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

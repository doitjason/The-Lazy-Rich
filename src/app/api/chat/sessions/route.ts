import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mark as dynamic to avoid build-time issues with environment variables
export const dynamic = "force-dynamic";

// Create or find a chat session
export async function POST(req: NextRequest) {
    try {
        const { userId, personaId } = await req.json();

        if (!userId || !personaId) {
            return NextResponse.json(
                { error: "userId and personaId are required" },
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

        // 1. Check if a session already exists for this persona
        const { data: existingSession, error: findError } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("user_id", userId)
            .eq("persona_id", personaId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingSession) {
            return NextResponse.json({ session: existingSession });
        }

        // 2. If not, create a new one
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

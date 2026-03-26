import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
        return NextResponse.json(
            { error: "sessionId is required" },
            { status: 400 }
        );
    }

    const supabase = await createClient();

    // Security: Validate the session belongs to the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    // Verify session ownership and fetch messages in parallel or combined
    // Best way: fetch messages with only needed fields and verify session owner in one go if possible
    // For now, let's just fetch the messages and the session info to verify
    
    // Optimized: Fetch messages with only required fields
    const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at, chat_sessions!inner(user_id)")
        .eq("session_id", sessionId)
        .eq("chat_sessions.user_id", user.id) // Ensure cross-check
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Fetch messages error:", error);
        return NextResponse.json(
            { error: "Failed to fetch messages or unauthorized" },
            { status: 500 }
        );
    }

    // Format and reverse to show in chronological (ascending) order for the UI
    const formattedMessages = data ? data.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        // created_at: m.created_at // optional
    })).reverse() : [];

    console.log(`[API] Found ${formattedMessages.length} messages for session ${sessionId}`);
    return NextResponse.json({ messages: formattedMessages });
}

export async function DELETE(req: NextRequest) {
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
        return NextResponse.json(
            { error: "sessionId is required" },
            { status: 400 }
        );
    }

    const supabase = await createClient();

    // Security: Validate the session belongs to the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    // Verify session ownership
    const { data: session } = await supabase
        .from("chat_sessions")
        .select("user_id")
        .eq("id", sessionId)
        .single();

    if (!session || session.user_id !== user.id) {
        return NextResponse.json(
            { error: "Unauthorized: Session not found or not owned by user" },
            { status: 401 }
        );
    }

    const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("session_id", sessionId);

    if (error) {
        console.error("Delete messages error:", error);
        return NextResponse.json(
            { error: "Failed to delete messages" },
            { status: 500 }
        );
    }

    console.log(`[API] Deleted messages for session ${sessionId}`);
    return NextResponse.json({ success: true });
}


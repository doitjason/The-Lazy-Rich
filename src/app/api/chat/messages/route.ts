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

    const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false }) // Get newest first
        .limit(100); // Safety limit: last 100 messages

    if (error) {
        console.error("Fetch messages error:", error);
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        );
    }

    // Reverse to show in chronological (ascending) order for the UI
    const formattedMessages = data ? [...data].reverse() : [];

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


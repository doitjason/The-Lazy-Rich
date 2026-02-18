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

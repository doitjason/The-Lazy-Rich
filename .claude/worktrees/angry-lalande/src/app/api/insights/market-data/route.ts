import { NextResponse } from "next/server";
import { fetchCommonMarketData } from "@/lib/market-data";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const data = await fetchCommonMarketData();
        
        if (!data) {
            return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
        }

        // 24-hour Edge Cache (86400 seconds)
        // stale-while-revalidate allows serving stale content for 1 hour while updating in background
        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
            },
        });
    } catch (error) {
        console.error("[API] Market data error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

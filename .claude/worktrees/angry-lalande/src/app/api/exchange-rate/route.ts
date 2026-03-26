import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

// Allow Vercel Data Cache
export const dynamic = "auto";

const yahooFinance = new YahooFinance();

export async function GET(request: NextRequest) {
    try {
        // Fetch USD/KRW exchange rate from Yahoo Finance
        const result = await yahooFinance.quote("USDKRW=X");
        
        if (!result || !result.regularMarketPrice) {
            throw new Error("Failed to fetch exchange rate from Yahoo Finance");
        }

        const rate = result.regularMarketPrice;

        return NextResponse.json(
            { 
                rate,
                timestamp: new Date().toISOString(),
                source: "Yahoo Finance"
            },
            {
                headers: {
                    // Cache for 1 hour (3600 seconds), stale-while-revalidate for 24 hours
                    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
                },
            }
        );
    } catch (error) {
        console.error("[Exchange Rate API] Error:", error);
        
        // Fallback to a reasonable default or previous known good if possible
        // For now, return a 500 but with a fallback value in the body for safety
        return NextResponse.json(
            { 
                rate: 1400, 
                error: error instanceof Error ? error.message : "Unknown error",
                isFallback: true 
            },
            { status: 500 }
        );
    }
}

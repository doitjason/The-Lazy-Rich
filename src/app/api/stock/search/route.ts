import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

// Create YahooFinance instance (required for v3)
const yahooFinance = new YahooFinance();

type SearchQuote = {
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchDisp?: string;
    typeDisp?: string;
    isYahooFinance?: boolean;
    quoteType?: string;
};

type SearchResults = {
    quotes?: SearchQuote[];
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 1) {
        return NextResponse.json({ results: [] });
    }

    try {
        console.log(`[Stock Search] Searching for: ${query}`);

        const searchResults = await yahooFinance.search(query, {
            quotesCount: 10,
            newsCount: 0,
        }) as SearchResults;

        console.log(`[Stock Search] Raw results:`, JSON.stringify(searchResults, null, 2));

        const quotes = searchResults.quotes || [];

        const results = quotes
            .filter((q) => q.symbol && (q.quoteType === "EQUITY" || q.quoteType === "ETF" || !q.quoteType))
            .map((q) => ({
                ticker: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchDisp || "",
                type: q.quoteType || "Equity",
            }));

        console.log(`[Stock Search] Filtered results count: ${results.length}`);

        return NextResponse.json({ results });
    } catch (error: unknown) {
        console.error("[Stock Search] Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ results: [], error: message });
    }
}

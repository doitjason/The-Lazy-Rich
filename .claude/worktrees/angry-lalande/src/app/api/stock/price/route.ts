import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

// Create YahooFinance instance (required for v3)
const yahooFinance = new YahooFinance();

type QuoteResult = {
    symbol?: string;
    regularMarketPrice?: number;
    currency?: string;
    shortName?: string;
    longName?: string;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
};

// Check if ticker is Korean stock code (6 digits)
function isKoreanTicker(ticker: string): boolean {
    return /^\d{6}$/.test(ticker);
}

// Try to fetch quote with fallback suffixes for Korean stocks
async function fetchQuoteWithFallback(ticker: string): Promise<QuoteResult | null> {
    const upperTicker = ticker.toUpperCase();

    // Korean stock: try .KS (KOSPI) first, then .KQ (KOSDAQ)
    if (isKoreanTicker(upperTicker)) {
        // Try KOSPI
        try {
            const quote = await yahooFinance.quote(`${upperTicker}.KS`) as QuoteResult;
            if (quote && quote.regularMarketPrice) return quote;
        } catch { /* KOSPI failed, try KOSDAQ */ }

        // Try KOSDAQ
        try {
            const quote = await yahooFinance.quote(`${upperTicker}.KQ`) as QuoteResult;
            if (quote && quote.regularMarketPrice) return quote;
        } catch { /* KOSDAQ also failed */ }

        return null;
    }

    // US/International stock: use as-is
    const quote = await yahooFinance.quote(upperTicker) as QuoteResult;
    return quote;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");

    if (!ticker) {
        return NextResponse.json(
            { error: "Ticker parameter is required" },
            { status: 400 }
        );
    }

    try {
        const quote = await fetchQuoteWithFallback(ticker);

        if (!quote || !quote.regularMarketPrice) {
            return NextResponse.json(
                { error: "Could not fetch price for this ticker" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ticker: quote.symbol,
            price: quote.regularMarketPrice,
            currency: quote.currency,
            name: quote.shortName || quote.longName,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
        });
    } catch (error: unknown) {
        console.error("Yahoo Finance Error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch stock data";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

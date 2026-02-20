import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

// Create YahooFinance instance (required for v3)
const yahooFinance = new YahooFinance();

type HistoricalResult = {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjClose?: number;
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const period = searchParams.get("period"); // 1Y, 3Y, 5Y, 10Y, 20Y, 30Y

    if (!ticker) {
        return NextResponse.json({ error: "Ticker parameter is required" }, { status: 400 });
    }

    if (!period) {
        return NextResponse.json({ error: "Period parameter is required" }, { status: 400 });
    }

    try {
        // Calculate date range based on period
        const years = parseInt(period.replace("Y", ""));
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - years);

        console.log(`[Historical] Fetching ${ticker} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Get historical data
        const historical = await yahooFinance.historical(ticker.toUpperCase(), {
            period1: startDate,
            period2: endDate,
            interval: "1mo", // Monthly data for chart
        }) as HistoricalResult[];

        if (!historical || historical.length === 0) {
            return NextResponse.json({ error: "No historical data available" }, { status: 404 });
        }

        // Get current quote for latest price
        const quote = await yahooFinance.quote(ticker.toUpperCase()) as any;
        const currentPrice = quote?.regularMarketPrice || historical[historical.length - 1]?.close;

        // First record is the past price
        const pastPrice = historical[0]?.close || historical[0]?.adjClose;

        // Build full chart data (monthly) for accurate calculations
        const chartData = historical.map((item) => {
            const date = new Date(item.date);
            return {
                name: date.toISOString().split('T')[0], // YYYY-MM-DD
                price: item.adjClose || item.close, // Use Adjusted Close for dividends/splits if available
            };
        });

        return NextResponse.json({
            ticker: ticker.toUpperCase(),
            period,
            pastPrice,
            currentPrice,
            currency: quote?.currency || "USD",
            name: quote?.shortName || quote?.longName || ticker,
            quoteType: quote?.quoteType || "UNKNOWN",
            isEtf: quote?.quoteType === "ETF",
            dataPoints: historical.length,
            chartData,
            // Actual data start date (in case stock didn't exist for full period)
            actualStartDate: historical[0]?.date,
            actualEndDate: historical[historical.length - 1]?.date,
        });
    } catch (error: unknown) {
        console.error("[Historical] Error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch historical data";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

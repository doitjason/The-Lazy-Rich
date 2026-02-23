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

        // Get historical data for the stock
        const historical = await yahooFinance.historical(ticker.toUpperCase(), {
            period1: startDate,
            period2: endDate,
            interval: "1mo", // Monthly data for chart
        }) as HistoricalResult[];

        if (!historical || historical.length === 0) {
            return NextResponse.json({ error: "No historical data available" }, { status: 404 });
        }

        // Fetch USD/KRW exchange rate historical data
        let exchangeRateHistorical: HistoricalResult[] = [];
        try {
            exchangeRateHistorical = await yahooFinance.historical("KRW=X", {
                period1: startDate,
                period2: endDate,
                interval: "1mo"
            }) as HistoricalResult[];
        } catch (e) {
            console.log("Could not fetch KRW=X historical, trying USDKRW=X", e);
            try {
                exchangeRateHistorical = await yahooFinance.historical("USDKRW=X", {
                    period1: startDate,
                    period2: endDate,
                    interval: "1mo"
                }) as HistoricalResult[];
            } catch (err) {
                console.log("Failed both KRW=X and USDKRW=X", err);
            }
        }

        const exchangeRateMap = new Map<string, number>();
        for (const er of exchangeRateHistorical) {
            const key = new Date(er.date).toISOString().substring(0, 7); // YYYY-MM
            if (er.adjClose || er.close) exchangeRateMap.set(key, er.adjClose || er.close);
        }

        // Get current quotes
        const [quote, erQuote] = await Promise.all([
            yahooFinance.quote(ticker.toUpperCase()).catch(() => null) as any,
            yahooFinance.quote("KRW=X").catch(() => null) as any
        ]);

        const currentPrice = quote?.regularMarketPrice || historical[historical.length - 1]?.close;
        const currentExchangeRate = erQuote?.regularMarketPrice || Array.from(exchangeRateMap.values()).pop() || 1350;

        // First record is the past price
        const pastPrice = historical[0]?.close || historical[0]?.adjClose;
        const pastDateKey = new Date(historical[0]?.date).toISOString().substring(0, 7);
        const pastExchangeRate = exchangeRateMap.get(pastDateKey) || currentExchangeRate;

        // Build full chart data (monthly) for accurate calculations
        const chartData = historical.map((item) => {
            const date = new Date(item.date);
            const key = date.toISOString().substring(0, 7);
            const er = exchangeRateMap.get(key) || pastExchangeRate; // Use mapped month ER or fallback
            return {
                name: date.toISOString().split('T')[0], // YYYY-MM-DD
                price: item.adjClose || item.close, // Use Adjusted Close for dividends/splits if available
                exchangeRate: er
            };
        });

        return NextResponse.json({
            ticker: ticker.toUpperCase(),
            period,
            pastPrice,
            currentPrice,
            pastExchangeRate,
            currentExchangeRate,
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

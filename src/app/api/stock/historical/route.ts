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

        // Fetch USD/KRW exchange rate historical data - Prioritize KRW=X for better historical accuracy
        let exchangeRateHistorical: HistoricalResult[] = [];
        const erTickers = ["KRW=X", "USDKRW=X"];

        for (const erTicker of erTickers) {
            try {
                exchangeRateHistorical = await yahooFinance.historical(erTicker, {
                    period1: startDate,
                    period2: endDate,
                    interval: "1mo"
                }) as HistoricalResult[];
                if (exchangeRateHistorical && exchangeRateHistorical.length > 0) {
                    console.log(`[Historical] Successfully fetched exchange rate using ${erTicker}`);
                    break;
                }
            } catch (e) {
                console.log(`Could not fetch ${erTicker} historical`, e);
            }
        }

        const exchangeRateMap = new Map<string, number>();

        // KRW exchange rates typically range between 700 and 1600 since the 90s.
        // Values like 0.11 or 894 repeated for years are data errors.
        for (const er of exchangeRateHistorical) {
            const key = new Date(er.date).toISOString().substring(0, 7); // YYYY-MM
            const rate = er.adjClose || er.close;
            // Filter out extreme outliers (Yahoo Finance bugs like 0.11 or 1.1)
            // Anything below 500 KRW/USD is definitely an error in a 20-30 year context.
            if (rate && rate > 500) {
                exchangeRateMap.set(key, rate);
            }
        }

        // Get current quotes
        const [quote, erQuote] = await Promise.all([
            yahooFinance.quote(ticker.toUpperCase()).catch(() => null) as any,
            yahooFinance.quote("KRW=X").catch(() => null) as any
        ]);

        // Helper to get safe price: handles negative adjClose bugs and zero values
        const getSafePrice = (item: any) => {
            if (!item) return 0;
            let p = item.adjClose !== undefined && item.adjClose !== null ? item.adjClose : item.close;
            // Yahoo Finance bugs: adjClose can be negative or 0 while close is correct
            if (p <= 0 && item.close && item.close > 0) p = item.close;
            return p > 0 ? p : 0;
        };

        // Filter out records where price is effectively 0 to prevent MDD -100% bugs
        const validHistorical = historical.filter(h => getSafePrice(h) > 0);

        if (validHistorical.length === 0) {
            return NextResponse.json({ error: "No valid historical price data available" }, { status: 404 });
        }

        const currentPrice = quote?.regularMarketPrice || validHistorical[validHistorical.length - 1]?.close;
        const currentExchangeRate = erQuote?.regularMarketPrice || Array.from(exchangeRateMap.values()).pop() || 1350;

        // Better fallback for past rate: 
        // If data for specific month is missing, find the CLOSEST available PREVIOUS month in the map
        const getClosestExchangeRate = (targetKey: string) => {
            if (exchangeRateMap.has(targetKey)) return exchangeRateMap.get(targetKey)!;

            const sortedKeys = Array.from(exchangeRateMap.keys()).sort();
            if (sortedKeys.length === 0) return currentExchangeRate;

            // Find closest available date (preferably before or exactly the targetKey)
            let closest = sortedKeys[0];
            for (const k of sortedKeys) {
                if (k <= targetKey) closest = k;
                else break;
            }
            return exchangeRateMap.get(closest) || currentExchangeRate;
        };

        const pastDateKey = new Date(validHistorical[0]?.date).toISOString().substring(0, 7);
        const pastExchangeRate = getClosestExchangeRate(pastDateKey);
        const pastPrice = getSafePrice(validHistorical[0]);

        // Build full chart data (monthly) for accurate calculations
        const chartData = validHistorical.map((item) => {
            const date = new Date(item.date);
            const key = date.toISOString().substring(0, 7);
            const er = getClosestExchangeRate(key);
            return {
                name: date.toISOString().split('T')[0], // YYYY-MM-DD
                price: getSafePrice(item),
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

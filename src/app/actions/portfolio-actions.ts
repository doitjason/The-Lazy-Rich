"use server";

import { fetchEnrichedPortfolio } from "@/lib/market-data";
import { EnrichedPortfolioItem } from "@/lib/market-types";

export async function getPortfolioData(tickers: string[]): Promise<Record<string, EnrichedPortfolioItem>> {
    const data = await fetchEnrichedPortfolio(tickers);
    // but we need to ensure return types are simple objects)
    return JSON.parse(JSON.stringify(data));
}

export async function getDividendCalendar(tickers: string[]) {
    const { fetchDividendCalendar } = await import("@/lib/market-data");
    const data = await fetchDividendCalendar(tickers);
    return JSON.parse(JSON.stringify(data));
}

export async function getBenchmarkData() {
    const { fetchEnrichedPortfolio } = await import("@/lib/market-data");
    const data = await fetchEnrichedPortfolio(["SPY"]);
    // Return SPY ETF change percent (or 0 if failed)
    return data["SPY"]?.changePercent || 0;
}

export async function getBenchmarkHistory(holdings: { ticker: string; quantity: number }[], range: string) {
    const { fetchBenchmarkHistory } = await import("@/lib/market-data");
    // Validate range to match the type
    const validRange = ["1W", "1M", "3M", "6M", "1Y", "YTD"].includes(range) ? range as "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD" : "1M";
    const data = await fetchBenchmarkHistory(holdings, validRange);
    return data;
}

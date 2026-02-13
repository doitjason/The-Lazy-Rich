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

"use server";

import { fetchEnrichedPortfolio } from "@/lib/market-data";
import { EnrichedPortfolioItem } from "@/lib/market-types";

export async function getPortfolioData(tickers: string[]): Promise<Record<string, EnrichedPortfolioItem>> {
    const data = await fetchEnrichedPortfolio(tickers);
    // Serialize data if necessary (Next.js handles JSON serialization for server actions automatically, 
    // but we need to ensure return types are simple objects)
    return JSON.parse(JSON.stringify(data));
}

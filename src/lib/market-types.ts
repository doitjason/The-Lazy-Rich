
export interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    name: string;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    fiftyDayAverage?: number;
    twoHundredDayAverage?: number;
}

export interface EnrichedPortfolioItem extends StockQuote {
    sector?: string;
    dividendYield?: number;
    sparkline: { date: string; price: number }[];
}

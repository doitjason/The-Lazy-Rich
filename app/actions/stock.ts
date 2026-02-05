"use server";

import yahooFinance from 'yahoo-finance2';

interface StockData {
    date: string;
    value: number;
}

interface StockResult {
    series: StockData[];
    currentVal: number;
    initialVal: number;
    percentage: number;
    error?: string;
}

export async function fetchStockHistory(ticker: string, startDate: string, amount: number): Promise<StockResult> {
    try {
        if (!ticker || !startDate || !amount) {
            return { series: [], currentVal: 0, initialVal: 0, percentage: 0, error: 'Invalid input' };
        }

        const queryOptions = { period1: startDate, interval: '1mo' as const }; // Monthly data for smoother chart
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await yahooFinance.chart(ticker, queryOptions);

        if (!result || !result.quotes || result.quotes.length === 0) {
            return { series: [], currentVal: 0, initialVal: 0, percentage: 0, error: 'No data found' };
        }

        const quotes = result.quotes;

        // Find initial price (first available valid closing price)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firstQuote = quotes.find((q: any) => q.close);
        if (!firstQuote || !firstQuote.close) {
            return { series: [], currentVal: 0, initialVal: 0, percentage: 0, error: 'Invalid data' };
        }

        const initialPrice = firstQuote.close;
        const shares = amount / initialPrice;

        // Simplify series: Take one point per year to reduce noise if needed, or keep monthly.
        // Let's keep monthly but ensure unique keys if needed. For UI, Month-Year is better.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedSeries = quotes.map((q: any) => {
            if (!q.date || !q.close) return null;
            return {
                date: q.date.toISOString().slice(0, 7), // YYYY-MM
                value: Math.round(q.close * shares)
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).filter((item: any) => item !== null) as StockData[];

        const currentVal = formattedSeries[formattedSeries.length - 1].value;
        const initialVal = amount;
        const percentage = Math.round(((currentVal - initialVal) / initialVal) * 100);

        return {
            series: formattedSeries,
            currentVal,
            initialVal,
            percentage
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error("Yahoo Finance Error:", err);
        return { series: [], currentVal: 0, initialVal: 0, percentage: 0, error: err.message || 'Failed to fetch data' };
    }
}

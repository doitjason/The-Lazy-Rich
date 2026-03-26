// Price Service
// This file now only contains type definitions.
// Real data is fetched from Yahoo Finance API endpoints:
// - /api/stock/price - Real-time stock prices
// - /api/stock/search - Stock search
// - /api/stock/historical - Historical prices for Regret Calculator

export interface RegretResult {
    ticker: string;
    name: string;
    initialInvestment: number;
    period: string;
    pastPrice: number;
    currentPrice: number;
    currentValue: number;
    profit: number;
    returnRate: number;
    multiple: number;
    chartData: { name: string; value: number; stockPrice?: number }[];
    actualPeriod?: string;
}

// DEPRECATED: MOCK_STOCKS has been removed.
// All stock data is now fetched from Yahoo Finance API.

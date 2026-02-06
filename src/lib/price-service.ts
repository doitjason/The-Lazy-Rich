// Mock Data for "What If" Calculator
// Real API (Yahoo Finance) will be integrated in Day 11.

export interface StockData {
    ticker: string;
    name: string;
    history: {
        "1Y": number;
        "3Y": number;
        "5Y": number;
        "10Y": number;
        "20Y": number;
        "30Y": number;
    };
    currentPrice: number;
}

export const MOCK_STOCKS: Record<string, StockData> = {
    AAPL: {
        ticker: "AAPL",
        name: "Apple Inc.",
        currentPrice: 175.50,
        history: {
            "1Y": 150.00,
            "3Y": 125.00,
            "5Y": 45.00,
            "10Y": 20.00,
            "20Y": 0.50,
            "30Y": 0.25,
        },
    },
    TSLA: {
        ticker: "TSLA",
        name: "Tesla, Inc.",
        currentPrice: 170.20,
        history: {
            "1Y": 190.00,
            "3Y": 230.00,
            "5Y": 15.00,
            "10Y": 1.50,
            "20Y": 1.50,
            "30Y": 1.50,
        },
    },
    BTC: {
        ticker: "BTC",
        name: "Bitcoin",
        currentPrice: 63200.00,
        history: {
            "1Y": 28000.00,
            "3Y": 55000.00,
            "5Y": 5000.00,
            "10Y": 400.00,
            "20Y": 0.01,
            "30Y": 0.01,
        },
    },
    SPY: {
        ticker: "SPY",
        name: "S&P 500 ETF",
        currentPrice: 510.00,
        history: {
            "1Y": 400.00,
            "3Y": 390.00,
            "5Y": 280.00,
            "10Y": 180.00,
            "20Y": 110.00,
            "30Y": 45.00,
        },
    },
    NVDA: {
        ticker: "NVDA",
        name: "NVIDIA Corp.",
        currentPrice: 880.00,
        history: {
            "1Y": 270.00,
            "3Y": 150.00,
            "5Y": 40.00,
            "10Y": 5.00,
            "20Y": 2.00,
            "30Y": 0.80,
        },
    },
};

export function getStockData(ticker: string): StockData | null {
    const upperTicker = ticker.toUpperCase();
    return MOCK_STOCKS[upperTicker] || null;
}

export interface RegretResult {
    ticker: string;
    initialInvestment: number;
    period: string;
    pastPrice: number;
    currentPrice: number;
    currentValue: number;
    profit: number;
    returnRate: number;
    multiple: number;
    chartData: { name: string; value: number }[];
}

export function calculateRegret(
    ticker: string,
    amount: number,
    period: "1Y" | "3Y" | "5Y" | "10Y" | "20Y" | "30Y"
): RegretResult | null {
    const stock = getStockData(ticker);
    if (!stock) return null;

    const pastPrice = stock.history[period];
    const shares = amount / pastPrice;
    const currentValue = shares * stock.currentPrice;
    const profit = currentValue - amount;
    const returnRate = (profit / amount) * 100;
    const multiple = currentValue / amount;

    // Simple interpolation for chart (Cash vs Stock)
    // In a real app, we would use actual historical data points
    // Here we just create a start and end point for the Area Chart
    const chartData = [
        { name: "Start", value: amount },
        { name: "Now", value: Math.round(currentValue) },
    ];

    return {
        ticker: stock.ticker,
        initialInvestment: amount,
        period,
        pastPrice,
        currentPrice: stock.currentPrice,
        currentValue,
        profit,
        returnRate,
        multiple,
        chartData,
    };
}

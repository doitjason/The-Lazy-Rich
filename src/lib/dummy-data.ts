import { LucideIcon, TrendingUp, TrendingDown, DollarSign, Wallet, PieChart, Activity } from "lucide-react";

// --- Types ---
export interface Asset {
    id: string;
    name: string;
    ticker: string;
    amount: number; // Quantity
    price: number; // Current Price per unit
    change24h: number; // Percentage
    type: "crypto" | "stock" | "cash";
    color: string;
}

export interface PortfolioData {
    totalBalance: number;
    dailyChange: number;
    dailyChangePercent: number;
    assets: Asset[];
}

export interface NewsItem {
    id: string;
    source: string;
    time: string;
    title: string;
    sentiment: "positive" | "negative" | "neutral";
    imageUrl?: string;
}

export interface GuruPersona {
    id: string;
    name: string;
    tag: string;
    description: string;
    color: string;
    avatarInitials: string;
    introMessage: string;
}

export interface ChatMessage {
    id: string;
    role: "user" | "ai";
    content: string;
    timestamp: Date;
}

// --- Mock Data ---

export const PORTFOLIO_DATA: PortfolioData = {
    totalBalance: 124500.00,
    dailyChange: 1240.50,
    dailyChangePercent: 1.01,
    assets: [
        { id: "1", name: "Bitcoin", ticker: "BTC", amount: 0.45, price: 63200.00, change24h: 1.2, type: "crypto", color: "#F7931A" },
        { id: "2", name: "Apple Inc.", ticker: "AAPL", amount: 18.5, price: 175.50, change24h: -0.4, type: "stock", color: "#A2AAAD" },
        { id: "3", name: "Ethereum", ticker: "ETH", amount: 1.2, price: 3400.00, change24h: 3.5, type: "crypto", color: "#627EEA" },
        { id: "4", name: "Tesla, Inc.", ticker: "TSLA", amount: 4.0, price: 170.20, change24h: -1.1, type: "stock", color: "#E31937" },
        { id: "5", name: "Nvidia Corp.", ticker: "NVDA", amount: 5.2, price: 880.00, change24h: 4.8, type: "stock", color: "#76B900" },
        { id: "6", name: "US Dollar", ticker: "USD", amount: 12450, price: 1.00, change24h: 0.0, type: "cash", color: "#85bb65" },
    ],
};

export const NEWS_DATA: NewsItem[] = [
    {
        id: "1",
        source: "Bloomberg",
        time: "2h ago",
        title: "Fed Signals Potential Rate Cut in Upcoming September Meeting",
        sentiment: "positive",
    },
    {
        id: "2",
        source: "Reuters",
        time: "4h ago",
        title: "Consumer Spending Drops for Third Straight Month as Inflation Persists",
        sentiment: "negative",
    },
    {
        id: "3",
        source: "CNBC",
        time: "5h ago",
        title: "Tech Stocks Surge Amid AI Optimism and Record Earnings Reports",
        sentiment: "positive",
    },
    {
        id: "4",
        source: "App Insider",
        time: "8h ago",
        title: "New Portfolio Management Tools Released for Premium Members",
        sentiment: "neutral",
    },
    {
        id: "5",
        source: "WSJ",
        time: "10h ago",
        title: "Global Markets Rally Following Strong Jobs Data",
        sentiment: "positive",
    },
];

export const GURU_PERSONAS: GuruPersona[] = [
    {
        id: "buffett",
        name: "Warren Buffett",
        tag: "Value Investor",
        description: "Focus on intrinsic value and long-term moats.",
        color: "bg-blue-500",
        avatarInitials: "WB",
        introMessage: "Rule No.1: Never lose money. Rule No.2: Never forget Rule No.1. How can I help you analyze a business today?",
    },
    {
        id: "bogle",
        name: "John Bogle",
        tag: "Index Fund",
        description: "Low-cost passive investing for the masses.",
        color: "bg-green-500",
        avatarInitials: "JB",
        introMessage: "Don't look for the needle in the haystack. Just buy the haystack! Are you thinking about your asset allocation?",
    },
    {
        id: "graham",
        name: "Ben Graham",
        tag: "Safety",
        description: "The father of value and margin of safety.",
        color: "bg-yellow-500",
        avatarInitials: "BG",
        introMessage: "An investment operation is one which, upon thorough analysis, promises safety of principal and an adequate return. Are you speculating or investing?",
    },
    {
        id: "lynch",
        name: "Peter Lynch",
        tag: "Growth",
        description: "Invest in what you know and understand.",
        color: "bg-purple-500",
        avatarInitials: "PL",
        introMessage: "Behind every stock is a company. Find out what it's doing. What local business have you noticed lately?",
    },
];

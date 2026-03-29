"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Currency = "KRW" | "USD";

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    exchangeRate: number; // 1 USD = X KRW
    formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
    formatCompactNumber: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<Currency>("KRW"); // Default to KRW
    const [exchangeRate, setExchangeRate] = useState(1400); // Default fallback

    // Fetch real-time exchange rate on mount
    useEffect(() => {
        const fetchRate = async () => {
            try {
                const res = await fetch("/api/exchange-rate");
                if (!res.ok) throw new Error("Failed to fetch rates from internal API");
                const data = await res.json();
                if (data.rate) {
                    setExchangeRate(data.rate);
                }
            } catch (error) {
                console.error("Exchange rate fetch failed, using fallback:", error);
                // Keep default 1400
            }
        };

        fetchRate();
    }, []);

    // Persist to localStorage (client-side only)
    useEffect(() => {
        const saved = localStorage.getItem("core-currency");
        if (saved === "USD" || saved === "KRW") {
            setCurrency(saved);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("core-currency", currency);
    }, [currency]);

    const formatCurrency = (value: number, options?: Intl.NumberFormatOptions) => {
        if (currency === "KRW") {
            // KRW formatting: Uses '원' suffix instead of symbol prefix
            return `${new Intl.NumberFormat("ko-KR", {
                style: "decimal",
                maximumFractionDigits: 0,
                ...options,
            }).format(value)}원`;
        } else {
            // USD formatting
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                ...options,
            }).format(value);
        }
    };

    const formatCompactNumber = (value: number) => {
        if (currency === "KRW") {
            const format = (num: number, digits = 1) => num.toLocaleString(undefined, { 
                maximumFractionDigits: digits,
                minimumFractionDigits: 0
            });
            if (value >= 1000000000000) return `${format(value / 1000000000000)}조`;
            if (value >= 100000000) return `${format(value / 100000000)}억`;
            if (value >= 10000) return `${format(value / 10000, 0)}만`;
            return value.toLocaleString();
        } else {
            return new Intl.NumberFormat("en-US", {
                notation: "compact",
                maximumFractionDigits: 1,
            }).format(value);
        }
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate, formatCurrency, formatCompactNumber }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}

"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StockSearchInput } from "@/components/ui/StockSearchInput";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RegretResult {
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
    chartData: { name: string; value: number }[];
    actualPeriod?: string;
}

export function RegretCalculator() {
    const { currency, exchangeRate, formatCurrency, formatCompactNumber } = useCurrency();
    const [ticker, setTicker] = useState("");
    const [stockName, setStockName] = useState("");
    const [amount, setAmount] = useState<number>(1000000);
    const [period, setPeriod] = useState<"1Y" | "3Y" | "5Y" | "10Y" | "20Y" | "30Y">("10Y");
    const [result, setResult] = useState<RegretResult | null>(null);
    const [isCalculated, setIsCalculated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update default amount when currency changes
    useEffect(() => {
        if (currency === "KRW") {
            setAmount(1000000);
        } else {
            setAmount(1000);
        }
        setIsCalculated(false);
        setResult(null);
    }, [currency]);

    const handleStockSelect = (selectedTicker: string, name?: string) => {
        setTicker(selectedTicker);
        setStockName(name || selectedTicker);
        setIsCalculated(false);
        setResult(null);
    };

    const onCalculate = async () => {
        if (!ticker) return;

        setIsLoading(true);
        setError(null);

        try {
            // Fetch historical data from API
            const res = await fetch(`/api/stock/historical?ticker=${encodeURIComponent(ticker)}&period=${period}`);
            const data = await res.json();

            if (!res.ok || data.error) {
                setError(data.error || "Failed to fetch data");
                setIsLoading(false);
                return;
            }

            const { pastPrice, currentPrice, chartData, name, actualStartDate } = data;

            // Calculate investment based on currency
            const investmentUSD = currency === "KRW" ? amount / exchangeRate : amount;
            const shares = investmentUSD / pastPrice;
            const currentValueUSD = shares * currentPrice;
            const profitUSD = currentValueUSD - investmentUSD;
            const returnRate = (profitUSD / investmentUSD) * 100;
            const multiple = currentValueUSD / investmentUSD;

            // Convert back to display currency
            const multiplier = currency === "KRW" ? exchangeRate : 1;

            // Build chart data with investment values and prices
            const investmentChartData = chartData.map((point: any, idx: number) => {
                const priceRatio = point.price / pastPrice;
                const value = investmentUSD * priceRatio * multiplier;
                return {
                    name: point.name,
                    value: Math.round(value),
                    stockPrice: point.price * multiplier, // Add stock price
                };
            });

            setResult({
                ticker: data.ticker,
                name: name || stockName,
                initialInvestment: amount,
                period,
                pastPrice: pastPrice * multiplier,
                currentPrice: currentPrice * multiplier,
                currentValue: currentValueUSD * multiplier,
                profit: profitUSD * multiplier,
                returnRate,
                multiple,
                chartData: investmentChartData,
                actualPeriod: actualStartDate ? `${new Date(actualStartDate).getFullYear()}년부터` : undefined,
            });
            setIsCalculated(true);
        } catch (err) {
            console.error("Calculate error:", err);
            setError("데이터를 가져오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Input Card: Premium Glassmorphism */}
            <Card className="overflow-hidden border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5">
                <CardHeader className="pb-2">
                    <p className="text-sm font-medium text-muted-foreground/80 tracking-wide">
                        그때 그 종목에 투자했었더라면 지금은 어떻게 되었을지 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-9">

                    {/* 1. Ticker Input (Real Search) */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                            투자 종목 (티커)
                        </label>
                        <StockSearchInput
                            value={ticker}
                            onChange={handleStockSelect}
                            placeholder="종목 검색 (예: AAPL, samsung)..."
                        />
                    </div>

                    {/* 2. Amount Selection (Modern Chips) */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                            기준 투자 금액 ({currency === "KRW" ? "원" : "$"})
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {(currency === "KRW"
                                ? [100000, 500000, 1000000, 10000000]
                                : [1000, 5000, 10000, 50000]
                            ).map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setAmount(amt)}
                                    className={cn(
                                        "relative h-10 rounded-lg text-sm font-medium transition-all duration-200",
                                        amount === amt
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent hover:border-white/10"
                                    )}
                                >
                                    {currency === "KRW"
                                        ? amt >= 10000000
                                            ? `${amt / 10000000}천만원`
                                            : `${(amt / 10000).toLocaleString()}만원`
                                        : `$${amt.toLocaleString()}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Period Selection (Grid) */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                            투자 시점 (과거)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["1Y", "3Y", "5Y", "10Y", "20Y", "30Y"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={cn(
                                        "h-10 rounded-lg text-sm font-medium transition-all duration-200",
                                        period === p
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {p.replace("Y", "년 전")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4. Action Button (Gradient) */}
                    {/* 4. Action Button (Gradient) */}
                    <Button
                        onClick={onCalculate}
                        disabled={isLoading || !ticker}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:via-blue-400 hover:to-indigo-500 shadow-xl shadow-blue-500/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                계산 중...
                            </>
                        ) : (
                            "가치 확인하기"
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
                <Card className="border-red-500/20 bg-red-500/10">
                    <CardContent className="py-4 text-center text-red-500">
                        {error}
                    </CardContent>
                </Card>
            )}

            {isCalculated && (
                <>
                    {result ? (
                        <Card className="border-primary/20 bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <CardContent className="pt-0 text-center space-y-4">
                                {/* Stock Name Badge */}
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-sky-500 bg-sky-500/10 border border-sky-500/50 px-2 py-0.5 rounded-md">
                                        {result.ticker}
                                    </span>
                                    <span className="text-sm text-muted-foreground">{result.name}</span>
                                </div>

                                {result.actualPeriod && (
                                    <p className="text-xs text-muted-foreground">
                                        * 데이터 기준: {result.actualPeriod}
                                    </p>
                                )}

                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">현재 추정 가치</p>
                                    {(() => {
                                        const formattedValue = formatCurrency(result.currentValue);
                                        const len = formattedValue.length;
                                        let fontSizeClass = "text-4xl sm:text-6xl"; // Default for short

                                        if (len > 20) fontSizeClass = "text-xl sm:text-3xl";
                                        else if (len > 14) fontSizeClass = "text-2xl sm:text-4xl";
                                        else if (len > 9) fontSizeClass = "text-3xl sm:text-5xl";

                                        return (
                                            <h2 className={cn(
                                                "font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 tracking-tight whitespace-nowrap px-1",
                                                fontSizeClass
                                            )}>
                                                {formattedValue}
                                            </h2>
                                        );
                                    })()}
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 dark:border-white/5">
                                    <div className="flex flex-col items-center">
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">수익률</p>
                                        <p className={`text-lg font-semibold ${result.returnRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {result.returnRate >= 0 ? '+' : ''}
                                            {result.returnRate > 10000
                                                ? formatCompactNumber(result.returnRate)
                                                : result.returnRate.toLocaleString(undefined, { maximumFractionDigits: 1 })
                                            }%
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">총 수익금</p>
                                        <p className={`text-lg font-semibold ${result.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {result.profit >= 0 ? '+' : ''}
                                            {currency === "KRW" ? "" : "$"}
                                            {formatCompactNumber(Math.abs(result.profit))}
                                            {currency === "KRW" ? "원" : ""}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">상승 배수</p>
                                        <p className={`text-lg font-semibold ${result.returnRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {result.multiple > 1000
                                                ? formatCompactNumber(result.multiple)
                                                : (Math.floor(result.multiple * 10) / 10).toLocaleString()
                                            }배
                                        </p>
                                    </div>
                                </div>

                                <div className="h-48 w-full mt-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={result.chartData}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis
                                                dataKey="name"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                interval="preserveStartEnd"
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => {
                                                    if (currency === "KRW") {
                                                        if (value >= 100000000) return `${Math.round(value / 100000000).toLocaleString()}억`;
                                                        if (value >= 10000) return `${Math.round(value / 10000).toLocaleString()}만`;
                                                        return value.toLocaleString();
                                                    }
                                                    return `$${Math.round(value / 1000).toLocaleString()}k`;
                                                }}
                                            />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    가치: <span className="font-semibold text-primary">{formatCurrency(data.value)}</span>
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    주가: <span className="font-semibold">{formatCurrency(data.stockPrice)}</span>
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#0EA5E9"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorValue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed border-2 bg-transparent">
                            <CardContent className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                                해당 종목의 데이터를 찾을 수 없습니다.
                            </CardContent>
                        </Card>
                    )}
                    <p className="text-[10px] text-center text-muted-foreground px-4">
                        이 결과는 시뮬레이션이며 미래의 수익을 보장하지 않습니다. FOMO에 빠지지 마세요.
                    </p>
                </>
            )}
        </div>
    );
}

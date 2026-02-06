"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateRegret, RegretResult } from "@/lib/price-service";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export function RegretCalculator() {
    const [ticker, setTicker] = useState("AAPL");
    const [amount, setAmount] = useState<number>(1000);
    const [period, setPeriod] = useState<"1Y" | "3Y" | "5Y" | "10Y" | "20Y" | "30Y">("30Y");
    const [result, setResult] = useState<RegretResult | null>(null);

    useEffect(() => {
        // Initial calculation
        handleCalculate();
    }, []);

    const handleCalculate = () => {
        // Basic ticker validation for mock data
        const res = calculateRegret(ticker, amount, period);
        setResult(res);
    };

    // Auto-calculate on period or amount change
    useEffect(() => {
        handleCalculate();
    }, [period, amount]);

    return (
        <div className="space-y-8">
            {/* Input Card: Premium Glassmorphism */}
            <Card className="overflow-hidden border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5">
                <CardHeader className="pb-2">
                    <p className="text-sm font-medium text-muted-foreground/80 tracking-wide">
                        그때 투자했더라면 지금 얼마일지 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-9">

                    {/* 1. Ticker Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                            투자 종목 (티커)
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-muted-foreground group-hover:text-sky-500 transition-colors" />
                            </div>
                            <Input
                                placeholder="예: AAPL, BTC"
                                className="pl-10 h-12 bg-white/5 dark:bg-black/10 border-white/10 focus:border-sky-500/50 focus:ring-sky-500/20 transition-all rounded-xl text-lg font-medium"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
                            />
                        </div>
                    </div>

                    {/* 2. Amount Selection (Modern Chips) */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                            기준 투자 금액
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[1000, 5000, 10000].map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setAmount(amt)}
                                    className={cn(
                                        "relative h-12 rounded-xl text-sm font-semibold transition-all duration-300",
                                        amount === amt
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent hover:border-white/10"
                                    )}
                                >
                                    ${amt.toLocaleString()}
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
                    <Button
                        onClick={handleCalculate}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-xl shadow-blue-500/10 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        가치 확인하기
                    </Button>
                </CardContent>
            </Card>

            {result ? (
                <Card className="border-primary/20 bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">현재 추정 가치</p>
                            <h2 className="text-4xl font-bold text-primary">
                                ${result.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </h2>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 dark:border-white/5">
                            <div>
                                <p className="text-xs text-muted-foreground">수익률</p>
                                <p className={`text-lg font-semibold ${result.returnRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {result.returnRate >= 0 ? '+' : ''}{result.returnRate.toLocaleString(undefined, { maximumFractionDigits: 1 })}%
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">총 수익금</p>
                                <p className={`text-lg font-semibold ${result.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {result.profit >= 0 ? '+' : ''}${result.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">상승 배수</p>
                                <p className={`text-lg font-semibold ${result.returnRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {result.multiple.toFixed(1)}배
                                </p>
                            </div>
                        </div>

                        <div className="h-48 w-full mt-4">
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
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                    <Tooltip
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, "가치"]}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
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
                        지원하지 않는 티커입니다. (Mock: AAPL, BTC, TSLA)
                    </CardContent>
                </Card>
            )}

            <p className="text-[10px] text-center text-muted-foreground px-4">
                이 결과는 시뮬레이션이며 미래의 수익을 보장하지 않습니다. FOMO에 빠지지 마세요.
            </p>
        </div>
    );
}

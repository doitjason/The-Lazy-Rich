"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateRegret, RegretResult, MOCK_STOCKS } from "@/lib/price-service";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
        <div className="space-y-6">
            <Card className="border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                <CardHeader>
                    <p className="text-sm text-muted-foreground">
                        그때 투자했더라면 지금 얼마일지 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">투자 종목 (티커)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="종목 검색 (예: AAPL)"
                                className="pl-9 bg-white/50 dark:bg-black/20"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">기준 투자 금액</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[1000, 5000, 10000].map((amt) => (
                                <Button
                                    key={amt}
                                    variant={amount === amt ? "default" : "glass"}
                                    size="sm"
                                    onClick={() => setAmount(amt)}
                                >
                                    ${amt.toLocaleString()}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">투자 시점 (과거)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["1Y", "3Y", "5Y", "10Y", "20Y", "30Y"] as const).map((p) => (
                                <Button
                                    key={p}
                                    variant={period === p ? "default" : "glass"}
                                    size="sm"
                                    onClick={() => setPeriod(p)}
                                >
                                    {p.replace("Y", "년 전")}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <Button onClick={handleCalculate} className="w-full">
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

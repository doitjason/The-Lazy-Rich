"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { calculateCompoundInterest, CompoundResult } from "@/lib/finance-utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export function CompoundCalculator() {
    const [initial, setInitial] = useState(10000);
    const [monthly, setMonthly] = useState(500);
    const [rate, setRate] = useState(7);
    const [years, setYears] = useState(10);
    const [data, setData] = useState<CompoundResult[]>([]);
    const [isCalculated, setIsCalculated] = useState(false);

    const onCalculate = () => {
        const results = calculateCompoundInterest(initial, monthly, rate, years);
        setData(results);
        setIsCalculated(true);
    };

    const finalResult = data[data.length - 1];

    return (
        <div className="space-y-8">
            {/* Input Card: Premium Glassmorphism */}
            <Card className="overflow-hidden border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5">
                <CardHeader className="pb-2">
                    <p className="text-sm font-medium text-muted-foreground/80 tracking-wide">
                        시간이 만드는 복리의 마법을 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-9">

                    {/* 1. Initial Amount */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">기초 보유 자산 ($)</label>
                        <Input
                            type="number"
                            value={initial}
                            onChange={(e) => setInitial(Number(e.target.value))}
                            className="h-12 bg-white/5 dark:bg-black/10 border-white/10 focus:border-sky-500/50 focus:ring-sky-500/20 transition-all rounded-xl text-lg font-medium"
                            onKeyDown={(e) => e.key === "Enter" && onCalculate()}
                        />
                        <div className="flex flex-wrap gap-2">
                            {[10000, 50000, 100000, 500000, 1000000].map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setInitial(amt)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                        initial === amt
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-transparent"
                                    )}
                                >
                                    ${(amt / 1000).toLocaleString()}k
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Monthly Contribution */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">월 추가 투자 금액 ($)</label>
                        <Input
                            type="number"
                            value={monthly}
                            onChange={(e) => setMonthly(Number(e.target.value))}
                            className="h-12 bg-white/5 dark:bg-black/10 border-white/10 focus:border-sky-500/50 focus:ring-sky-500/20 transition-all rounded-xl text-lg font-medium"
                            onKeyDown={(e) => e.key === "Enter" && onCalculate()}
                        />
                        <div className="flex flex-wrap gap-2">
                            {[500, 1000, 2000, 3000].map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setMonthly(amt)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                        monthly === amt
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-transparent"
                                    )}
                                >
                                    ${amt.toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Annual Rate */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">연평균 목표(명목) 수익률 (%)</label>
                        <Input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(Number(e.target.value))}
                            className="h-12 bg-white/5 dark:bg-black/10 border-white/10 focus:border-sky-500/50 focus:ring-sky-500/20 transition-all rounded-xl text-lg font-medium"
                            onKeyDown={(e) => e.key === "Enter" && onCalculate()}
                        />
                        <div className="flex flex-wrap gap-2">
                            {[
                                { val: 3, label: "예적금 (3%)" },
                                { val: 10, label: "S&P 500 (10%)" },
                                { val: 15, label: "NASDAQ 100 (15%)" }
                            ].map((item) => (
                                <button
                                    key={item.val}
                                    onClick={() => setRate(item.val)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                        rate === item.val
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-transparent"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4. Years */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">투자 기간 (년)</label>
                            <span className="text-sm font-bold text-sky-500">{years}년</span>
                        </div>
                        <Slider
                            defaultValue={[years]}
                            autoFocus
                            value={[years]}
                            max={50}
                            min={1}
                            step={1}
                            onValueChange={(vals) => setYears(vals[0])}
                            className="py-2"
                        />
                        <div className="flex flex-wrap gap-2">
                            {[1, 5, 10, 20, 30].map((y) => (
                                <button
                                    key={y}
                                    onClick={() => setYears(y)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                        years === y
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-transparent"
                                    )}
                                >
                                    {y}년
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={onCalculate}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-xl shadow-blue-500/10 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        복리 계산하기
                    </Button>
                </CardContent>
            </Card>

            {isCalculated && finalResult && (
                <Card className="border-primary/20 bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">예상 최종 금액</p>
                            <h2 className="text-4xl font-bold text-primary">
                                ${finalResult.totalAmount.toLocaleString()}
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 dark:border-white/5">
                            <div>
                                <p className="text-xs text-muted-foreground">총 원금</p>
                                <p className="text-lg font-semibold">${finalResult.totalInvested.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">이자 수익</p>
                                <p className="text-lg font-semibold text-green-500">
                                    +${finalResult.interest.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="h-48 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={data}
                                    margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                    <Tooltip
                                        formatter={(value: number, name: string) => [
                                            `$${value.toLocaleString()}`,
                                            name === "totalAmount" ? "총 금액" : "원금"
                                        ] as [string, string]}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="totalAmount"
                                        stackId="1"
                                        stroke="#0EA5E9"
                                        fill="url(#colorTotal)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="totalInvested"
                                        stackId="2"
                                        stroke="#64748b"
                                        fill="url(#colorInvested)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

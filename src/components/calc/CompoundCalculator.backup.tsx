"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { calculateCompoundInterest, CompoundResult } from "@/lib/finance-utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function CompoundCalculator() {
    const [initial, setInitial] = useState(10000);
    const [monthly, setMonthly] = useState(500);
    const [rate, setRate] = useState(7);
    const [years, setYears] = useState(10);
    const [data, setData] = useState<CompoundResult[]>([]);

    useEffect(() => {
        const results = calculateCompoundInterest(initial, monthly, rate, years);
        setData(results);
    }, [initial, monthly, rate, years]);

    const finalResult = data[data.length - 1];

    return (
        <div className="space-y-6">
            <Card className="border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                <CardHeader>
                    <p className="text-sm text-muted-foreground">
                        시간이 만드는 복리의 마법을 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium">초기 금액 ($)</label>
                            <Input
                                type="number"
                                value={initial}
                                onChange={(e) => setInitial(Number(e.target.value))}
                                className="bg-white/50 dark:bg-black/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium">월 적립액 ($)</label>
                            <Input
                                type="number"
                                value={monthly}
                                onChange={(e) => setMonthly(Number(e.target.value))}
                                className="bg-white/50 dark:bg-black/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium">연 수익률 (%)</label>
                        <Input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(Number(e.target.value))}
                            className="bg-white/50 dark:bg-black/20"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <label className="text-xs font-medium">기간 (년)</label>
                            <span className="text-xs font-bold text-primary">{years}년</span>
                        </div>
                        <Slider
                            defaultValue={[years]}
                            max={50}
                            min={1}
                            step={1}
                            onValueChange={(vals) => setYears(vals[0])}
                            className="py-2"
                        />
                    </div>
                </CardContent>
            </Card>

            {finalResult && (
                <Card className="border-primary/20 bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-lg">
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
                                        ]}
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

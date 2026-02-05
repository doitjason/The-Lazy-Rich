"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

interface FireChartProps {
    data: { year: number; invested: number; profit: number; realAssets?: number }[];
    targetAmount: number;
}

export default function FireChart({ data, targetAmount }: FireChartProps) {
    // Y-axis formatter for Korean units
    const formatYAxis = (value: number) => {
        if (value >= 100000000) return `${(value / 100000000).toFixed(0)}억`;
        if (value >= 10000) return `${(value / 10000).toFixed(0)}만`;
        return `${value}`;
    };

    return (
        <div className="w-full h-[300px] mt-4">
            <div className="mb-4 px-2">
                <h3 className="text-sm font-medium text-muted-foreground">자산 예측 (Wealth Projection)</h3>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                        dataKey="year"
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value === 0 ? "투자 시작" : `${value}년 후`}
                        minTickGap={30}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxis}
                        width={45}
                    />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                // Calculate summary values
                                const invested = Number(payload.find(p => p.dataKey === "invested")?.value || 0);
                                const profit = Number(payload.find(p => p.dataKey === "profit")?.value || 0);
                                const total = invested + profit;

                                const formatTooltipValue = (val: number) => {
                                    if (val >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
                                    if (val >= 10000) return `${(val / 10000).toFixed(0)}만`;
                                    return val.toLocaleString();
                                };

                                return (
                                    <div className="bg-background border rounded-lg shadow-lg p-3 text-xs leading-5 min-w-[120px]">
                                        <p className="font-bold mb-2 text-foreground border-b pb-1">
                                            {label === 0 ? "투자 시작" : `${label}년 후`}
                                        </p>

                                        {/* 1. Total Nominal Assets */}
                                        <div className="flex justify-between gap-4 mb-1">
                                            <span className="text-muted-foreground">총 명목 자산:</span>
                                            <span className="font-bold text-foreground">{formatTooltipValue(total)}</span>
                                        </div>

                                        {/* 2. Total Nominal Profit */}
                                        <div className="flex justify-between gap-4 text-[10px] opacity-90">
                                            <span className="text-muted-foreground">총 명목 수익:</span>
                                            <span className="text-primary font-medium">+{formatTooltipValue(profit)}</span>
                                        </div>

                                        {/* 3. Total Principal */}
                                        <div className="flex justify-between gap-4 text-[10px] opacity-80">
                                            <span className="text-muted-foreground">총 납입 원금:</span>
                                            <span>{formatTooltipValue(invested)}</span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    {/* Stacked Areas */}
                    <Area
                        type="monotone"
                        dataKey="invested"
                        stackId="1"
                        stroke="hsl(var(--muted-foreground))"
                        fill="hsl(var(--muted))"
                        fillOpacity={0.5}
                        name="invested"
                        animationDuration={1500}
                    />
                    <Area
                        type="monotone"
                        dataKey="profit"
                        stackId="1"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorProfit)"
                        name="profit"
                        animationDuration={2000}
                    />
                    {targetAmount > 0 && (
                        <ReferenceLine y={targetAmount} stroke="hsl(var(--chart-4))" strokeDasharray="3 3" label={{ position: 'top', value: 'FIRE 목표', fill: "hsl(var(--chart-4))", fontSize: 12 }} />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

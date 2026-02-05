"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { cn } from "@/lib/utils";

interface StockChartProps {
    data: { date: string; value: number }[];
    title?: string;
    ticker?: string;
    percentage?: number;
}

export default function StockChart({ data, title, ticker, percentage }: StockChartProps) {
    const isPositive = percentage ? percentage >= 0 : true;
    const color = isPositive ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"; // Green or Red

    return (
        <div className="w-full h-[300px] mt-4">
            {ticker && (
                <div className="flex justify-between items-end mb-4 px-2">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground">{ticker}</h3>
                        <p className="text-2xl font-bold font-serif">{title}</p>
                    </div>
                    <div className={cn("px-2 py-1 rounded text-sm font-bold", isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {percentage && percentage > 0 ? "+" : ""}{percentage}%
                    </div>
                </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        hide
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                        }}
                        itemStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                        formatter={(value: number | undefined) => [`${value?.toLocaleString() || '0'}`, "가격"]}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={3}
                        dot={false}
                        animationDuration={2000}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

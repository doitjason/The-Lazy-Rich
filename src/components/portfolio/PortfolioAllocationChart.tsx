"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { PieChart as PieChartIcon } from "lucide-react";
import { PortfolioItem } from "@/store/usePortfolioStore";

// Match the PriceData shape from PortfolioList
type PriceData = {
    [ticker: string]: {
        price: number;
        change?: number;
        changePercent?: number;
    }
};

interface PortfolioAllocationChartProps {
    items: PortfolioItem[];
    prices: PriceData;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"];

export function PortfolioAllocationChart({ items, prices }: PortfolioAllocationChartProps) {
    const data = useMemo(() => {
        const chartData = items.map(item => {
            const currentPrice = prices[item.ticker]?.price || item.avg_price;
            const value = item.quantity * currentPrice;
            return {
                name: item.ticker.replace(".KS", ""),
                value: value
            };
        });

        // Sort by value descending
        return chartData.sort((a, b) => b.value - a.value);
    }, [items, prices]);

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    if (totalValue === 0) return null;

    return (
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden mb-6">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4" /> 자산 비중 (Holdings)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip
                            formatter={(value: number | undefined) => [formatCurrency(value || 0), "평가금액"]}
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { getPortfolioData } from "@/app/actions/portfolio-actions";
import { EnrichedPortfolioItem } from "@/lib/market-types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, YAxis } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowUpRight, ArrowDownRight, RefreshCw, TrendingUp, Wallet, PieChart as PieChartIcon, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PortfolioDashboardProps {
    onAdd: () => void;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"];

export function PortfolioDashboard({ onAdd }: PortfolioDashboardProps) {
    const { items, loading: storeLoading, fetchPortfolio } = usePortfolioStore();
    const [enrichedData, setEnrichedData] = useState<Record<string, EnrichedPortfolioItem>>({});
    const [loading, setLoading] = useState(false);

    // Fetch enriched data when items change
    useEffect(() => {
        if (items.length === 0) return;

        async function loadData() {
            setLoading(true);
            try {
                const tickers = items.map(i => i.ticker);
                const data = await getPortfolioData(tickers);
                setEnrichedData(data);
            } catch (error) {
                console.error("Failed to fetch enriched data", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [items]);

    // Calculate Totals
    const { totalValue, totalCost, totalDayChange, dayChangePercent } = useMemo(() => {
        let totalVal = 0;
        let totalCst = 0;
        let dayChg = 0; // Value change today

        items.forEach(item => {
            const data = enrichedData[item.ticker];
            const currentPrice = data?.price || item.avg_price; // Fallback to avg_price if no data
            const value = item.quantity * currentPrice;
            const cost = item.quantity * item.avg_price;

            totalVal += value;
            totalCst += cost;

            if (data) {
                // Today's change value = current value * (changePercent / 100) / (1 + changePercent/100)
                // Or simpler: previous close = price - change. 
                // day change value = (price - prevClose) * quantity = change * quantity
                dayChg += data.change * item.quantity;
            }
        });

        const dayChgPct = totalVal > 0 ? (dayChg / (totalVal - dayChg)) * 100 : 0; // Approx

        return {
            totalValue: totalVal,
            totalCost: totalCst,
            totalDayChange: dayChg,
            dayChangePercent: dayChgPct
        };
    }, [items, enrichedData]);

    const totalReturn = totalValue - totalCost;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // Prepare Sector Data for Pie Chart
    const sectorData = useMemo(() => {
        const sectors: Record<string, number> = {};
        items.forEach(item => {
            const data = enrichedData[item.ticker];
            const value = item.quantity * (data?.price || item.avg_price);
            const sector = data?.sector || "Unknown";
            sectors[sector] = (sectors[sector] || 0) + value;
        });

        return Object.entries(sectors)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [items, enrichedData]);

    const isLoading = storeLoading || loading;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Cards: Total Balance & Returns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 backdrop-blur-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Wallet className="w-4 h-4" /> 총 자산 (Total Balance)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                            {formatCurrency(totalValue)}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className={cn(totalDayChange >= 0 ? "text-green-500" : "text-red-500", "font-medium flex items-center")}>
                                {totalDayChange >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                                {formatCurrency(Math.abs(totalDayChange))} ({formatPercent(dayChangePercent)})
                            </span>
                            <span className="text-muted-foreground text-xs">오늘</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 backdrop-blur-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> 총 수익 (Total Return)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-3xl font-bold tracking-tight", totalReturn >= 0 ? "text-green-500" : "text-red-500")}>
                            {formatCurrency(totalReturn, "USD").replace("US", "")}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className={cn(totalReturnPercent >= 0 ? "text-green-500" : "text-red-500", "font-medium")}>
                                {formatPercent(totalReturnPercent)}
                            </span>
                            <span className="text-muted-foreground text-xs">수익률</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Asset Allocation Chart */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4" /> 자산 배분 (Allocation)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[240px] flex items-center justify-center relative">
                    {isLoading && items.length > 0 ? (
                        <Skeleton className="w-40 h-40 rounded-full" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sectorData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {sectorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value: number | undefined) => formatCurrency(value || 0)}
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                    {/* Legend */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 flex flex-col justify-center gap-1 text-xs pr-4 overflow-y-auto">
                        {sectorData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="truncate flex-1">{entry.name}</span>
                                <span className="font-mono text-muted-foreground">
                                    {((entry.value / totalValue) * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Assets List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5" /> 보유 종목
                    </h3>
                    <Button onClick={onAdd} size="sm" className="bg-primary hover:bg-primary/90 rounded-full px-4">
                        <Plus className="w-4 h-4 mr-1" /> 추가
                    </Button>
                </div>

                <div className="grid gap-3">
                    {items.map((item) => {
                        const data = enrichedData[item.ticker];
                        const currentValue = item.quantity * (data?.price || item.avg_price);
                        const gain = currentValue - (item.quantity * item.avg_price);
                        const gainPercent = (gain / (item.quantity * item.avg_price)) * 100;
                        const isProfit = gain >= 0;

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-4 transition-all hover:bg-white/10 hover:border-white/20"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    {/* Left: Ticker & Name */}
                                    <div className="min-w-[80px]">
                                        <div className="font-bold text-lg">{item.ticker}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                                            {data?.name || "Loading..."}
                                        </div>
                                        <div className="mt-1">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground border border-white/5">
                                                {data?.sector || "EQ"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle: Sparkline */}
                                    <div className="flex-1 h-12 hidden sm:block">
                                        {data?.sparkline && data.sparkline.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={data.sparkline}>
                                                    <Line
                                                        type="monotone"
                                                        dataKey="price"
                                                        stroke={isProfit ? "#10b981" : "#ef4444"}
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full w-full bg-white/5 rounded animate-pulse" />
                                        )}
                                    </div>

                                    {/* Right: Price & Value */}
                                    <div className="text-right min-w-[100px]">
                                        <div className="font-medium text-base">
                                            {formatCurrency(currentValue)}
                                        </div>
                                        <div className={cn("text-xs font-medium flex items-center justify-end gap-1", isProfit ? "text-green-500" : "text-red-500")}>
                                            {isProfit ? "+" : ""}{formatCurrency(gain)} ({formatPercent(gainPercent)})
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                            {item.quantity}주 @ {formatCurrency(data?.price || 0)}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

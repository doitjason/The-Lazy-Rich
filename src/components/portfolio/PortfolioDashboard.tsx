"use client";

import { useEffect, useState, useMemo } from "react";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { getPortfolioData } from "@/app/actions/portfolio-actions";
import { EnrichedPortfolioItem } from "@/lib/market-types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowUpRight, ArrowDownRight, RefreshCw, TrendingUp, Wallet, PieChart as PieChartIcon, Activity, MoreHorizontal, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DividendCalendarDialog } from "./DividendCalendarDialog";

interface PortfolioDashboardProps {
    onAdd: () => void;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

import { useAuth } from "@/contexts/AuthContext";

export function PortfolioDashboard({ onAdd }: PortfolioDashboardProps) {
    const { user } = useAuth();
    const { items, loading: storeLoading, deleteItem, fetchPortfolio } = usePortfolioStore();
    const [enrichedData, setEnrichedData] = useState<Record<string, EnrichedPortfolioItem>>({});
    const [loading, setLoading] = useState(true);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Initial Portfolio Fetch
    useEffect(() => {
        if (user?.id) {
            fetchPortfolio(user.id);
        }
    }, [user?.id]);

    // Fetch enriched data when items change
    useEffect(() => {
        async function loadData() {
            if (items.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const tickers = items.map(i => i.ticker);
                const data = await getPortfolioData(tickers);
                console.log("[PortfolioDashboard] Enriched Data Received:", data);
                setEnrichedData(data);
            } catch (error) {
                console.error("Failed to fetch enriched data", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [items]);

    // Calculate Totals & Stats
    const { totalValue, totalCost, totalDayChange, dayChangePercent, portfolioBeta, estimatedAnnualIncome, portfolioYield } = useMemo(() => {
        let totalVal = 0;
        let totalCst = 0;
        let dayChg = 0;
        let weightedBetaSum = 0;
        let totalDividendIncome = 0;

        items.forEach(item => {
            const data = enrichedData[item.ticker];
            const currentPrice = data?.price || item.avg_price;
            const value = item.quantity * currentPrice;
            const cost = item.quantity * item.avg_price;

            totalVal += value;
            totalCst += cost;

            if (data) {
                dayChg += data.change * item.quantity;

                // Dividend (yield is typically in decimal like 0.05, sometimes undefined)
                if (data.dividendYield) {
                    totalDividendIncome += value * data.dividendYield;
                }

                // Beta (Weighted average, default to 1 if missing)
                const itemBeta = data.beta ?? 1.0;
                weightedBetaSum += itemBeta * value;
            } else {
                weightedBetaSum += 1.0 * value;
            }
        });

        const dayChgPct = (totalVal - dayChg) > 0 ? (dayChg / (totalVal - dayChg)) * 100 : 0;
        const avgBeta = totalVal > 0 ? weightedBetaSum / totalVal : 1.0;
        const avgYield = totalVal > 0 ? (totalDividendIncome / totalVal) : 0;

        return {
            totalValue: totalVal,
            totalCost: totalCst,
            totalDayChange: dayChg,
            dayChangePercent: dayChgPct,
            portfolioBeta: avgBeta,
            estimatedAnnualIncome: totalDividendIncome,
            portfolioYield: avgYield
        };
    }, [items, enrichedData]);

    const totalReturn = totalValue - totalCost;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // Sector Allocation Data
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
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* 1. Total Balance Card (Gradient) */}
            <Card className="border-0 overflow-hidden relative shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 opacity-90" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />

                <CardContent className="relative z-10 p-6 flex flex-col items-center justify-center text-white space-y-2">
                    <div className="text-white/80 text-sm font-medium tracking-wide">총 순자산 (Total Balance)</div>
                    <div className="text-5xl font-bold tracking-tight">
                        {formatCurrency(totalValue)}
                    </div>
                    <div className="flex items-center gap-3 mt-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-inner">
                        <div className={cn("text-sm font-semibold flex items-center", totalDayChange >= 0 ? "text-emerald-300" : "text-rose-300")}>
                            {totalDayChange >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                            {formatCurrency(Math.abs(totalDayChange))} ({formatPercent(dayChangePercent)})
                        </div>
                        <div className="h-3 w-px bg-white/20" />
                        <div className={cn("text-xs font-medium", totalReturn >= 0 ? "text-emerald-200" : "text-rose-200")}>
                            총 수익: {formatPercent(totalReturnPercent)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Asset Allocation & Stats Grid */}
            <div className="grid grid-cols-1 gap-4">
                {/* Donut Chart */}
                <Card className="bg-card dark:bg-white/5 border-border dark:border-white/10 backdrop-blur-sm overflow-hidden shadow-sm">
                    <CardHeader className="pb-0 px-4 pt-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4" /> 자산 배분 (Asset Allocation)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center relative p-0">
                        {items.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sectorData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {sectorData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: number | undefined) => [formatCurrency(value || 0), "평가금액"]}
                                        contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-muted-foreground text-sm">자산 데이터 없음</div>
                        )}
                        {/* Center Text */}
                        {items.length > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <div className="text-xs text-muted-foreground">비중 1위</div>
                                    <div className="text-sm font-bold text-foreground">{sectorData[0]?.name || "None"}</div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Stats or Actions */}
                <Card className="bg-card dark:bg-white/5 border-border dark:border-white/10 backdrop-blur-sm flex flex-col justify-center gap-4 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">포트폴리오 베타 (Beta)</div>
                            <div className="text-2xl font-bold">{portfolioBeta.toFixed(2)}</div>
                            <div className={cn("text-xs", portfolioBeta > 1.2 ? "text-rose-400" : portfolioBeta < 0.8 ? "text-emerald-400" : "text-blue-400")}>
                                {portfolioBeta > 1.2 ? "공격적 투자 성향 (고변동성)" : portfolioBeta < 0.8 ? "방어적 투자 성향 (저변동성)" : "시장 추종형 (중위험)"}
                            </div>
                        </div>
                        <Activity className={cn("w-8 h-8 opacity-50", portfolioBeta > 1 ? "text-rose-500" : "text-blue-500")} />
                    </div>
                    <div className="h-px bg-white/10 w-full" />
                    <button
                        onClick={() => setIsCalendarOpen(true)}
                        className="flex items-center justify-between w-full text-left hover:bg-white/5 p-1 -m-1 rounded transition-colors group cursor-pointer"
                    >
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                배당 수익률 (Dividend) <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded">Calendar</span>
                            </div>
                            <div className="text-2xl font-bold group-hover:text-emerald-300 transition-colors">{formatPercent(portfolioYield * 100)}</div>
                            <div className="text-xs text-emerald-400">예상 연 배당금: {formatCurrency(estimatedAnnualIncome)}</div>
                        </div>
                        <Wallet className="w-8 h-8 text-emerald-500/50 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                </Card>
            </div>

            <DividendCalendarDialog
                open={isCalendarOpen}
                onOpenChange={setIsCalendarOpen}
                items={items.map(i => ({ ticker: i.ticker, quantity: i.quantity }))}
            />

            {/* 3. Holdings List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        보유 종목 <span className="text-muted-foreground text-sm font-normal">({items.length})</span>
                    </h3>
                    <Button onClick={onAdd} size="sm" className="rounded-full bg-white/10 hover:bg-white/20 text-foreground border border-white/10">
                        <Plus className="w-4 h-4 mr-1" /> 자산 추가
                    </Button>
                </div>

                <div className="grid gap-3">
                    {items.map((item, index) => {
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
                                transition={{ delay: index * 0.05 }}
                                className="group relative overflow-hidden rounded-xl bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:bg-accent/50 dark:hover:bg-white/10 transition-all p-4 flex items-center justify-between shadow-sm"
                            >
                                {/* Left: Info */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold ring-1 ring-white/10">
                                        {item.ticker.slice(0, 1)}
                                    </div>
                                    <div>
                                        <div className="font-bold">{item.ticker}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            {item.quantity}주
                                            <span className="w-0.5 h-0.5 rounded-full bg-gray-500" />
                                            {data?.sector || "주식"}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Price */}
                                <div className="text-right">
                                    <div className="font-medium">{formatCurrency(currentValue)}</div>
                                    <div className={cn("text-xs font-medium", isProfit ? "text-emerald-400" : "text-rose-400")}>
                                        {isProfit ? "+" : ""}{formatCurrency(gain)} ({formatPercent(gainPercent)})
                                    </div>
                                </div>

                                {/* Actions Menu */}
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>편집</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.ticker)}>
                                                <Copy className="w-3 h-3 mr-2" /> 티커 복사
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => deleteItem(item.id)}>
                                                삭제
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

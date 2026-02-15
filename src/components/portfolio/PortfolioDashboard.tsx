
"use client";

import { useEffect, useState, useMemo } from "react";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { getPortfolioData, getBenchmarkData } from "@/app/actions/portfolio-actions";
import { EnrichedPortfolioItem } from "@/lib/market-types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowUpRight, ArrowDownRight, RefreshCw, TrendingUp, Wallet, PieChart as PieChartIcon, Activity, MoreHorizontal, Copy, SlidersHorizontal, ArrowUpDown } from "lucide-react";
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
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { AlertTriangle, X } from "lucide-react";


import { BenchmarkCard } from "./BenchmarkCard";
import { EditStockDialog } from "./EditStockDialog";
import { DividendCalendarDialog } from "./DividendCalendarDialog";
import { PortfolioItem } from "@/store/usePortfolioStore";
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

    const [showReturnPercent, setShowReturnPercent] = useState(true);
    const [marketReturn, setMarketReturn] = useState(0);
    const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [showConcentrationWarning, setShowConcentrationWarning] = useState(true);

    // Sorting state
    const [sortBy, setSortBy] = useState<string>("recent");
    const [isDivCalendarOpen, setIsDivCalendarOpen] = useState(false);

    const sortOptions = [
        { value: 'recent', label: '최근 추가순' },
        { value: 'value_desc', label: '총자산 많은순' },
        { value: 'value_asc', label: '총자산 적은순' },
        { value: 'pnl_desc', label: '수익률 높은순' },
        { value: 'pnl_asc', label: '수익률 낮은순' },
        { value: 'ticker_asc', label: '이름순 (A-Z)' },
    ];


    // Toggle return display every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setShowReturnPercent(prev => !prev);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Initial Portfolio & Benchmark Fetch
    useEffect(() => {
        if (user?.id) {
            fetchPortfolio(user.id);
        }

        // Fetch Benchmark
        getBenchmarkData().then(ret => setMarketReturn(ret));
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

    // Apply sorting to items
    const sortedItems = useMemo(() => {
        const enrichedItems = items.map(item => {
            const data = enrichedData[item.ticker];
            const currentValue = item.quantity * (data?.price || item.avg_price);
            const gain = currentValue - (item.quantity * item.avg_price);
            const gainPercent = (item.quantity * item.avg_price) > 0
                ? (gain / (item.quantity * item.avg_price)) * 100
                : 0;

            return {
                ...item,
                currentValue,
                gainPercent
            };
        });

        return [...enrichedItems].sort((a, b) => {
            switch (sortBy) {
                case 'value_desc':
                    return b.currentValue - a.currentValue;
                case 'value_asc':
                    return a.currentValue - b.currentValue;
                case 'pnl_desc':
                    return b.gainPercent - a.gainPercent;
                case 'pnl_asc':
                    return a.gainPercent - b.gainPercent;
                case 'ticker_asc':
                    return a.ticker.localeCompare(b.ticker);
                case 'recent':
                default:
                    return 0; // use original order
            }
        });
    }, [items, enrichedData, sortBy]);


    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* 1. Total Balance Card (Gradient) */}
            <Card className="border-0 overflow-hidden relative shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 opacity-90" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />

                <CardContent className="relative z-10 py-1.5 px-6 flex flex-col items-center justify-center gap-3 text-white">
                    <div className="text-white/80 text-base font-medium tracking-wide">총 순자산</div>
                    <div className="text-5xl leading-none font-bold tracking-tight">
                        {formatCurrency(totalValue)}
                    </div>
                    <div className="flex flex-col gap-1 w-full max-w-[280px] bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                        <div className="flex justify-between items-center text-[13px] font-medium">
                            <span className="text-white/70">일간 수익</span>
                            <div className={cn("flex items-center font-bold", totalDayChange >= 0 ? "text-emerald-300" : "text-rose-300")}>
                                {totalDayChange >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                                {formatCurrency(Math.abs(totalDayChange))} ({formatPercent(dayChangePercent)})
                            </div>
                        </div>
                        <div className="h-px w-full bg-white/10" />
                        <div className="flex justify-between items-center text-[13px] font-medium">
                            <span className="text-white/70">총 수익</span>
                            <div className={cn("flex items-center font-bold", totalReturn >= 0 ? "text-emerald-300" : "text-rose-300")}>
                                {totalReturn >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                                {formatCurrency(Math.abs(totalReturn), "USD", 0)} ({formatPercent(totalReturnPercent)})
                            </div>
                        </div>
                    </div>

                    {/* Style Tags Embedded */}
                    {items.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                            {/* Beta Tag */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className={cn(
                                        "flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-colors"
                                    )}>
                                        {portfolioBeta > 1.2 ? "🚀 공격적 성장형" : portfolioBeta < 0.8 ? "🛡️ 안정 추구형" : "⚖️ 균형 투자형"}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3 text-xs bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/20">
                                    <div className="font-bold mb-1">포트폴리오 베타 (Beta): {portfolioBeta.toFixed(2)}</div>
                                    <div className="text-muted-foreground">
                                        {portfolioBeta > 1.2
                                            ? "시장 평균보다 변동성이 큽니다. 상승장에서 더 큰 수익을 기대할 수 있지만, 하락장 위험도 큽니다."
                                            : portfolioBeta < 0.8
                                                ? "시장 변동에 덜 민감합니다. 안정적인 자산 방어가 특징입니다."
                                                : "시장 지수와 유사한 움직임을 보이며 균형 잡힌 위험/수익 구조를 가집니다."}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Dividend Tag */}
                            {(portfolioYield * 100) >= 3.0 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-colors">
                                            💰 고배당 포트
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3 text-xs bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/20">
                                        <div className="font-bold mb-1">예상 배당 수익률: {(portfolioYield * 100).toFixed(2)}%</div>
                                        <div className="text-muted-foreground">
                                            연 3.0% 이상의 배당 수익이 기대되는 포트폴리오입니다. 시세 차익과 더불어 안정적인 현금 흐름을 창출하고 있습니다.
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}

                            {/* Concentration Tag */}
                            {sectorData.length > 0 && (sectorData[0].value / totalValue) > 0.45 ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-colors">
                                            🎯 {sectorData[0].name} 집중
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3 text-xs bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/20">
                                        <div className="font-bold mb-1">집중 투자 경고</div>
                                        <div className="text-muted-foreground">
                                            자산의 45% 이상이 <strong>{sectorData[0].name}</strong> 섹터에 쏠려 있습니다. 해당 산업의 호재에 크게 반응하지만, 악재 발생 시 리스크가 커질 수 있습니다.
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            ) : items.length >= 5 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-colors">
                                            🌐 분산 투자
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3 text-xs bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/20">
                                        <div className="font-bold mb-1">잘 분산된 포트폴리오</div>
                                        <div className="text-muted-foreground">
                                            다양한 자산에 고루 투자되어 있어, 개별 종목의 위험을 효과적으로 관리하고 있습니다.
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}

                            {/* Performance Tag */}
                            {totalReturnPercent > 15 ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-colors">
                                            🏆 성투 중
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3 text-xs bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/20">
                                        <div className="font-bold mb-1">탁월한 성과!</div>
                                        <div className="text-muted-foreground">
                                            총 수익률이 +15%를 돌파했습니다. 시장을 이기는 훌륭한 투자를 하고 계시네요!
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            ) : totalReturnPercent < -10 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-colors">
                                            💧 존버 정신
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3 text-xs bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/20">
                                        <div className="font-bold mb-1">인내가 필요한 시기</div>
                                        <div className="text-muted-foreground">
                                            시장이 어렵거나 조정기일 수 있습니다. 펀더멘털에 문제가 없다면 긴 호흡으로 지켜보는 것도 전략입니다.
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 1.5. Benchmark Card (New) */}
            <BenchmarkCard
                userReturn={dayChangePercent}
                marketReturn={marketReturn}
                holdings={useMemo(() => items.map(i => ({ ticker: i.ticker, quantity: i.quantity })), [items])}
            />

            {/* 3. Risk Profile & Dividend Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Risk Profile Card */}
                <Popover>
                    <PopoverTrigger asChild>
                        <div
                            className={cn(
                                "relative overflow-hidden rounded-2xl border backdrop-blur-md p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between group",
                                "bg-white/40 dark:bg-black/20",
                                // Using Sky theme border only
                                "border-sky-500/20 dark:border-sky-500/20"
                            )}
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Activity className="w-12 h-12" />
                            </div>

                            <div className="space-y-1 relative z-10">
                                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    시장 민감도 (Beta) <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">Click</span>
                                </div>
                                <div className="text-xl font-bold flex items-end gap-1 text-foreground">
                                    {portfolioBeta.toFixed(1)}
                                    <span className="text-[10px] font-normal text-muted-foreground pb-1">/ 1.0 (S&P 500)</span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 relative z-10">
                                {/* Visual Gauge */}
                                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden flex">
                                    <div
                                        className={cn("h-full transition-all duration-500",
                                            portfolioBeta > 1.2 ? "bg-rose-500" :
                                                portfolioBeta < 0.8 ? "bg-emerald-500" : "bg-sky-500"
                                        )}
                                        style={{ width: `${Math.min(portfolioBeta * 50, 100)}% ` }}
                                    />
                                </div>
                                <div className={cn("text-[10px] font-bold text-right",
                                    portfolioBeta > 1.2 ? "text-rose-500 dark:text-rose-400" :
                                        portfolioBeta < 0.8 ? "text-emerald-500 dark:text-emerald-400" : "text-sky-500 dark:text-sky-400"
                                )}>
                                    {portfolioBeta > 1.2 ? "높은 변동성 ⚡" :
                                        portfolioBeta < 0.8 ? "낮은 변동성 🛡️" : "시장 평균 수준 ⚖️"}
                                </div>
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/20" align="start">
                        <div className="space-y-3">
                            <h4 className="font-bold flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-primary" /> 시장 민감도(Beta)란?
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                미국 주식시장(S&P 500)이 1% 움직일 때, 내 포트폴리오가 평균적으로 몇 % 움직이는지를 나타내는 지표입니다.
                            </p>

                            <div className="rounded-lg bg-secondary/50 p-3 text-xs space-y-2">
                                <div className="flex justify-between font-semibold">
                                    <span>내 포트폴리오:</span>
                                    <span className={cn(
                                        portfolioBeta > 1.2 ? "text-rose-500" :
                                            portfolioBeta < 0.8 ? "text-emerald-500" : "text-sky-500"
                                    )}>{portfolioBeta.toFixed(2)} Beta</span>
                                </div>
                                <div className="h-px bg-border/50" />
                                <p className="text-foreground/80 leading-relaxed">
                                    {portfolioBeta > 1.05
                                        ? `시장이 1 % 오를 때 약 ${portfolioBeta.toFixed(2)}% 오를 것으로 기대되지만, 하락장에서는 그만큼 더 많이 떨어질 위험이 있습니다. (고변동성)`
                                        : portfolioBeta < 0.95
                                            ? `시장이 1 % 오를 때 약 ${portfolioBeta.toFixed(2)}% 오르며, 하락장에서도 비교적 방어력이 좋아 덜 떨어집니다. (저변동성)`
                                            : `시장 지수와 거의 비슷하게 움직입니다.시장 수익률을 그대로 따라가는 안정적인 구조입니다.`
                                    }
                                </p>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Dividend Forecast Card */}
                <div
                    onClick={() => setIsDivCalendarOpen(true)}
                    className={cn(
                        "relative overflow-hidden rounded-2xl border backdrop-blur-md p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between group",
                        "bg-white/40 dark:bg-black/20",
                        // Using Sky theme border only
                        "border-sky-500/20 dark:border-sky-500/20"
                    )}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-12 h-12" />
                    </div>

                    <div className="space-y-1 relative z-10">
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            예상 배당금 <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">Click</span>
                        </div>
                        <div className="text-xl font-bold text-foreground">
                            {formatCurrency(estimatedAnnualIncome)}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-sky-500/10 relative z-10">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground">월 평균 수령액</span>
                            <span className="text-xs font-semibold text-foreground">
                                {formatCurrency(estimatedAnnualIncome / 12)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 1.9 Concentration Warning (New) */}
            {items.length > 0 && showConcentrationWarning && (() => {
                // Logic: Single stock > 30% or Top Sector > 45%
                const topStock = enrichedData && items.length > 0
                    ? [...items].sort((a, b) => (b.quantity * (enrichedData[b.ticker]?.price || b.avg_price)) - (a.quantity * (enrichedData[a.ticker]?.price || a.avg_price)))[0]
                    : null;

                if (!topStock) return null;

                const topStockValue = topStock.quantity * (enrichedData[topStock.ticker]?.price || topStock.avg_price);
                const isStockConcentrated = (topStockValue / totalValue) > 0.3;

                const topSector = sectorData?.[0];
                const isSectorConcentrated = topSector && (topSector.value / totalValue) > 0.45;

                if (!isStockConcentrated && !isSectorConcentrated) return null;

                const message = isStockConcentrated
                    ? `"${topStock.ticker}" 종목에 자산의 ${formatPercent((topStockValue / totalValue) * 100)}가 집중되어 있습니다.혹시 계란을 한 바구니에 너무 많이 담은건 아닌지 확인해보시는 것은 어떨까요 ? 🥚`
                    : `"${topSector.name}" 섹터에 자산의 ${formatPercent((topSector.value / totalValue) * 100)}가 쏠려 있습니다.해당 산업 리스크에 주의하세요! 🏗️`;

                return (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-xl border border-orange-500/30 bg-orange-500/5 p-4"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-50" />
                        <div className="relative flex items-start gap-3">
                            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="flex-1 pt-0.5">
                                <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-1">집중 투자 감지 🚨</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {message}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowConcentrationWarning(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors absolute right-0 top-0 p-2"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                );
            })()}

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
                                            <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
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


            </div>

            <EditStockDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                item={editingItem}
            />

            <DividendCalendarDialog
                open={isDivCalendarOpen}
                onOpenChange={setIsDivCalendarOpen}
                items={items}
            />
            {/* 3. Holdings List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        보유 종목 <span className="text-muted-foreground text-sm font-normal">({items.length})</span>
                    </h3>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 flex gap-1 items-center bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/10 rounded-full"
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    <span className="text-xs font-medium">
                                        {sortOptions.find(o => o.value === sortBy)?.label || "정렬"}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white/80 dark:bg-black/90 backdrop-blur-xl border-white/10">
                                <DropdownMenuLabel className="text-xs">정렬 기준</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                    {sortOptions.map((option) => (
                                        <DropdownMenuRadioItem
                                            key={option.value}
                                            value={option.value}
                                            className="text-xs cursor-pointer focus:bg-primary/20"
                                        >
                                            {option.label}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={onAdd} size="sm" className="rounded-full bg-white/10 hover:bg-white/20 text-foreground border border-white/10 shadow-sm">
                            <Plus className="w-4 h-4 mr-1" /> 자산 추가
                        </Button>
                    </div>
                </div>

                <div className="grid gap-3">
                    <AnimatePresence mode="popLayout">
                        {sortedItems.map((item, index) => {
                            const data = enrichedData[item.ticker];
                            const { currentValue, gainPercent } = item;
                            const gain = currentValue - (item.quantity * item.avg_price);
                            const isProfit = gain >= 0;

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => {
                                        setEditingItem(item);
                                        setIsEditOpen(true);
                                    }}
                                    className="group relative overflow-hidden rounded-xl bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:bg-accent/50 dark:hover:bg-white/10 transition-all p-4 flex items-center justify-between shadow-sm cursor-pointer"
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
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>편집</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingItem(item);
                                                    setIsEditOpen(true);
                                                }}>
                                                    <Plus className="w-3 h-3 mr-2" /> 수정하기
                                                </DropdownMenuItem>
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
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

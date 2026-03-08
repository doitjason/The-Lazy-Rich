
"use client";

import { useEffect, useState, useMemo } from "react";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { getPortfolioData, getBenchmarkData } from "@/app/actions/portfolio-actions";
import { EnrichedPortfolioItem } from "@/lib/market-types";
import { formatPercent, cn } from "@/lib/utils";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
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

import { ValuationCard } from "./ValuationCard";
import { DiversificationCard } from "./DiversificationCard";

interface PortfolioDashboardProps {
    onAdd: () => void;
}

const COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

import { GURU_PERSONAS } from "@/lib/guru-personas";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { EmptyPortfolio } from "./EmptyPortfolio";

function PortfolioDashboardSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-2 mt-4">
            {/* Balance Card Skeleton */}
            <Skeleton className="h-44 w-full rounded-2xl bg-white/20 dark:bg-white/5" />

            {/* Benchmark Card Skeleton */}
            <Skeleton className="h-[72px] w-full rounded-2xl bg-white/40 dark:bg-white/5" />

            {/* 2-Grid Skeleton */}
            <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-[120px] w-full rounded-2xl bg-white/40 dark:bg-white/5" />
                <Skeleton className="h-[120px] w-full rounded-2xl bg-white/40 dark:bg-white/5" />
                <Skeleton className="h-[120px] w-full rounded-2xl bg-white/40 dark:bg-white/5" />
                <Skeleton className="h-[120px] w-full rounded-2xl bg-white/40 dark:bg-white/5" />
            </div>

            {/* Donut Chart Skeleton */}
            <Skeleton className="h-[400px] w-full rounded-2xl bg-white/40 dark:bg-white/5" />

            {/* List Header Skeleton */}
            <div className="space-y-4 mt-8">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-24 w-full rounded-xl bg-white/40 dark:bg-white/5" />
                <Skeleton className="h-24 w-full rounded-xl bg-white/40 dark:bg-white/5" />
                <Skeleton className="h-24 w-full rounded-xl bg-white/40 dark:bg-white/5" />
            </div>
        </div>
    );
}

export function PortfolioDashboard({ onAdd }: PortfolioDashboardProps) {
    const { user } = useAuth();
    const { currency, exchangeRate, formatCurrency, formatCompactNumber } = useCurrency();
    const { items, loading: storeLoading, deleteItem, fetchPortfolio, setLocalItems } = usePortfolioStore();

    // Helper to convert USD to selected currency
    const convert = (value: number) => currency === "KRW" ? value * exchangeRate : value;

    const router = useRouter();
    const [enrichedData, setEnrichedData] = useState<Record<string, EnrichedPortfolioItem>>({});

    // We start as loading to avoid initial flicker
    const [isEnrichedLoading, setIsEnrichedLoading] = useState(true);

    const [showReturnPercent, setShowReturnPercent] = useState(true);
    const [marketReturn, setMarketReturn] = useState(0);
    const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [showConcentrationWarning, setShowConcentrationWarning] = useState(true);

    // Sorting state
    const [sortBy, setSortBy] = useState<string>("recent");
    const [isDivCalendarOpen, setIsDivCalendarOpen] = useState(false);
    const [allocationView, setAllocationView] = useState<'asset' | 'sector' | 'stock'>('asset');

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
        let isMounted = true;
        async function loadData() {
            // When items are empty, no enriched data needed
            if (items.length === 0) {
                if (isMounted) setIsEnrichedLoading(false);
                return;
            }

            if (isMounted) setIsEnrichedLoading(true);
            try {
                const tickers = items.map(i => i.ticker);
                const data = await getPortfolioData(tickers);
                console.log("[PortfolioDashboard] Enriched Data Received:", data);
                if (isMounted) setEnrichedData(data);
            } catch (error) {
                console.error("Failed to fetch enriched data", error);
            } finally {
                if (isMounted) setIsEnrichedLoading(false);
            }
        }

        loadData();
        return () => { isMounted = false; };
    }, [items]);



    // Calculate Totals & Stats
    const { totalValue, totalCost, totalDayChange, dayChangePercent, portfolioBeta, estimatedAnnualIncome, portfolioYield, portfolioPer, portfolioRoe, roeCoverage } = useMemo(() => {
        let totalVal = 0;
        let totalCst = 0;
        let dayChg = 0;
        let weightedBetaSum = 0;
        let weightedPerSum = 0;
        let weightedRoeSum = 0;
        let totalRoeWeight = 0;
        let totalPerWeight = 0;
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

                // PER Logic
                if (data.per && data.per > 0) {
                    weightedPerSum += data.per * value;
                    totalPerWeight += value;
                }

                // ROE Logic
                if (data.roe) {
                    weightedRoeSum += data.roe * value;
                    totalRoeWeight += value;
                }
            } else {
                weightedBetaSum += 1.0 * value;
            }
        });

        const dayChgPct = (totalVal - dayChg) > 0 ? (dayChg / (totalVal - dayChg)) * 100 : 0;
        const avgBeta = totalVal > 0 ? weightedBetaSum / totalVal : 1.0;
        const avgYield = totalVal > 0 ? (totalDividendIncome / totalVal) : 0;

        const avgPer = totalPerWeight > 0 ? weightedPerSum / totalPerWeight : 0;
        const avgRoe = totalRoeWeight > 0 ? weightedRoeSum / totalRoeWeight : 0;

        return {
            totalValue: totalVal,
            totalCost: totalCst,
            totalDayChange: dayChg,
            dayChangePercent: dayChgPct,
            portfolioBeta: avgBeta,
            estimatedAnnualIncome: totalDividendIncome,
            portfolioYield: avgYield,
            portfolioPer: avgPer,
            portfolioRoe: avgRoe,
            roeCoverage: totalVal > 0 ? (totalRoeWeight / totalVal) * 100 : 0
        };
    }, [items, enrichedData]);

    const totalReturn = totalValue - totalCost;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // Asset Allocation Data (Dual View Support)
    const sectorData = useMemo(() => {
        const groups: Record<string, number> = {};

        // Sector naming translation map
        const SECTOR_MAP: Record<string, string> = {
            "Technology": "IT / 기술",
            "Healthcare": "헬스케어",
            "Financial Services": "금융",
            "Consumer Cyclical": "경기소비재",
            "Consumer Defensive": "필수소비재",
            "Energy": "에너지",
            "Industrials": "산업재",
            "Communication Services": "통신",
            "Utilities": "유틸리티",
            "Basic Materials": "기초소재",
            "Real Estate": "부동산",
            "Unknown": "기타"
        };

        // Helper for Asset Class Mapping
        const getAssetClass = (raw: string): string => {
            const r = (raw || "Unknown").toLowerCase();

            // 1. Gold
            if (r.includes('gold') || r.includes('금')) return "금";

            // 2. Commodities
            if (r.includes('metal') || r.includes('commodity') || r.includes('oil') || r.includes('material') || r.includes('원자재') || r.includes('원유') || r.includes('은')) return "원자재";

            // 3. Crypto
            if (r.includes('crypto') || r.includes('bitcoin') || r.includes('암호화폐')) return "암호화폐";

            // 4. Real Estate
            if (r.includes('real estate') || r.includes('부동산') || r.includes('리츠')) return "부동산";

            // 5. Bonds
            if (r.includes('bond') || r.includes('fixed income') || r.includes('treasury') || r.includes('debt') || r.includes('notes') || r.includes('채권') || r.includes('국채') || r.includes('물가연동')) return "채권";

            // 6. Cash
            if (r.includes('cash') || r.includes('money market') || r.includes('현금') || r.includes('파킹')) return "현금";

            return "주식";
        };

        items.forEach(item => {
            const data = enrichedData[item.ticker];
            const value = item.quantity * (Number(data?.price) || item.avg_price);
            const rawSector = data?.sector || "Unknown";

            const key = allocationView === 'asset'
                ? getAssetClass(rawSector)
                : allocationView === 'sector'
                    ? (SECTOR_MAP[rawSector] || rawSector)
                    : item.ticker.replace(".KS", "");

            groups[key] = (groups[key] || 0) + value;
        });

        return Object.entries(groups)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [items, enrichedData, allocationView]);

    // Diversification/Correlation Guard Logic
    const { diversificationScore, assetCount, sectorCount, topSectorStat, hasDefensiveAssets } = useMemo(() => {
        if (totalValue === 0) return { diversificationScore: 0, assetCount: 0, sectorCount: 0, topSectorStat: { name: "N/A", percent: 0 }, hasDefensiveAssets: false };

        // 1. Asset Classes (Stocks, Bonds, Gold, Cash, Crypto)
        const assetClasses = new Set<string>();
        let defensiveSum = 0;
        const bondKeywords = ['bond', 'treasury', 'fixed income', '채권', '국채'];
        const goldKeywords = ['gold', '금', '은', 'commodity', '원자재'];
        const cashKeywords = ['cash', 'money market', '현금', '파킹'];

        // 2. Sectors (For concentration)
        const sectors = new Set<string>();
        const sectorWeights: Record<string, number> = {};

        items.forEach(item => {
            const data = enrichedData[item.ticker];
            const val = item.quantity * (Number(data?.price) || item.avg_price);
            const rawSector = (data?.sector || "Unknown");

            // Asset Class Check
            if (bondKeywords.some(k => rawSector.toLowerCase().includes(k))) {
                assetClasses.add("Bond");
                defensiveSum += val;
            } else if (goldKeywords.some(k => rawSector.toLowerCase().includes(k))) {
                assetClasses.add("Gold");
                defensiveSum += val;
            } else if (cashKeywords.some(k => rawSector.toLowerCase().includes(k))) {
                assetClasses.add("Cash");
                defensiveSum += val;
            } else if (rawSector.toLowerCase().includes('crypto') || rawSector.toLowerCase().includes('bitcoin')) {
                assetClasses.add("Crypto");
            } else {
                assetClasses.add("Stock");
            }

            // Sector Weight
            const sectorName = rawSector === "Unknown" ? "기타" : rawSector;
            sectorWeights[sectorName] = (sectorWeights[sectorName] || 0) + val;
            sectors.add(sectorName);
        });

        const defensiveRatio = defensiveSum / totalValue;
        const hasDefensive = defensiveRatio > 0.1; // 10% 이상 보유 시 인정

        // 3. Concentration (Top Sector)
        const sortedSectors = Object.entries(sectorWeights).sort((a, b) => b[1] - a[1]);
        const top = sortedSectors.length > 0 ? sortedSectors[0] : ["N/A", 0] as [string, number];
        const topRatio = top[1] / totalValue;

        // --- Scoring Logic (Max 100) ---
        let score = 100;

        // Penalty 1: Sector Concentration (>30% is risky)
        if (topRatio > 0.3) score -= (topRatio - 0.3) * 100; // e.g. 50% -> -20pts

        // Penalty 2: Asset Class Diversity
        if (assetClasses.size === 1) score -= 20; // Only Stocks?
        else if (assetClasses.size === 2) score -= 5;
        // else 3+ is good

        // Penalty 3: Defensive Assets
        if (!hasDefensive) score -= 15;

        // Penalty 4: Item Count (Too few stocks)
        if (items.length < 5) score -= 10;

        // Cap Score
        score = Math.max(0, Math.min(100, Math.round(score)));

        return {
            diversificationScore: score,
            assetCount: items.length,
            sectorCount: sectors.size,
            topSectorStat: { name: top[0], percent: topRatio * 100 },
            hasDefensiveAssets: hasDefensive
        };
    }, [items, enrichedData, totalValue]);



    const isLoading = storeLoading || isEnrichedLoading;

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

    const holdingsForBenchmark = useMemo(() => items.map(i => ({ ticker: i.ticker, quantity: i.quantity })), [items]);

    if (!storeLoading && items.length === 0) {
        return <EmptyPortfolio onAdd={onAdd} onSelectPreset={setLocalItems} />;
    }

    if (isLoading) {
        return <PortfolioDashboardSkeleton />;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* 1. Total Balance Card (Gradient) */}
            <Card className="border-0 overflow-hidden relative shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-90" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />

                <CardContent className="relative z-10 pt-4 pb-6 px-5 flex flex-col items-center justify-center gap-3 text-white">
                    <div className="text-white/80 text-lg font-medium tracking-wide">총 순자산 {currency === "KRW" ? "(₩)" : "($)"}</div>
                    {(() => {
                        const formattedTotal = formatCurrency(convert(totalValue));
                        const len = formattedTotal.length;
                        let sizeClass = "text-4xl"; // 기본값을 3xl에서 4xl로 상향
                        if (len > 22) sizeClass = "text-xl";
                        else if (len > 18) sizeClass = "text-2xl";
                        else if (len > 14) sizeClass = "text-3xl";
                        return (
                            <div className={cn(sizeClass, "leading-tight font-black tracking-tight whitespace-nowrap")} style={{ whiteSpace: 'nowrap' }}>
                                {formattedTotal}
                            </div>
                        );
                    })()}
                    <div className="flex flex-col gap-1.5 w-full max-w-[340px] bg-white/10 px-5 py-3.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner mt-1">
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-white/80 text-sm font-semibold flex-shrink-0">일간 수익</span>
                            <div className={cn("flex items-center font-bold text-sm whitespace-nowrap", totalDayChange >= 0 ? "text-emerald-300" : "text-rose-300")} style={{ whiteSpace: 'nowrap' }}>
                                {totalDayChange >= 0 ? <Plus className="w-3.5 h-3.5 mr-0.5 flex-shrink-0" /> : null}
                                {formatCurrency(convert(totalDayChange))} ({formatPercent(dayChangePercent)})
                            </div>
                        </div>
                        <div className="h-px w-full bg-white/10 my-0.5" />
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-white/80 text-sm font-semibold flex-shrink-0">총 수익</span>
                            <div className={cn("flex items-center font-bold text-sm whitespace-nowrap", totalReturn >= 0 ? "text-emerald-300" : "text-rose-300")} style={{ whiteSpace: 'nowrap' }}>
                                {totalReturn >= 0 ? <Plus className="w-3.5 h-3.5 mr-0.5 flex-shrink-0" /> : null}
                                {formatCurrency(convert(totalReturn), { maximumFractionDigits: 0 })} ({formatPercent(totalReturnPercent)})
                            </div>
                        </div>
                    </div>

                    {/* Style Tags Embedded */}
                    {items.length > 0 && (
                        <div className="flex items-center justify-start gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                            {/* Beta Tag */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className={cn(
                                        "flex items-center px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-all whitespace-nowrap"
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
                                        <button className="flex items-center px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-all whitespace-nowrap">
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
                                        <button className="flex items-center px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-all whitespace-nowrap">
                                            🎯 {sectorData[0].name} 집중
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3 text-xs bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/20">
                                        <div className="font-bold mb-1">집중 투자 경고</div>
                                        <div className="text-muted-foreground">
                                            자산의 45% 이상이 <strong>{sectorData[0].name}</strong> {allocationView === 'asset' ? '자산군' : '섹터'}에 쏠려 있습니다. 해당 {allocationView === 'asset' ? '자산군' : '산업'}의 호재에 크게 반응하지만, 악재 발생 시 리스크가 커질 수 있습니다.
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            ) : items.length >= 5 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-all whitespace-nowrap">
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
                                        <button className="flex items-center px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-all whitespace-nowrap">
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
                                        <button className="flex items-center px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm bg-white/10 border-white/20 text-white/90 hover:bg-white/20 transition-all whitespace-nowrap">
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
                holdings={holdingsForBenchmark}
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
                                // Using Emerald theme border
                                "border-emerald-500/20 dark:border-emerald-500/20"
                            )}
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Activity className="w-12 h-12" />
                            </div>

                            <div className="space-y-1 relative z-10">
                                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    시장 민감도 (Beta)
                                </div>
                                <div className="text-lg font-black flex items-end gap-0.5 text-foreground">
                                    {portfolioBeta.toFixed(2)}
                                    <span className="text-[9px] font-normal text-muted-foreground pb-0.5">/ 1.0</span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 relative z-10">
                                {/* Visual Gauge */}
                                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden flex">
                                    <div
                                        className={cn("h-full transition-all duration-500",
                                            portfolioBeta > 1.2 ? "bg-rose-500" :
                                                portfolioBeta < 0.8 ? "bg-emerald-500" : "bg-primary"
                                        )}
                                        style={{ width: `${Math.min(portfolioBeta * 50, 100)}% ` }}
                                    />
                                </div>
                                <div className={cn("text-xs font-bold text-right whitespace-nowrap",
                                    portfolioBeta > 1.2 ? "text-rose-500 dark:text-rose-400" :
                                        portfolioBeta < 0.8 ? "text-emerald-500 dark:text-emerald-400" : "text-primary dark:text-primary"
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
                                            portfolioBeta < 0.8 ? "text-emerald-500" : "text-primary"
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
                        // Using Emerald theme border
                        "border-emerald-500/20 dark:border-emerald-500/20"
                    )}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-12 h-12" />
                    </div>

                    <div className="space-y-1 relative z-10">
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            예상 배당금 <span className="text-[10px] opacity-60 font-normal">(세전)</span>
                        </div>
                        <div className="text-lg font-black text-foreground">
                            {formatCurrency(convert(estimatedAnnualIncome), { maximumFractionDigits: 0 })}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-500/10 relative z-10">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground">월 평균 수령액</span>
                            <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 whitespace-nowrap">
                                {formatCurrency(convert(estimatedAnnualIncome / 12), { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>
                </div>


                {/* Valuation Card (New Location) */}
                {items.length > 0 && portfolioPer > 0 && (
                    <ValuationCard portfolioPer={portfolioPer} portfolioRoe={portfolioRoe} roeCoverage={roeCoverage} />
                )}

                {/* Diversification Card (New) */}
                {items.length > 0 && (
                    <DiversificationCard
                        score={diversificationScore}
                        assetCount={assetCount}
                        sectorCount={sectorCount}
                        topSector={topSectorStat}
                        hasDefensiveAssets={hasDefensiveAssets}
                    />
                )}
            </div>





            {/* 1.9 Concentration Warning (New) */}
            {
                items.length > 0 && showConcentrationWarning && (() => {
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
                        ? `"${topStock.ticker.replace(".KS", "")}" 종목에 자산의 ${formatPercent((topStockValue / totalValue) * 100)}가 집중되어 있습니다. 혹시 계란을 한 바구니에 너무 많이 담은건 아닌지 확인해보시는 것은 어떨까요? 🥚`
                        : `"${topSector.name.replace(".KS", "")}" ${allocationView === 'asset' ? '자산군' : '섹터'}에 자산의 ${formatPercent((topSector.value / totalValue) * 100)}가 쏠려 있습니다. 해당 ${allocationView === 'asset' ? '자산군' : '산업'} 리스크에 주의하세요! 🏗️`;

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
                                    <h4 className="text-base font-bold text-orange-700 dark:text-orange-400 mb-1">집중 투자 감지 🚨</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
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
                })()
            }


            {/* 2. Asset Allocation & Stats Grid */}
            <div className="grid grid-cols-1 gap-4">
                {/* Donut Chart with Legend */}
                <Card className="bg-card dark:bg-white/5 border-border dark:border-white/10 backdrop-blur-sm overflow-hidden shadow-sm">
                    <CardHeader className="pb-2 px-5 pt-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4 text-primary" /> 자산 배분 현황
                        </CardTitle>
                        <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
                            <button
                                onClick={() => setAllocationView('asset')}
                                className={cn(
                                    "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                                    allocationView === 'asset' ? "bg-white dark:bg-white/10 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                자산군별
                            </button>
                            <button
                                onClick={() => setAllocationView('sector')}
                                className={cn(
                                    "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                                    allocationView === 'sector' ? "bg-white dark:bg-white/10 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                섹터별
                            </button>
                            <button
                                onClick={() => setAllocationView('stock')}
                                className={cn(
                                    "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                                    allocationView === 'stock' ? "bg-white dark:bg-white/10 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                종목별
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pt-0 pb-4">
                        {items.length > 0 ? (
                            <div className="flex flex-col items-center gap-6">
                                {/* 1. Chart Area - Significantly Larger */}
                                <div className="relative w-full max-w-[260px] aspect-square flex-shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={sectorData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={85}
                                                outerRadius={115}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                                animationDuration={1000}
                                            >
                                                {sectorData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                formatter={(value: number | undefined) => [formatCurrency(convert(value || 0)), "평가금액"]}
                                                contentStyle={{
                                                    backgroundColor: 'rgba(23, 23, 23, 0.95)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    backdropFilter: 'blur(12px)',
                                                    color: '#fff',
                                                    fontSize: '12px'
                                                }}
                                                itemStyle={{ color: '#fff', padding: '2px 0' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text Area - Scaled up for clarity */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
                                        <div className="text-center overflow-hidden w-full">
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-1">
                                                {allocationView === 'asset' ? '주요 자산' : allocationView === 'sector' ? '주요 섹터' : '주요 종목'}
                                            </div>
                                            <div className="text-base font-black text-foreground leading-tight line-clamp-2 break-words">
                                                {sectorData[0]?.name || "없음"}
                                            </div>
                                            <div className="text-sm font-bold text-primary mt-1">
                                                {formatPercent((sectorData[0]?.value / totalValue) * 100, 0)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Custom Legend Area - Full Width Grid */}
                                <div className="w-full space-y-3">
                                    <div className="grid grid-cols-1 gap-1">
                                        {sectorData.map((sector, index) => (
                                            <div key={sector.name} className="flex items-center justify-between group min-w-0 gap-4 hover:bg-white/5 py-1 px-2 -mx-2 rounded-lg transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-125" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span className="text-[14px] font-bold text-foreground/90 group-hover:text-foreground transition-colors truncate">
                                                        {sector.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                    <span className="text-[12px] text-muted-foreground font-medium tabular-nums">{formatCurrency(convert(sector.value))}</span>
                                                    <div className="min-w-[65px] text-right">
                                                        <span className="text-[14px] font-black tabular-nums whitespace-nowrap">
                                                            {formatPercent((sector.value / totalValue) * 100, 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 3. Strategy Insight Bar - At the bottom */}
                                    <div className="mt-2 p-4 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            The Lazy Rich 분석 결과
                                        </div>
                                        <p className="text-[12px] text-muted-foreground leading-relaxed font-medium">
                                            {allocationView === 'asset' ? (
                                                sectorData.length >= 3
                                                    ? "현재 포트폴리오는 주식, 채권, 금, 원자재 등 다양한 자산군에 분산되어 있습니다. 이는 시장 급변동 시에도 자산을 방어하는 데 효과적입니다."
                                                    : "특정 자산군(주로 주식)에 비중이 쏠려 있습니다. 장기적 안정성을 위해 상관관계가 낮은 채권이나 금, 원자재 비중을 늘리는 '올웨더(All-weather)' 전략을 검토해보세요."
                                            ) : allocationView === 'sector' ? (
                                                sectorData[0]?.value / totalValue > 0.4
                                                    ? `상위 섹터(${sectorData[0]?.name})의 비중이 ${formatPercent((sectorData[0]?.value / totalValue) * 100)}로 높습니다. 해당 산업군의 경기에 포트폴리오가 민감하게 반응할 수 있으니 주의가 필요합니다.`
                                                    : "산업 섹터별로 안정적인 분산 투자가 이루어지고 있습니다. 특정 섹터의 침체시에도 전체 손실을 제한할 수 있는 건전한 배분입니다."
                                            ) : (
                                                sectorData[0]?.value / totalValue > 0.2
                                                    ? `"${sectorData[0]?.name}" 종목의 비중이 전체의 ${formatPercent((sectorData[0]?.value / totalValue) * 100)}를 차지하고 있습니다. 개별 종목 리스크가 큰 편이니 비중 조절을 검토해보세요.`
                                                    : "전체적으로 종목 간 비중이 균형 있게 배분되어 있습니다. 특정 기업의 악재가 포트폴리오 전체를 흔들 위험이 적은 상태입니다."
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                                <div className="p-3 rounded-full bg-secondary/30">
                                    <PieChartIcon className="w-6 h-6 opacity-20" />
                                </div>
                                자산 데이터가 없습니다. 종목을 추가해보세요.
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
                                    className="group relative overflow-hidden rounded-xl bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:bg-accent/50 dark:hover:bg-white/10 transition-all p-4 flex items-center justify-between gap-3 shadow-sm cursor-pointer"
                                >

                                    {/* Left: Info */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            {/* Using API Route to proxy logo requests to avoid CORS/broken images */}
                                            <img
                                                src={`/api/logo?ticker=${item.ticker}`}
                                                alt={item.ticker}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    // Show fallback
                                                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-initial');
                                                    if (fallback) fallback.classList.remove('hidden');
                                                }}
                                            />
                                            {/* Fallback Initial */}
                                            <div className="fallback-initial hidden absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-sm font-bold text-white/90">
                                                {item.ticker.slice(0, 1)}
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm truncate">{item.ticker.replace(".KS", "")}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <span className="whitespace-nowrap">{item.quantity}주</span>
                                                <span className="w-0.5 h-0.5 rounded-full bg-gray-500 flex-shrink-0" />
                                                <span className="truncate">{data?.sector || "주식"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Price */}
                                    <div className="text-right flex-shrink-0">
                                        <div className="font-medium text-sm whitespace-nowrap">{formatCurrency(convert(currentValue))}</div>
                                        <div className={cn("text-[11px] font-medium whitespace-nowrap", isProfit ? "text-emerald-400" : "text-rose-400")}>
                                            {isProfit ? "+" : ""}{formatCurrency(convert(gain))} ({formatPercent(gainPercent)})
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
                                    <div className="absolute right-2 top-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
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
        </div >
    );
}

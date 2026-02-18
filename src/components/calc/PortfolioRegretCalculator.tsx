"use client";

import { useState, useEffect } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Plus, Trash2, PieChart, TrendingUp, TrendingDown, Sparkles, HelpCircle, ChevronDown, DollarSign, CalendarDays, RefreshCw } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StockSearchInput } from "@/components/ui/StockSearchInput";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useAuth } from "@/contexts/AuthContext";

interface PortfolioAsset {
    ticker: string;
    weight: number; // 0-100
    name?: string;
}

interface PortfolioResult {
    period: string;
    initialInvestment: number;
    finalValue: number;
    profit: number;
    returnRate: number;
    cagr: number;
    mdd: number;
    bestYear: { year: number; return: number };
    worstYear: { year: number; return: number };
    winRate: number;
    chartData: { name: string; value: number }[];
    actualPeriod?: string;
    mddPeriod?: {
        start: string;
        end: string;
    };
    rebalanceCount: number;
    rebalancePeriodUsed: string;
    assets: {
        ticker: string;
        initialValue: number;
        finalValue: number;
        returnRate: number;
        profit: number;
        contributionShare: number;
    }[];
}

const PRESETS = [
    {
        name: "내 포트폴리오",
        id: "my-portfolio",
        description: "현재 보유 종목 비율",
        icon: "👤"
    },
    {
        name: "워렌 버핏 (버크셔)",
        id: "buffett",
        description: "애플, 코카콜라 등 가치주 5선",
        assets: [
            { ticker: "AAPL", weight: 45, name: "Apple" },
            { ticker: "BAC", weight: 15, name: "Bank of America" },
            { ticker: "AXP", weight: 15, name: "American Express" },
            { ticker: "KO", weight: 15, name: "Coca-Cola" },
            { ticker: "OXY", weight: 10, name: "Occidental Petroleum" }
        ],
        icon: "👴"
    },
    {
        name: "국민연금 (NPS)",
        id: "nps",
        description: "삼성전자와 미 지수 분산 투자",
        assets: [
            { ticker: "005930.KS", weight: 20, name: "삼성전자" },
            { ticker: "SPY", weight: 30, name: "S&P 500" },
            { ticker: "AGG", weight: 35, name: "US Aggregate Bond" },
            { ticker: "GLD", weight: 15, name: "Gold" }
        ],
        icon: "🇰🇷"
    },
    {
        name: "나스닥 100 (QQQ)",
        id: "nasdaq-100",
        description: "미국 기술주 중심의 성장 투자",
        assets: [
            { ticker: "QQQ", weight: 100, name: "Invesco QQQ Trust" }
        ],
        icon: "🚀"
    },
    {
        name: "레이 달리오 올웨더",
        id: "all-weather",
        description: "사계절 내내 안정적인 수익",
        assets: [
            { ticker: "VTI", weight: 30, name: "Total Stock Market" },
            { ticker: "TLT", weight: 40, name: "20+ Year Treasury Bond" },
            { ticker: "IEF", weight: 15, name: "7-10 Year Treasury Bond" },
            { ticker: "GLD", weight: 7.5, name: "Gold" },
            { ticker: "GSG", weight: 7.5, name: "Commodity Index" }
        ],
        icon: "🌦️"
    }
];

export function PortfolioRegretCalculator() {
    const { currency, exchangeRate, formatCurrency, formatCompactNumber } = useCurrency();
    const { user } = useAuth();
    const { items, fetchPortfolio } = usePortfolioStore();

    const [assets, setAssets] = useState<PortfolioAsset[]>([{ ticker: "", weight: 100 }]);
    const [amount, setAmount] = useState<number>(currency === "KRW" ? 10000000 : 10000);
    const [period, setPeriod] = useState<"1Y" | "3Y" | "5Y" | "10Y" | "20Y" | "30Y">("10Y");
    const [rebalancePeriod, setRebalancePeriod] = useState<"monthly" | "semi-annually" | "annually" | "none">("annually");
    const [result, setResult] = useState<PortfolioResult | null>(null);
    const [isCalculated, setIsCalculated] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<string>("내 포트폴리오");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    // Update default values when currency changes
    useEffect(() => {
        if (currency === "KRW") {
            setAmount(10000000);
        } else {
            setAmount(10000);
        }
        setIsCalculated(false);
        setResult(null);
    }, [currency]);

    // Initial load of portfolio if user is logged in
    useEffect(() => {
        if (user) {
            fetchPortfolio(user.id);
        }
    }, [user, fetchPortfolio]);

    // Auto-apply "My Portfolio" once loaded
    useEffect(() => {
        if (items && items.length > 0 && selectedPreset === "내 포트폴리오" && assets.length === 1 && assets[0].ticker === "") {
            applyMyPortfolio();
        }
    }, [items, selectedPreset, assets]);

    // Construct "My Portfolio" logic
    const applyMyPortfolio = () => {
        if (!items || items.length === 0) {
            setError("등록된 포트폴리오가 없습니다. 먼저 자산을 추가해주세요.");
            return;
        }

        const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.avg_price), 0);
        if (totalValue === 0) {
            setError("포트폴리오 가치가 0입니다.");
            return;
        }

        setSelectedPreset("내 포트폴리오");
        const myAssets: PortfolioAsset[] = items.map(item => ({
            ticker: item.ticker,
            weight: Number((((item.quantity * item.avg_price) / totalValue) * 100).toFixed(2)),
            name: item.ticker
        }));

        // Adjust weights to sum exactly 100 due to rounding
        const currentSum = myAssets.reduce((sum, a) => sum + a.weight, 0);
        if (currentSum !== 100 && myAssets.length > 0) {
            myAssets[0].weight += (100 - currentSum);
            myAssets[0].weight = Number(myAssets[0].weight.toFixed(2));
        }

        setAssets(myAssets);
        setIsCalculated(false);
        setResult(null);
        setError(null);
    };

    const applyPreset = (presetId: string) => {
        if (presetId === "my-portfolio") {
            applyMyPortfolio();
            return;
        }

        const preset = PRESETS.find(p => p.id === presetId);
        if (preset && preset.assets) {
            setAssets([...preset.assets]);
            setSelectedPreset(preset.name);
            setIsCalculated(false);
            setResult(null);
            setError(null);
        }
    };

    const handleAddAsset = () => {
        setAssets([...assets, { ticker: "", weight: 0 }]);
    };

    const handleRemoveAsset = (index: number) => {
        if (assets.length <= 1) return;
        const newAssets = assets.filter((_, i) => i !== index);
        setAssets(newAssets);
    };

    const handleAssetChange = (index: number, field: keyof PortfolioAsset, value: string | number) => {
        const newAssets = [...assets];
        newAssets[index] = { ...newAssets[index], [field]: value };
        setAssets(newAssets);
    };

    const normalizeWeights = () => {
        const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0);
        if (totalWeight === 0) return;

        const normalized = assets.map(a => ({
            ...a,
            weight: Number(((a.weight / totalWeight) * 100).toFixed(2))
        }));

        // Fix rounding error on the largest weight item
        const newSum = normalized.reduce((sum, a) => sum + a.weight, 0);
        if (newSum !== 100) {
            const maxIndex = normalized.reduce((iMax, x, i, arr) => x.weight > arr[iMax].weight ? i : iMax, 0);
            normalized[maxIndex].weight += (100 - newSum);
            normalized[maxIndex].weight = Number(normalized[maxIndex].weight.toFixed(2));
        }

        setAssets(normalized);
    };

    const onCalculate = async () => {
        // Validate inputs
        const validAssets = assets.filter(a => a.ticker.trim() !== "");
        if (validAssets.length === 0) {
            setError("최소 1개 이상의 종목을 입력해주세요.");
            return;
        }

        const totalWeight = validAssets.reduce((sum, a) => sum + a.weight, 0);
        if (Math.abs(totalWeight - 100) > 0.1) {
            setError(`비중의 합은 100%여야 합니다. (현재: ${totalWeight.toFixed(1)}%)`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch history for all assets
            const responses = await Promise.all(
                validAssets.map(asset =>
                    fetch(`/api/stock/historical?ticker=${encodeURIComponent(asset.ticker)}&period=${period}`).then(res => res.json())
                )
            );

            // Check for errors
            const errorResponse = responses.find(r => r.error);
            if (errorResponse) {
                setError(errorResponse.error || "데이터 조회 실패");
                setIsLoading(false);
                return;
            }

            // Calculate Portfolio Performance
            // 1. Determine common start date (latest of all start dates)
            const startDates = responses.map(r => new Date(r.actualStartDate).getTime());
            const latestStartDate = Math.max(...startDates);
            const commonStartDateStr = new Date(latestStartDate).toISOString().split('T')[0];

            // 2. Filter chart data to start from common date
            const alignedData = responses.map(r => {
                return {
                    ticker: r.ticker,
                    data: (r.chartData as any[]).filter(d => new Date(d.name).getTime() >= latestStartDate)
                };
            });

            // 3. Normalize to same length (shortest common length)
            const minLength = Math.min(...alignedData.map(d => d.data.length));
            const truncatedData = alignedData.map(d => ({
                ticker: d.ticker,
                data: d.data.slice(d.data.length - minLength) // Take from end
            }));

            // 4. Calculate Weighted Portfolio Value Series
            // Initial Investment per asset
            const investmentUSD = currency === "KRW" ? amount / exchangeRate : amount;
            const assetInvestments = validAssets.map(asset => ({
                ticker: asset.ticker,
                initialAmount: investmentUSD * (asset.weight / 100),
                weight: asset.weight
            }));

            // Chart data generation
            const portfolioChartData: { name: string; value: number }[] = [];

            // Rebalancing Logic - Modulo Based (Strict Calendar)
            let currentHoldings = assetInvestments.map(inv => {
                const startPrice = truncatedData.find(d => d.ticker === inv.ticker)!.data[0].price;
                return {
                    ticker: inv.ticker,
                    units: inv.initialAmount / startPrice,
                    weight: inv.weight
                };
            });

            let rebalanceCount = 0;

            // Map period to month interval. 
            // Monthly = 1, Semi-Annual = 6, Annual = 12
            const intervalMap: Record<string, number> = {
                "monthly": 1,
                "semi-annually": 6,
                "annually": 12,
                "none": 0
            };
            const targetInterval = intervalMap[rebalancePeriod] || 0;

            if (truncatedData[0].data.length > 0) {
                // Helper to calculate unique month key (Year * 12 + Month)
                const getMonthKey = (dateStr: string) => {
                    const d = new Date(dateStr);
                    return d.getFullYear() * 12 + d.getMonth();
                };

                // Initialize start key
                const startMonthKey = getMonthKey(truncatedData[0].data[0].name);
                let lastProcessedMonthKey = startMonthKey;

                // Iterate through time points
                for (let i = 0; i < minLength; i++) {
                    const dateLabel = truncatedData[0].data[i].name;
                    const currentMonthKey = getMonthKey(dateLabel);

                    // 1. Calculate Total Portfolio Value at this time step
                    let totalValueAtT = 0;
                    const assetValuesAtT: { ticker: string, value: number, price: number }[] = [];

                    for (const holding of currentHoldings) {
                        const tickerData = truncatedData.find(d => d.ticker === holding.ticker);
                        if (tickerData) {
                            const currentPrice = tickerData.data[i].price;
                            const val = holding.units * currentPrice;
                            assetValuesAtT.push({ ticker: holding.ticker, value: val, price: currentPrice });
                            totalValueAtT += val;
                        }
                    }

                    // 2. Add to chart data
                    const multiplier = currency === "KRW" ? exchangeRate : 1;
                    portfolioChartData.push({
                        name: dateLabel,
                        value: Math.round(totalValueAtT * multiplier)
                    });

                    // 3. Rebalance Check
                    // Check if month changed
                    if (i > 0 && currentMonthKey > lastProcessedMonthKey) {

                        // Only calculate rebalancing if interval is set
                        if (targetInterval > 0) {
                            const monthsFromStart = currentMonthKey - startMonthKey;
                            const prevMonthsFromStart = lastProcessedMonthKey - startMonthKey;

                            // Check boundary crossing (robust against data gaps)
                            // e.g. Interval 12. Month 11 (floor 0) -> Month 12 (floor 1). Trigger.
                            if (Math.floor(monthsFromStart / targetInterval) > Math.floor(prevMonthsFromStart / targetInterval)) {
                                rebalanceCount++;

                                // Redistribute totalValueAtT based on target weights
                                currentHoldings = currentHoldings.map(holding => {
                                    const targetVal = totalValueAtT * (holding.weight / 100);
                                    const assetVal = assetValuesAtT.find(a => a.ticker === holding.ticker);
                                    if (assetVal) {
                                        return {
                                            ...holding,
                                            units: targetVal / assetVal.price
                                        };
                                    }
                                    return holding;
                                });
                            }
                        }

                        lastProcessedMonthKey = currentMonthKey;
                    }
                }
            }

            // Final Results calculation
            const multiplier = currency === "KRW" ? exchangeRate : 1;
            const finalValueUSD = portfolioChartData[portfolioChartData.length - 1].value / multiplier;
            const finalValue = Math.round(finalValueUSD * multiplier);
            const initialInvestment = Math.round(amount);

            // Individual Asset Performance
            const assetResults = assetInvestments.map(inv => {
                const tickerData = responses.find(r => r.ticker === inv.ticker);
                if (!tickerData) return null;

                // Find effective start/end prices for the aligned period
                // We need to use the aligned data we filtered earlier
                const aligned = truncatedData.find(d => d.ticker === inv.ticker);
                if (!aligned || aligned.data.length === 0) return null;

                const startPrice = aligned.data[0].price;
                const endPrice = aligned.data[aligned.data.length - 1].price;
                const ratio = endPrice / startPrice;
                const finalVal = inv.initialAmount * ratio * multiplier;

                return {
                    ticker: inv.ticker,
                    initialValue: Math.round(inv.initialAmount * multiplier),
                    finalValue: Math.round(finalVal),
                    returnRate: (ratio - 1) * 100
                };
            }).filter(Boolean) as PortfolioResult['assets'];


            // Calculate CAGR
            const yearsPassed = minLength / 12;
            const cagr = yearsPassed > 0
                ? (Math.pow(finalValue / initialInvestment, 1 / yearsPassed) - 1) * 100
                : 0;

            // MDD
            let peak = portfolioChartData[0].value;
            let peakDate = portfolioChartData[0].name;
            let maxDrawdown = 0;
            let mddStart = portfolioChartData[0].name;
            let mddEnd = portfolioChartData[0].name;
            let positiveMonths = 0;

            // Yearly tracking
            const yearlyReturns: { year: number; return: number }[] = [];
            let currentYear = new Date(portfolioChartData[0].name).getFullYear();
            let startOfYearVal = portfolioChartData[0].value;

            for (let i = 0; i < portfolioChartData.length; i++) {
                const point = portfolioChartData[i];
                const pointYear = new Date(point.name).getFullYear();

                // MDD
                if (point.value > peak) {
                    peak = point.value;
                    peakDate = point.name;
                }
                const drawdown = (peak - point.value) / peak;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                    mddStart = peakDate;
                    mddEnd = point.name;
                }

                // Win Rate (Monthly)
                if (i > 0) {
                    if (point.value > portfolioChartData[i - 1].value) {
                        positiveMonths++;
                    }
                }

                // Yearly Return Calculation
                if (pointYear !== currentYear) {
                    // Year changed, calculate return for the completed year
                    // Use previous point as end of year value
                    const endOfYearVal = portfolioChartData[i - 1].value;
                    const yearReturn = ((endOfYearVal - startOfYearVal) / startOfYearVal) * 100;
                    yearlyReturns.push({ year: currentYear, return: yearReturn });

                    // Reset for new year
                    currentYear = pointYear;
                    startOfYearVal = endOfYearVal; // Start of new year is end of last year effectively
                }

                // Handle last point for the final partial year
                if (i === portfolioChartData.length - 1) {
                    const yearReturn = ((point.value - startOfYearVal) / startOfYearVal) * 100;
                    yearlyReturns.push({ year: currentYear, return: yearReturn });
                }
            }

            const mdd = maxDrawdown * 100;
            const winRate = portfolioChartData.length > 1 ? (positiveMonths / (portfolioChartData.length - 1)) * 100 : 0;

            const sortedByReturn = [...yearlyReturns].sort((a, b) => b.return - a.return);
            const bestYearObj = sortedByReturn.length > 0 ? sortedByReturn[0] : { year: 0, return: 0 };
            const worstYearObj = sortedByReturn.length > 0 ? sortedByReturn[sortedByReturn.length - 1] : { year: 0, return: 0 };

            setResult({
                period,
                initialInvestment,
                finalValue,
                profit: finalValue - initialInvestment,
                returnRate: ((finalValue - initialInvestment) / initialInvestment) * 100,
                cagr,
                mdd,
                bestYear: bestYearObj,
                worstYear: worstYearObj,
                winRate,
                chartData: portfolioChartData,
                actualPeriod: commonStartDateStr,
                mddPeriod: {
                    start: mddStart,
                    end: mddEnd
                },
                rebalanceCount,
                rebalancePeriodUsed: rebalancePeriod,
                assets: currentHoldings.map(holding => {
                    const tickerData = truncatedData.find(d => d.ticker === holding.ticker);
                    const lastPrice = tickerData!.data[tickerData!.data.length - 1].price;
                    const initialAssetInv = assetInvestments.find(a => a.ticker === holding.ticker)!;
                    const finalAssetVal = holding.units * lastPrice * multiplier;
                    const initialAssetVal = initialAssetInv.initialAmount * multiplier;

                    const assetProfit = Math.round(finalAssetVal - initialAssetVal);
                    const totalPortfolioProfit = finalValue - initialInvestment;
                    const contributionShare = totalPortfolioProfit !== 0
                        ? (assetProfit / Math.abs(totalPortfolioProfit)) * 100
                        : 0;

                    return {
                        ticker: holding.ticker,
                        initialValue: Math.round(initialAssetVal),
                        finalValue: Math.round(finalAssetVal),
                        returnRate: ((finalAssetVal / initialAssetVal) - 1) * 100,
                        profit: assetProfit,
                        contributionShare: contributionShare
                    };
                })
            });

            setIsCalculated(true);

        } catch (err) {
            console.error("Calculation failed", err);
            setError("계산 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // Reset results when inputs change to avoid confusion
    useEffect(() => {
        setIsCalculated(false);
        setResult(null);
    }, [amount, period, rebalancePeriod, assets]);

    // Period Label Map
    const rebalanceLabelMap: Record<string, string> = {
        "monthly": "월간",
        "semi-annually": "반기",
        "annually": "연간",
        "none": "리밸런싱 없음"
    };

    return (
        <div className="space-y-8">
            {/* Input Card: Premium Glassmorphism - Enhanced by Stitch */}
            <Card className="relative overflow-hidden border border-white/15 bg-white/5 dark:bg-black/30 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5">
                {/* Top Gradient Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-60" />

                <CardHeader className="pb-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20">
                            <PieChart className="w-4 h-4 text-sky-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground tracking-tight">포트폴리오 백테스팅</h3>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground/70 tracking-wide leading-relaxed">
                        그때 그 포트폴리오로 투자했었더라면 지금은<br className="sm:hidden" /> 어떻게 되었을지 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-7 pt-6">

                    {/* Presets Section */}
                    <div className="space-y-3">
                        <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-500/70" />
                            추천 포트폴리오 프리셋
                        </label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 justify-between bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-sky-500/40 transition-all duration-300 rounded-xl px-4"
                                >
                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const preset = PRESETS.find(p => p.name === selectedPreset);
                                            if (preset) return <span className="text-xl">{preset.icon}</span>;
                                            if (selectedPreset === "나만의 조합 만들기") return <Plus className="w-4 h-4 text-sky-500" />;
                                            return <Sparkles className="w-4 h-4 text-yellow-500" />;
                                        })()}
                                        <span className="font-semibold text-foreground">{selectedPreset}</span>
                                    </div>
                                    <ChevronDown className="w-4 h-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 bg-black/90 border-white/10 backdrop-blur-xl rounded-xl p-1 shadow-2xl overflow-hidden" align="start">
                                {PRESETS.map((preset) => (
                                    <DropdownMenuItem
                                        key={preset.id}
                                        onClick={() => applyPreset(preset.id)}
                                        className="flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-white/10 transition-colors rounded-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{preset.icon}</span>
                                            <span className="font-bold text-sm text-foreground">{preset.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground ml-7 line-clamp-1">{preset.description}</span>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem
                                    onClick={() => {
                                        setAssets([{ ticker: "", weight: 100 }]);
                                        setSelectedPreset("나만의 조합 만들기");
                                    }}
                                    className="flex items-center gap-2 p-3 cursor-pointer focus:bg-white/10 transition-colors rounded-lg text-sky-500 font-semibold"
                                >
                                    <Plus className="w-4 h-4 ml-1 text-sky-500" />
                                    <span>직접 구성하기 (초기화)</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* Assets Input Section */}
                    <div className="space-y-4 bg-white/[0.02] dark:bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06]">
                        <div className="flex justify-between items-center">
                            <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                구성 종목 및 비중 설정
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={normalizeWeights}
                                className="text-xs h-7 px-3 text-sky-500 hover:text-white hover:bg-sky-500 rounded-lg transition-colors"
                            >
                                비중 100% 자동 맞춤
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {assets.map((asset, index) => (
                                <div key={index} className="flex gap-3 items-center group">
                                    <div className="flex-1">
                                        <StockSearchInput
                                            value={asset.ticker}
                                            onChange={(ticker, name) => handleAssetChange(index, "ticker", ticker)}
                                            placeholder="티커 검색 (예: SPY)"
                                        />
                                    </div>
                                    <div className="w-28 relative">
                                        <Input
                                            type="number"
                                            value={asset.weight}
                                            onChange={(e) => handleAssetChange(index, "weight", Number(e.target.value))}
                                            className="pr-8 text-right font-medium bg-white/40 dark:bg-black/20 border-white/10 focus:border-sky-500/50 transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">%</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveAsset(index)}
                                        className="h-10 w-10 text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                        disabled={assets.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                onClick={handleAddAsset}
                                className="w-full border-dashed border-white/20 hover:bg-white/5 hover:border-sky-500/30 hover:text-sky-500 text-muted-foreground transition-all h-10 rounded-xl"
                            >
                                <Plus className="h-4 w-4 mr-2" /> 새 종목 추가하기
                            </Button>
                        </div>

                        {/* Total Weight Indicator */}
                        <div className="flex justify-end items-center gap-2 pt-2 border-t border-white/[0.04]">
                            <span className="text-xs text-muted-foreground">총 비중:</span>
                            <span className={cn(
                                "text-sm font-bold tabular-nums",
                                Math.abs(assets.reduce((s, a) => s + a.weight, 0) - 100) < 0.1 ? "text-green-500" : "text-amber-500"
                            )}>
                                {assets.reduce((s, a) => s + a.weight, 0).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* Amount & Period & Rebalance */}
                    <div className="space-y-7">
                        {/* Amount Selection */}
                        <div className="space-y-3">
                            <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-sky-500/70" />
                                기준 투자 금액 ({currency === "KRW" ? "원" : "$"})
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {(currency === "KRW"
                                    ? [1000000, 5000000, 10000000, 50000000]
                                    : [1000, 5000, 10000, 50000]
                                ).map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setAmount(amt)}
                                        className={cn(
                                            "relative h-11 rounded-xl text-sm font-semibold transition-all duration-300",
                                            amount === amt
                                                ? "bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                                                : "bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground border border-white/[0.06] hover:border-white/15"
                                        )}
                                    >
                                        {currency === "KRW"
                                            ? amt >= 100000000 ? `${amt / 100000000}억` : `${(amt / 10000).toLocaleString()}만`
                                            : `$${amt.toLocaleString()}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section Divider */}
                        <div className="border-t border-white/[0.06]" />

                        {/* Period Selection */}
                        <div className="space-y-3">
                            <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-sky-500/70" />
                                투자 시점 (과거)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["1Y", "3Y", "5Y", "10Y", "20Y", "30Y"] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={cn(
                                            "h-11 rounded-xl text-sm font-semibold transition-all duration-300",
                                            period === p
                                                ? "bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                                                : "bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground border border-white/[0.06] hover:border-white/15"
                                        )}
                                    >
                                        {p.replace("Y", "년 전")}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section Divider */}
                        <div className="border-t border-white/[0.06]" />

                        {/* Rebalancing Frequency Selection */}
                        <div className="space-y-3">
                            <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                <RefreshCw className="w-3.5 h-3.5 text-sky-500/70" />
                                리밸런싱 주기
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { label: "1개월", value: "monthly" },
                                    { label: "6개월", value: "semi-annually" },
                                    { label: "1년", value: "annually" },
                                    { label: "하지 않음", value: "none" }
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setRebalancePeriod(opt.value as any)}
                                        className={cn(
                                            "h-11 rounded-xl text-sm font-semibold transition-all duration-300",
                                            rebalancePeriod === opt.value
                                                ? "bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                                                : "bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground border border-white/[0.06] hover:border-white/15"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CTA Button with Glow */}
                    <div className="pt-2">
                        <Button
                            onClick={onCalculate}
                            disabled={isLoading}
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-[0_4px_24px_rgba(14,165,233,0.3)] hover:shadow-[0_4px_32px_rgba(14,165,233,0.4)] rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    과거로 시간 여행 중...
                                </>
                            ) : (
                                "결과 확인하기"
                            )}
                        </Button>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center animate-in fade-in slide-in-from-top-2">
                            <p className="text-red-500 text-sm font-medium">
                                {error}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results Section */}
            {isCalculated && result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Card className="overflow-hidden border border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-purple-500/5 pointer-events-none" />
                        <CardContent className="pt-8 pb-8 px-6 relative z-10">
                            <div className="text-center space-y-2 mb-10">
                                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {result.actualPeriod?.split('-')[0]}년부터 현재까지
                                    </span>
                                </div>
                                <h2 className="text-lg font-medium text-muted-foreground/80">최종 평가 금액</h2>
                                <div className="flex items-baseline justify-center gap-1 w-full overflow-hidden">
                                    {(() => {
                                        const formattedFinalValue = formatCurrency(result.finalValue);
                                        const len = formattedFinalValue.length;
                                        // Adjust breakpoints to be safer. Count includes commas and currency symbol.
                                        // e.g., "66,870,825원" is 11 chars.
                                        let fontSizeClass = "text-4xl sm:text-6xl"; // Default for short (< 10 chars)

                                        if (len > 20) fontSizeClass = "text-xl sm:text-3xl";
                                        else if (len > 14) fontSizeClass = "text-2xl sm:text-4xl";
                                        else if (len > 9) fontSizeClass = "text-3xl sm:text-5xl";

                                        return (
                                            <h1 className={cn(
                                                "font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 tracking-tight whitespace-nowrap px-1",
                                                fontSizeClass
                                            )}>
                                                {formattedFinalValue}
                                            </h1>
                                        );
                                    })()}
                                </div>
                                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 w-full max-w-3xl mx-auto">
                                    {/* 1. Total Profit */}
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2">
                                        <span className="opacity-70 text-xs font-semibold tracking-tight mb-1 text-muted-foreground">총 수익률</span>
                                        <span className={`text-sm sm:text-lg font-black flex items-center gap-1 ${result.profit >= 0 ? "text-red-500" : "text-blue-500"} whitespace-nowrap`}>
                                            {result.profit >= 0 ? "+" : ""}{(Math.trunc(result.returnRate * 10) / 10).toFixed(1)}%
                                        </span>
                                    </div>

                                    {/* 2. CAGR */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                                <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                                                    <span className="opacity-70 text-xs font-semibold tracking-tight text-muted-foreground">연평균 수익률</span>
                                                    <HelpCircle className="w-3 h-3 opacity-40" />
                                                </div>
                                                <span className={`text-sm sm:text-lg font-black whitespace-nowrap ${result.cagr >= 0 ? "text-red-500" : "text-blue-500"}`}>
                                                    {result.cagr >= 0 ? "+" : ""}{result.cagr.toFixed(1)}%
                                                </span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed">
                                            <p className="font-bold text-sky-400 mb-1">연평균 수익률 (CAGR)</p>
                                            기하급수적으로 자산이 매년 평균 몇 %씩 성장했는지를 보여주는 지표입니다. CAGR이라는 약어로 불리며, 복리 수익을 반영한 실질 성장률을 의미합니다.
                                        </PopoverContent>
                                    </Popover>

                                    {/* 3. MDD */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                                <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                                                    <span className="opacity-70 text-xs font-semibold tracking-tight text-muted-foreground">최대 낙폭(MDD)</span>
                                                    <HelpCircle className="w-3 h-3 opacity-40" />
                                                </div>
                                                <span className="text-sm sm:text-lg font-black text-blue-500 whitespace-nowrap">
                                                    -{result.mdd.toFixed(1)}%
                                                </span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed">
                                            <p className="font-bold text-red-400 mb-1">최대 낙폭 (MDD)</p>
                                            투자 기간 중 특정 고점에서 전 저점까지의 최대 하락폭을 의미합니다. 자산 가치가 가장 크게 깎였던 고통의 크기를 보여주는 대표적인 리스크 지표입니다.
                                            {result.mddPeriod && (
                                                <div className="mt-2 pt-2 border-t border-white/10 text-sky-400/80">
                                                    <p className="font-semibold text-[10px] uppercase opacity-70 mb-0.5">최대 낙폭 기간</p>
                                                    <p className="text-[11px] font-bold">
                                                        {result.mddPeriod.start.substring(0, 7)} ~ {result.mddPeriod.end.substring(0, 7)}
                                                        {(() => {
                                                            const s = new Date(result.mddPeriod.start);
                                                            const e = new Date(result.mddPeriod.end);
                                                            const m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
                                                            if (m > 0) return ` (${m}개월)`;
                                                            const d = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
                                                            return d > 0 ? ` (${d}일)` : "";
                                                        })()}
                                                    </p>
                                                </div>
                                            )}
                                        </PopoverContent>
                                    </Popover>

                                    {/* 4. Best Year */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                                <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                                                    <span className="opacity-70 text-xs font-semibold tracking-tight text-muted-foreground">최고의 해</span>
                                                    <HelpCircle className="w-3 h-3 opacity-40" />
                                                </div>
                                                <span className={`text-sm sm:text-lg font-black whitespace-nowrap ${result.bestYear.return >= 0 ? "text-red-500" : "text-blue-500"}`}>
                                                    {result.bestYear.return > 0 ? "+" : ""}{result.bestYear.return.toFixed(1)}%
                                                </span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed">
                                            <p className="font-bold text-sky-400 mb-1">최고의 해 ({result.bestYear.year}년)</p>
                                            백테스팅 기간 중 연간 수익률(1월~12월 기준)이 가장 높았던 해입니다. {result.bestYear.year}년에 가장 뛰어난 성과를 기록했습니다.
                                        </PopoverContent>
                                    </Popover>

                                    {/* 5. Worst Year */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                                <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                                                    <span className="opacity-70 text-xs font-semibold tracking-tight text-muted-foreground">최악의 해</span>
                                                    <HelpCircle className="w-3 h-3 opacity-40" />
                                                </div>
                                                <span className={`text-sm sm:text-lg font-black whitespace-nowrap ${result.worstYear.return >= 0 ? "text-red-500" : "text-blue-500"}`}>
                                                    {result.worstYear.return > 0 ? "+" : ""}{result.worstYear.return.toFixed(1)}%
                                                </span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed">
                                            <p className="font-bold text-red-400 mb-1">최악의 해 ({result.worstYear.year}년)</p>
                                            백테스팅 기간 중 연간 수익률(1월~12월 기준)이 가장 낮았던 해입니다. {result.worstYear.year}년에 가장 저조한 성과를 기록했습니다.
                                        </PopoverContent>
                                    </Popover>

                                    {/* 6. Win Rate */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                                <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                                                    <span className="opacity-70 text-xs font-semibold tracking-tight text-muted-foreground">월별 승률</span>
                                                    <HelpCircle className="w-3 h-3 opacity-40" />
                                                </div>
                                                <span className={`text-sm sm:text-lg font-black whitespace-nowrap ${result.winRate >= 50 ? "text-red-500" : "text-blue-500"}`}>
                                                    {result.winRate.toFixed(1)}%
                                                </span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed">
                                            <p className="font-bold text-sky-400 mb-1">월별 승률</p>
                                            전체 투자 기간 중 전월 대비 자산 가치가 상승하며 마감한 달의 비율입니다. 승률이 높을수록 하락하는 달보다 수익을 내는 달이 더 많았음을 의미하는 지표입니다.
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="h-[320px] w-full mb-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={result.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.06} />
                                        <XAxis
                                            dataKey="name"
                                            tickFormatter={(val) => val.split('-')[0]} // Show only Year
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            minTickGap={40}
                                            stroke="#888888"
                                        />
                                        <YAxis
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="#888888"
                                            tickFormatter={(value) => {
                                                if (currency === "KRW") {
                                                    if (value >= 100000000) return `${Math.round(value / 100000000).toLocaleString()}억`;
                                                    if (value >= 10000) return `${Math.round(value / 10000).toLocaleString()}만`;
                                                }
                                                return value.toLocaleString();
                                            }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                backdropFilter: 'blur(16px)',
                                                borderRadius: '16px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                                            }}
                                            itemStyle={{ color: '#fff', fontWeight: 600 }}
                                            labelStyle={{ color: '#aaa', marginBottom: '0.25rem', fontSize: '12px' }}
                                            formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "평가금액"]}
                                            labelFormatter={(label) => label}
                                            cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#0EA5E9"
                                            fill="url(#colorValue)"
                                            strokeWidth={3}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Individual Asset Performance Table */}
                            <div className="bg-white/5 dark:bg-black/20 rounded-3xl p-6 border border-white/5 backdrop-blur-md">
                                <h3 className="text-xs font-black text-muted-foreground/60 mb-6 uppercase tracking-[0.2em] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <PieChart className="w-4 h-4 text-sky-500" />
                                        종목별 기여도 분석
                                    </div>
                                    <span className="text-[10px] font-medium lowercase italic opacity-50">Contribution Details</span>
                                </h3>

                                <div className="space-y-4">
                                    {[...result.assets].sort((a, b) => b.finalValue - a.finalValue).map((asset, idx) => (
                                        <div
                                            key={asset.ticker}
                                            className="relative overflow-hidden p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-500/30 transition-all duration-300 group shadow-sm hover:shadow-sky-500/5"
                                        >
                                            <div className="relative z-10 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    {/* Custom Ticker Icon */}
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-transparent flex-shrink-0 flex items-center justify-center font-black text-foreground/90 text-[9px] border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                        {asset.ticker.slice(0, 2)}
                                                    </div>
                                                    <div className="space-y-0.5 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <p className="font-black text-sm text-foreground tracking-tight truncate">{asset.ticker}</p>
                                                            {asset.returnRate > result.returnRate && (
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <span className="cursor-help flex-shrink-0 text-[7px] font-black px-1 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-tighter shadow-sm hover:bg-green-500/20 transition-colors leading-none">
                                                                            Ace
                                                                        </span>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-48 text-[11px] font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed p-3">
                                                                        <p className="font-bold text-green-400 mb-1">Ace 종목</p>
                                                                        포트폴리오의 평균 수익률({result.returnRate.toFixed(1)}%)보다 높은 성과를 기록하여 전체 성장을 견인한 우수 종목입니다.
                                                                    </PopoverContent>
                                                                </Popover>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] font-bold text-muted-foreground/50 tracking-wide whitespace-nowrap">
                                                            {formatCompactNumber(asset.initialValue)}{currency === "KRW" ? " 원" : ""} 투자
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    <p className="font-black text-[13px] text-foreground tabular-nums tracking-tight whitespace-nowrap">
                                                        {formatCurrency(asset.finalValue)}
                                                    </p>
                                                    <div className="flex flex-col items-end gap-1 mt-1">
                                                        <span className={`text-[10px] font-bold tabular-nums whitespace-nowrap ${asset.profit >= 0 ? "text-red-500" : "text-blue-500"}`}>
                                                            {asset.profit >= 0 ? "+" : ""}{formatCompactNumber(asset.profit)}{currency === "KRW" ? " 원" : ""}
                                                        </span>
                                                        <span className={`flex-shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm ${asset.returnRate >= 0 ? "bg-red-500 text-white" : "bg-blue-500 text-white"}`}>
                                                            {asset.returnRate >= 0 ? "+" : ""}{asset.returnRate.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sharing & Download Actions */}

                </div>
            )}
        </div>
    );
}

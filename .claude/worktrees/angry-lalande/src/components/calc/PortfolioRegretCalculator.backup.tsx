"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, PieChart, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
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
    multiple: number;
    chartData: { name: string; value: number }[];
    actualPeriod?: string;
    rebalanceCount: number;
    rebalancePeriodUsed: string;
    assets: {
        ticker: string;
        initialValue: number;
        finalValue: number;
        returnRate: number;
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
        name: "60/40 포트폴리오",
        id: "60-40",
        description: "주식 60% : 채권 40%",
        assets: [
            { ticker: "SPY", weight: 60, name: "S&P 500" },
            { ticker: "AGG", weight: 40, name: "US Aggregate Bond" }
        ],
        icon: "⚖️"
    },
    {
        name: "영구 포트폴리오",
        id: "permanent",
        description: "주식/채권/금/현금 4등분",
        assets: [
            { ticker: "SPY", weight: 25, name: "S&P 500" },
            { ticker: "TLT", weight: 25, name: "20+ Year Treasury Bond" },
            { ticker: "GLD", weight: 25, name: "Gold" },
            { ticker: "SHY", weight: 25, name: "1-3 Year Treasury Bond" }
        ],
        icon: "🏛️"
    },
    {
        name: "올웨더 포트폴리오",
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
    const { currency, exchangeRate, formatCurrency } = useCurrency();
    const { user } = useAuth();
    const { items, fetchPortfolio } = usePortfolioStore();

    const [assets, setAssets] = useState<PortfolioAsset[]>([{ ticker: "", weight: 100 }]);
    const [amount, setAmount] = useState<number>(currency === "KRW" ? 10000000 : 10000);
    const [period, setPeriod] = useState<"1Y" | "3Y" | "5Y" | "10Y" | "20Y" | "30Y">("10Y");
    const [rebalancePeriod, setRebalancePeriod] = useState<"monthly" | "semi-annually" | "annually" | "none">("annually");
    const [result, setResult] = useState<PortfolioResult | null>(null);
    const [isCalculated, setIsCalculated] = useState(false);
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


            setResult({
                period,
                initialInvestment,
                finalValue,
                profit: finalValue - initialInvestment,
                returnRate: ((finalValue - initialInvestment) / initialInvestment) * 100,
                multiple: finalValue / initialInvestment,
                chartData: portfolioChartData,
                actualPeriod: commonStartDateStr,
                rebalanceCount,
                rebalancePeriodUsed: rebalancePeriod,
                assets: currentHoldings.map(holding => {
                    const tickerData = truncatedData.find(d => d.ticker === holding.ticker);
                    const lastPrice = tickerData!.data[tickerData!.data.length - 1].price;
                    const initialAssetInv = assetInvestments.find(a => a.ticker === holding.ticker)!;
                    const finalAssetVal = holding.units * lastPrice * multiplier;
                    const initialAssetVal = initialAssetInv.initialAmount * multiplier;

                    return {
                        ticker: holding.ticker,
                        initialValue: Math.round(initialAssetVal),
                        finalValue: Math.round(finalAssetVal),
                        returnRate: ((finalAssetVal / initialAssetVal) - 1) * 100
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
            {/* Input Card: Premium Glassmorphism */}
            <Card className="overflow-hidden border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5">
                <CardHeader className="pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                        <PieChart className="w-5 h-5 text-sky-500" />
                        <h3 className="text-lg font-bold text-foreground tracking-tight">포트폴리오 백테스팅</h3>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground/80 tracking-wide">
                        그때 그 포트폴리오로 투자했었더라면 지금은 어떻게 되었을지 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-9">

                    {/* Presets Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-yellow-500" />
                            추천 포트폴리오 프리셋
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => applyPreset(preset.id)}
                                    className="relative flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-500/50 transition-all gap-3 group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/0 to-sky-500/0 group-hover:from-sky-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
                                    <span className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{preset.icon}</span>
                                    <div className="text-center space-y-1 z-10">
                                        <span className="text-xs font-bold block text-foreground/90 group-hover:text-foreground">{preset.name}</span>
                                        <span className="text-[10px] text-muted-foreground leading-tight block opacity-0 h-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                            {preset.description}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assets Input Section */}
                    <div className="space-y-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
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
                        <div className="flex justify-end items-center gap-2 pt-2 border-t border-white/5">
                            <span className="text-xs text-muted-foreground">총 비중:</span>
                            <span className={cn(
                                "text-sm font-bold tabular-nums",
                                Math.abs(assets.reduce((s, a) => s + a.weight, 0) - 100) < 0.1 ? "text-green-500" : "text-amber-500"
                            )}>
                                {assets.reduce((s, a) => s + a.weight, 0).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Amount & Period */}
                    {/* Amount & Period */}
                    <div className="space-y-6">
                        {/* Amount Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
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
                                            "relative h-10 rounded-lg text-sm font-medium transition-all duration-200",
                                            amount === amt
                                                ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                                : "bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent hover:border-white/10"
                                        )}
                                    >
                                        {currency === "KRW"
                                            ? amt >= 100000000 ? `${amt / 100000000}억` : `${(amt / 10000).toLocaleString()}만`
                                            : `$${amt.toLocaleString()}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Period Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                                투자 시점 (과거)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["1Y", "3Y", "5Y", "10Y", "20Y", "30Y"] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={cn(
                                            "h-10 rounded-lg text-sm font-medium transition-all duration-200",
                                            period === p
                                                ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                                : "bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {p.replace("Y", "년 전")}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rebalancing Frequency Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
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
                                            "h-10 rounded-lg text-sm font-medium transition-all duration-200",
                                            rebalancePeriod === opt.value
                                                ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                                : "bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={onCalculate}
                        disabled={isLoading}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:via-blue-400 hover:to-indigo-500 shadow-xl shadow-blue-500/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
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
                                <div className="flex items-center justify-center gap-3 mt-4">
                                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 ${result.profit >= 0 ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"}`}>
                                        {result.profit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                        {result.profit >= 0 ? "+" : ""}{(Math.trunc(result.returnRate * 10) / 10).toFixed(1)}%
                                    </div>
                                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-sm font-bold backdrop-blur-sm">
                                        {(Math.trunc(result.multiple * 100) / 100).toFixed(2)}배 수익
                                    </div>
                                    {result.rebalancePeriodUsed !== "none" && (
                                        <div className="px-4 py-1.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-bold backdrop-blur-sm flex flex-col items-center justify-center leading-tight min-w-[100px]">
                                            <span className="opacity-70 text-[10px] tracking-tight mb-0.5">
                                                {rebalanceLabelMap[result.rebalancePeriodUsed]} 리밸런싱
                                            </span>
                                            <span className="text-sm font-black">{result.rebalanceCount}회</span>
                                        </div>
                                    )}
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
                            <div className="bg-white/5 dark:bg-black/20 rounded-2xl p-5 border border-white/5">
                                <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <PieChart className="w-3.5 h-3.5" />
                                    종목별 기여도 분석
                                </h3>
                                <div className="space-y-3">
                                    {result.assets.map((asset, idx) => (
                                        <div key={asset.ticker} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 flex items-center justify-center font-bold text-sky-500 text-xs border border-sky-500/10 shadow-sm group-hover:scale-105 transition-transform">
                                                    {asset.ticker}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-foreground">{asset.ticker}</p>
                                                    <p className="text-xs text-muted-foreground">{formatCurrency(asset.initialValue)} 투자</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-foreground">{formatCurrency(asset.finalValue)}</p>
                                                <div className={`text-xs font-bold flex items-center justify-end gap-0.5 ${asset.returnRate >= 0 ? "text-red-500" : "text-blue-500"}`}>
                                                    {asset.returnRate >= 0 ? "+" : ""}{asset.returnRate.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

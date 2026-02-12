"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, PieChart } from "lucide-react";
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
    const [amount, setAmount] = useState<number>(10000000);
    const [period, setPeriod] = useState<"1Y" | "3Y" | "5Y" | "10Y" | "20Y" | "30Y">("10Y");
    const [result, setResult] = useState<PortfolioResult | null>(null);
    const [isCalculated, setIsCalculated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

            // For the first point (start), value should be investment amount
            if (truncatedData[0].data.length > 0) {
                // Iterate through time points
                for (let i = 0; i < minLength; i++) {
                    let totalPortfolioValueAtT = 0;
                    const dateLabel = truncatedData[0].data[i].name;

                    for (let j = 0; j < truncatedData.length; j++) {
                        const tickerData = truncatedData[j];
                        const assetInv = assetInvestments.find(a => a.ticker === tickerData.ticker);

                        if (assetInv) {
                            // Calculate performance ratio relative to start of this period
                            const startPrice = tickerData.data[0].price;
                            const currentPrice = tickerData.data[i].price;
                            const performance = currentPrice / startPrice;

                            const valueAtT = assetInv.initialAmount * performance;
                            totalPortfolioValueAtT += valueAtT;
                        }
                    }

                    // Convert to display currency
                    const multiplier = currency === "KRW" ? exchangeRate : 1;
                    portfolioChartData.push({
                        name: dateLabel,
                        value: Math.round(totalPortfolioValueAtT * multiplier)
                    });
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
                assets: assetResults
            });

            setIsCalculated(true);

        } catch (err) {
            console.error("Calculation failed", err);
            setError("계산 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <Card className="overflow-hidden border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5">
                <CardHeader className="pb-2">
                    <p className="text-sm font-medium text-muted-foreground/80 tracking-wide">
                        그때 그 포트폴리오로 투자했었더라면 지금은 어떻게 되었을지 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-9">

                    {/* Presets */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                            포트폴리오 프리셋
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => applyPreset(preset.id)}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-500/30 transition-all gap-2 group"
                                >
                                    <span className="text-2xl group-hover:scale-110 transition-transform">{preset.icon}</span>
                                    <span className="text-xs font-medium text-center">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assets Input */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                                구성 종목 및 비중
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={normalizeWeights}
                                className="text-xs h-6 text-sky-500 hover:text-sky-400"
                            >
                                비중 100% 맞추기
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {assets.map((asset, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <StockSearchInput
                                            value={asset.ticker}
                                            onChange={(ticker, name) => handleAssetChange(index, "ticker", ticker)}
                                            placeholder="티커 (예: AAPL)"
                                        />
                                    </div>
                                    <div className="w-24 relative">
                                        <Input
                                            type="number"
                                            value={asset.weight}
                                            onChange={(e) => handleAssetChange(index, "weight", Number(e.target.value))}
                                            className="pr-6 text-right"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveAsset(index)}
                                        className="h-10 w-10 text-muted-foreground hover:text-red-500"
                                        disabled={assets.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                onClick={handleAddAsset}
                                className="w-full border-dashed border-white/20 hover:bg-white/5"
                            >
                                <Plus className="h-4 w-4 mr-2" /> 종목 추가
                            </Button>
                        </div>
                    </div>

                    {/* Amount & Period (Common UI) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                                총 투자 금액
                            </label>
                            <Input
                                type="text"
                                value={amount.toLocaleString()}
                                onChange={(e) => setAmount(Number(e.target.value.replace(/[^0-9]/g, "")))}
                                className="h-12 text-lg font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                                투자 기간
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["1Y", "3Y", "5Y", "10Y", "20Y", "30Y"] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={cn(
                                            "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                            period === p
                                                ? "bg-sky-500/20 text-sky-500 border border-sky-500/50"
                                                : "bg-white/5 hover:bg-white/10"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={onCalculate}
                        disabled={isLoading}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-xl shadow-blue-500/10 rounded-xl transition-all"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                시뮬레이션 중...
                            </>
                        ) : (
                            "결과 확인하기"
                        )}
                    </Button>

                    {error && (
                        <p className="text-center text-red-500 text-sm font-medium animate-pulse">
                            {error}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Results Section */}
            {isCalculated && result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Card className="border-primary/20 bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-lg">
                        <CardContent className="pt-8 pb-8 px-6">
                            <div className="text-center space-y-2 mb-8">
                                <p className="text-sm font-medium text-muted-foreground">최종 평가 금액 ({result.actualPeriod?.split('-')[0]}년부터)</p>
                                <h2 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">
                                    {formatCurrency(result.finalValue)}
                                </h2>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.profit >= 0 ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`}>
                                        {result.profit >= 0 ? "+" : ""}{result.returnRate.toFixed(2)}%
                                    </span>
                                    <span className="text-muted-foreground text-sm font-medium">
                                        {result.multiple.toFixed(2)}배
                                    </span>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={result.chartData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis
                                            dataKey="name"
                                            tickFormatter={(val) => val.split('-')[0]} // Show only Year
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => {
                                                if (currency === "KRW") {
                                                    if (value >= 100000000) return `${Math.round(value / 100000000).toLocaleString()}억`;
                                                    if (value >= 10000) return `${Math.round(value / 10000).toLocaleString()}만`;
                                                }
                                                return value.toLocaleString();
                                            }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: 'none' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "평가금액"]}
                                            labelFormatter={(label) => label}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#0EA5E9"
                                            fill="url(#colorValue)"
                                            strokeWidth={3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Individual Asset Performance Table */}
                            <div className="mt-8">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">세부 종목 성과</h3>
                                <div className="space-y-3">
                                    {result.assets.map((asset) => (
                                        <div key={asset.ticker} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center font-bold text-sky-500 text-xs">
                                                    {asset.ticker}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{asset.ticker}</p>
                                                    <p className="text-xs text-muted-foreground">{formatCurrency(asset.initialValue)} 투자</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm">{formatCurrency(asset.finalValue)}</p>
                                                <p className={`text-xs font-bold ${asset.returnRate >= 0 ? "text-red-500" : "text-blue-500"}`}>
                                                    {asset.returnRate >= 0 ? "+" : ""}{asset.returnRate.toFixed(2)}%
                                                </p>
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

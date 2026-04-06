"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, HelpCircle, Share2, TrendingUp, Search, DollarSign, CalendarDays, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { StockSearchInput } from "@/components/ui/StockSearchInput";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { trackMetaEvent } from "@/lib/analytics";
import { AdSlot } from "@/components/insights/AdSlot";

interface RegretResult {
    ticker: string;
    name: string;
    initialInvestment: number;
    originalAmount: number;
    period: string;
    pastPrice: number;
    currentPrice: number;
    currentValue: number;
    profit: number;
    returnRate: number;
    cagr: number;
    mdd: number;
    quantity: number;
    avgPrice: number;
    dropFromAth: number;
    chartData: { name: string; value: number; stockPrice: number }[];
    investmentType: "LUMP_SUM" | "DCA";
    actualPeriod?: string;
    quoteType?: string;
    isEtf?: boolean;
    mddPeriod?: {
        start: string;
        end: string;
    };
    pastExchangeRate?: number;
    currentExchangeRate?: number;
    isKrwBased?: boolean;
}

export function RegretCalculator() {
    const { currency, exchangeRate, formatCurrency, formatCompactNumber } = useCurrency();
    const [ticker, setTicker] = useState("");
    const [stockName, setStockName] = useState("");
    const [amount, setAmount] = useState<number>(1000000);
    const [period, setPeriod] = useState<string>("10Y");
    const [investmentType, setInvestmentType] = useState<"LUMP_SUM" | "DCA">("LUMP_SUM");
    const [rawData, setRawData] = useState<any>(null);
    const [result, setResult] = useState<RegretResult | null>(null);
    const [isCalculated, setIsCalculated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHighlighting, setIsHighlighting] = useState(false);
    const resultRef = useRef<HTMLDivElement>(null);

    const searchParams = useSearchParams();
    const [hasInitializedParams, setHasInitializedParams] = useState(false);
    const [shouldAutoCalculate, setShouldAutoCalculate] = useState(false);
    const prevUrlParams = useRef({ ticker: "", amount: 0, period: "" });

    const handleShare = useCallback(async () => {
        if (!result) return;

        const formattedInitial = currency === "KRW"
            ? `${formatCompactNumber(result.investmentType === "DCA" ? result.originalAmount : result.initialInvestment)}원`
            : `$${formatCompactNumber(result.investmentType === "DCA" ? result.originalAmount : result.initialInvestment)}`;

        let valueStr = currency === "KRW" 
            ? `약 ${formatCompactNumber(result.currentValue)}원`
            : `약 $${formatCompactNumber(result.currentValue)}`;

        const timeStr = result.period.replace("Y", "년 전");
        const cleanTicker = result.ticker.replace(".KS", "");

        let shareText = "";
        const formattedReturnRate = result.returnRate.toLocaleString(undefined, { maximumFractionDigits: 0 });
        const actionText = result.investmentType === "DCA" ? `매월 꾸준히 ${formattedInitial}씩 모았으면` : `그때 ${formattedInitial} 투자했으면`;

        if (result.returnRate >= 0) {
            shareText = `${timeStr}에 내가 ${result.name}(${cleanTicker}) 사자고 했제~? ${actionText} 지금 ${valueStr}에 수익률이 ${formattedReturnRate}%🔥🔥🔥`;
        } else {
            shareText = `${timeStr}에 내가 ${result.name}(${cleanTicker}) 사지 말자고 했제~? ${actionText} 지금 ${valueStr}에 수익률이 ${formattedReturnRate}%... 😢😢😢`;
        }

        shareText += `\n\n지금 했제 계산기에서 다른 종목들도 확인해보세요!\n\n`;

        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set("ticker", result.ticker);
        shareUrl.searchParams.set("amount", amount.toString());
        shareUrl.searchParams.set("period", period);
        if (result.name) shareUrl.searchParams.set("name", result.name);

        const urlString = shareUrl.toString();

        if (navigator.share) {
            try {
                await navigator.share({
                    text: shareText,
                    url: urlString,
                });
            } catch (err) {
                console.log('Share cancelled or failed', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText + "\n" + urlString);
                alert('결과가 클립보드에 복사되었습니다! 친구에게 공유해보세요.');
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    }, [result, amount, period]);

    // State to track if the current amount was set by URL or manual interaction
    const [isAmountManuallySet, setIsAmountManuallySet] = useState(false);

    // Update amount from URL
    useEffect(() => {
        if (!searchParams) return;

        const pTicker = searchParams.get('ticker');
        const pAmount = searchParams.get('amount');
        const pPeriod = searchParams.get('period');
        const pName = searchParams.get('name');

        if (pTicker) {
            const currentParams = {
                ticker: pTicker,
                amount: pAmount ? Number(pAmount) : 0,
                period: pPeriod || ""
            };

            // If the parameters haven't actually changed since the last time we processed them,
            // return early to prevent React 18 StrictMode duplicate execution from hiding results.
            if (
                prevUrlParams.current.ticker === currentParams.ticker &&
                prevUrlParams.current.amount === currentParams.amount &&
                prevUrlParams.current.period === currentParams.period
            ) {
                return;
            }

            prevUrlParams.current = currentParams;

            setTicker(pTicker);
            if (pName) setStockName(pName);
            if (pAmount) {
                const numAmount = Number(pAmount);
                if (!isNaN(numAmount)) {
                    setAmount(numAmount);
                    setIsAmountManuallySet(true); // Persist this!
                }
            }
            if (pPeriod) setPeriod(pPeriod as any);
            setShouldAutoCalculate(true);
        }
        setHasInitializedParams(true);
    }, [searchParams]);

    // Update default amount when currency changes - ONLY if not already set by URL/Manual
    useEffect(() => {
        if (!hasInitializedParams) return;

        // If we are in the middle of auto-calculating from URL, or if it's already manually set, don't overwrite
        if (isAmountManuallySet || shouldAutoCalculate) return;

        if (currency === "KRW") {
            setAmount(1000000);
        } else {
            setAmount(1000);
        }
        setIsCalculated(false);
        setResult(null);
    }, [currency, hasInitializedParams, isAmountManuallySet, shouldAutoCalculate]);

    // Auto calculate trigger
    useEffect(() => {
        if (shouldAutoCalculate && ticker) {
            setShouldAutoCalculate(false);
            onCalculate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldAutoCalculate, ticker]);

    // Auto scroll to result
    useEffect(() => {
        if (isCalculated && resultRef.current && hasInitializedParams && !isLoading) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, [isCalculated, hasInitializedParams, isLoading]);

    const handleStockSelect = (selectedTicker: string, name?: string) => {
        // Automatically append .KS for numeric Korean tickers if they are missing it
        const finalTicker = /^\d{6}$/.test(selectedTicker) ? `${selectedTicker}.KS` : selectedTicker;
        setTicker(finalTicker);
        setStockName(name || selectedTicker);
        setIsCalculated(false);
        setResult(null);
    };

    const calculateCore = (data: any, type: "LUMP_SUM" | "DCA", amt: number, per: string): RegretResult => {
        const { pastPrice, currentPrice, pastExchangeRate, currentExchangeRate, chartData, name, actualStartDate } = data;
        const isStockKrw = data.currency === "KRW";
        const pastRate = pastExchangeRate || exchangeRate;
        const currRate = currentExchangeRate || exchangeRate;

        // Make mathematical inputs safe
        let accumulatedShares = 0;
        let accumulatedInvested = 0;
        let lastMonth = "";

        // Build chart data
        const investmentChartData = chartData.map((point: any) => {
            const pointRateMatch = point.exchangeRate || currRate;
            const pointRate = pointRateMatch > 0 ? pointRateMatch : 1;
            const safePrice = point.price > 0 ? point.price : 1;
            const currentMonth = point.name.substring(0, 7);

            if (type === "LUMP_SUM") {
                if (accumulatedInvested === 0) {
                    const safeAmount = isNaN(amt) || !isFinite(amt) ? 0 : Math.max(0, amt);
                    accumulatedInvested = safeAmount;
                    if (isStockKrw) {
                        accumulatedShares = currency === "KRW" ? safeAmount / safePrice : (safeAmount * pointRate) / safePrice;
                    } else {
                        accumulatedShares = currency === "KRW" ? (safeAmount / pointRate) / safePrice : safeAmount / safePrice;
                    }
                }
            } else {
                if (currentMonth !== lastMonth) {
                    lastMonth = currentMonth;
                    const safeAmount = isNaN(amt) || !isFinite(amt) ? 0 : Math.max(0, amt);
                    accumulatedInvested += safeAmount;
                    if (isStockKrw) {
                        accumulatedShares += currency === "KRW" ? safeAmount / safePrice : (safeAmount * pointRate) / safePrice;
                    } else {
                        accumulatedShares += currency === "KRW" ? (safeAmount / pointRate) / safePrice : safeAmount / safePrice;
                    }
                }
            }

            let valueOutput = 0;
            let stockPriceOutput = 0;
            if (isStockKrw) {
                if (currency === "KRW") {
                    valueOutput = accumulatedShares * point.price;
                    stockPriceOutput = point.price;
                } else {
                    valueOutput = (accumulatedShares * point.price) / pointRate;
                    stockPriceOutput = point.price / pointRate;
                }
            } else {
                const multiplier = currency === "KRW" ? pointRate : 1;
                valueOutput = accumulatedShares * point.price * multiplier;
                stockPriceOutput = point.price * multiplier;
            }

            return {
                name: point.name,
                value: Math.round(valueOutput),
                stockPrice: stockPriceOutput,
            };
        }).filter((p: any) => p.value > 0 && !isNaN(p.value) && isFinite(p.value) && isFinite(p.stockPrice));

        let shares = accumulatedShares;
        if (!isFinite(shares)) shares = 0;

        // Use the last point's value as current value
        let currentValueDisplay = investmentChartData.length > 0 ? investmentChartData[investmentChartData.length - 1].value : 0;
        if (!isFinite(currentValueDisplay)) currentValueDisplay = Number.MAX_SAFE_INTEGER;

        const profitDisplay = currentValueDisplay - accumulatedInvested;
        let returnRate = accumulatedInvested > 0 ? (profitDisplay / accumulatedInvested) * 100 : 0;
        if (!isFinite(returnRate) || isNaN(returnRate)) returnRate = 0;

        // Calculate MDD and Drop From ATH
        let peakValue = investmentChartData[0]?.value || 0;
        let peakDate = investmentChartData[0]?.name || "";
        let maxDrawdown = 0;
        let mddStart = peakDate;
        let mddEnd = peakDate;
        let athPrice = investmentChartData[0]?.stockPrice || 0;

        for (const point of investmentChartData) {
            if (point.value > peakValue) {
                peakValue = point.value;
                peakDate = point.name;
            }
            const drawdown = peakValue > 0 ? (peakValue - point.value) / peakValue : 0;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
                mddStart = peakDate;
                mddEnd = point.name;
            }
            if (point.stockPrice > athPrice) athPrice = point.stockPrice;
        }

        const mdd = maxDrawdown * 100;
        const lastStockPrice = investmentChartData.length > 0 ? investmentChartData[investmentChartData.length - 1].stockPrice : 0;
        const dropFromAth = athPrice > 0 ? ((lastStockPrice - athPrice) / athPrice) * 100 : 0;

        const firstDate = new Date(investmentChartData[0]?.name || actualStartDate || Date.now());
        const lastDate = new Date(investmentChartData[investmentChartData.length - 1]?.name || Date.now());
        const diffYears = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

        let cagr = 0;
        if (type === "LUMP_SUM") {
            cagr = diffYears > 0.1 && accumulatedInvested > 0 ? ((Math.pow(currentValueDisplay / accumulatedInvested, 1 / diffYears) - 1) * 100) : 0;
        } else {
            cagr = diffYears > 0.1 && accumulatedInvested > 0 ? ((Math.pow(currentValueDisplay / accumulatedInvested, 1 / (diffYears / 2)) - 1) * 100) : 0;
        }
        if (!isFinite(cagr) || isNaN(cagr)) cagr = 0;

        const pastRateOutput = pastExchangeRate || exchangeRate;
        const currRateOutput = currentExchangeRate || exchangeRate;

        // Avg price is Total Invested / Total Shares 
        let displayAvgPrice = shares > 0 ? accumulatedInvested / shares : 0;
        if (!isFinite(displayAvgPrice) || isNaN(displayAvgPrice)) displayAvgPrice = 0;

        let displayPastPrice: number;
        let displayCurrentPrice: number;
        if (isStockKrw) {
            if (currency === "KRW") {
                displayPastPrice = pastPrice;
                displayCurrentPrice = currentPrice;
                if (type === "LUMP_SUM") displayAvgPrice = pastPrice;
            } else {
                displayPastPrice = pastPrice / pastRateOutput;
                displayCurrentPrice = currentPrice / currRateOutput;
                if (type === "LUMP_SUM") displayAvgPrice = pastPrice / pastRateOutput;
            }
        } else {
            if (currency === "KRW") {
                displayPastPrice = pastPrice * pastRateOutput;
                displayCurrentPrice = currentPrice * currRateOutput;
                if (type === "LUMP_SUM") displayAvgPrice = pastPrice * pastRateOutput;
            } else {
                displayPastPrice = pastPrice;
                displayCurrentPrice = currentPrice;
                if (type === "LUMP_SUM") displayAvgPrice = pastPrice;
            }
        }

        return {
            investmentType: type,
            ticker: data.ticker,
            name: name || stockName,
            initialInvestment: accumulatedInvested, // Total invested
            originalAmount: amt,
            period: per,
            pastPrice: displayPastPrice,
            currentPrice: displayCurrentPrice,
            currentValue: currentValueDisplay,
            profit: profitDisplay,
            returnRate,
            cagr,
            mdd,
            quantity: shares,
            avgPrice: displayAvgPrice,
            dropFromAth,
            chartData: investmentChartData,
            actualPeriod: actualStartDate ? `${new Date(actualStartDate).getFullYear()}` : undefined,
            pastExchangeRate: (currency === "KRW" && !isStockKrw) ? pastRateOutput : undefined,
            currentExchangeRate: (currency === "KRW" && !isStockKrw) ? currRateOutput : undefined,
            mddPeriod: { start: mddStart, end: mddEnd },
            quoteType: data.quoteType,
            isEtf: data.isEtf || data.quoteType === "ETF" || ["SPY", "QQQ", "VOO", "IVV", "VTI", "DIA", "IWM", "VEA", "VWO", "XLF", "XLK", "XLE", "XLV", "XLP", "XLU", "XLI", "XLB", "XLY", "XLC", "XLRE"].includes(data.ticker.toUpperCase()),
            isKrwBased: isStockKrw
        };
    };

    const onCalculate = async () => {
        if (!ticker) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/stock/historical?ticker=${encodeURIComponent(ticker)}&period=${period}`);
            const data = await res.json();

            if (!res.ok || data.error) {
                setError(data.error || "Failed to fetch data");
                setIsLoading(false);
                return;
            }

            setRawData(data); // Cache the raw data
            const calcedResult = calculateCore(data, investmentType, amount, period);
            setResult(calcedResult);
            setIsCalculated(true);
            trackMetaEvent('Search', { 
                search_string: 'regret_calculator',
                content_name: ticker,
                content_category: period
            });
        } catch (err) {
            console.error("Calculate error:", err);
            setError("데이터를 가져오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchMode = () => {
        if (!rawData) return;
        const newType = investmentType === "LUMP_SUM" ? "DCA" : "LUMP_SUM";
        setInvestmentType(newType);

        // update amount automatically to a sensible default if switching
        let newAmt = amount;
        if (newType === "DCA") {
            newAmt = currency === "KRW" ? 100000 : 100;
        } else {
            newAmt = currency === "KRW" ? 1000000 : 1000;
        }
        setAmount(newAmt);

        const calcedResult = calculateCore(rawData, newType, newAmt, period);
        setResult(calcedResult);

        // Highlight effect
        setIsHighlighting(true);
        setTimeout(() => setIsHighlighting(false), 2000);

        // Scroll back up to see the new results
        if (resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="space-y-8">
            {/* Input Card: Premium Glassmorphism - Enhanced by Stitch */}
            <Card className="relative overflow-hidden border border-white/30 bg-white/10 dark:bg-black/40 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                {/* Top Gradient Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60" />

                <CardHeader className="pb-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground tracking-tight">개별 종목 백테스팅</h3>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground/70 tracking-wide leading-relaxed">
                        그때 그 종목에 투자했었더라면 지금은<br className="sm:hidden" /> 어떻게 되었을지 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-7 pt-6">

                    {/* 1. Ticker Input (Real Search) */}
                    <div className="space-y-3 relative">
                        {/* Background Glow for Depth */}
                        <div className="absolute -inset-4 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                        
                        <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5 relative z-10">
                            <Search className="w-3.5 h-3.5 text-emerald-500/70" />
                            투자 종목 (티커)
                        </label>
                        <div className="relative z-10">
                            <StockSearchInput
                                value={ticker.replace(".KS", "")}
                                onChange={handleStockSelect}
                                placeholder="종목 검색 (예: AAPL, samsung)..."
                            />
                        </div>
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* 2. Amount Selection & Small Toggle */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between ml-1 pr-1">
                            <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-500/70" />
                                {investmentType === "LUMP_SUM" ? "일시 투자금액" : "매월 투자금액"} ({currency === "KRW" ? "원" : "$"})
                            </label>

                            {/* Small Compact Toggle */}
                            <div className="flex bg-white/50 dark:bg-black/40 p-0.5 rounded-lg border border-white/10 dark:border-foreground/10 shadow-inner">
                                <button
                                    onClick={() => { setInvestmentType("LUMP_SUM"); setIsAmountManuallySet(false); if (currency === "KRW") setAmount(1000000); else setAmount(1000); }}
                                    className={cn("px-2.5 py-1 text-[11px] font-bold rounded-md transition-all", investmentType === "LUMP_SUM" ? "bg-white dark:bg-foreground/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10" : "text-muted-foreground hover:text-foreground")}
                                >
                                    거치식
                                </button>
                                <button
                                    onClick={() => { setInvestmentType("DCA"); setIsAmountManuallySet(false); if (currency === "KRW") setAmount(100000); else setAmount(100); }}
                                    className={cn("px-2.5 py-1 text-[11px] font-bold rounded-md transition-all", investmentType === "DCA" ? "bg-white dark:bg-foreground/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10" : "text-muted-foreground hover:text-foreground")}
                                >
                                    적립식
                                </button>
                            </div>
                        </div>
                        <div className={cn("grid gap-1.5 pt-2 pb-2", investmentType === "LUMP_SUM" ? "grid-cols-5" : "grid-cols-4")}>
                            {(currency === "KRW"
                                ? (investmentType === "LUMP_SUM" ? [100000, 500000, 1000000, 10000000, 50000000] : [100000, 300000, 500000, 1000000])
                                : (investmentType === "LUMP_SUM" ? [1000, 5000, 10000, 50000] : [100, 300, 500, 1000])
                            ).map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => {
                                        setAmount(amt);
                                        setIsAmountManuallySet(true);
                                    }}
                                    className={cn(
                                        "relative h-11 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center backdrop-blur-md",
                                        amount === amt
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/30 scale-[1.02] z-10"
                                            : "bg-gradient-to-br from-white/20 to-white/5 hover:from-white/30 hover:to-white/10 text-muted-foreground hover:text-foreground border border-white/20 hover:border-white/40 shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1"
                                    )}
                                >
                                    {currency === "KRW"
                                        ? amt >= 10000000
                                            ? `${amt / 10000000}천만원`
                                            : amt >= 1000000
                                                ? `${amt / 1000000}백만원`
                                                : `${(amt / 10000).toLocaleString()}만원`
                                        : `$${(amt / 1000).toLocaleString()}k`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* 3. Period Selection (Grid) */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-emerald-500/70" />
                                투자 시점 (과거)
                            </label>
                            <span className="text-sm font-bold text-emerald-500">{period.replace("Y", "년 전")}</span>
                        </div>
                        <Slider
                            value={[parseInt(period.replace("Y", "")) || 10]}
                            max={40}
                            min={1}
                            step={1}
                            onValueChange={(vals) => {
                                setPeriod(`${vals[0]}Y`);
                                setIsAmountManuallySet(true);
                            }}
                            className="py-2 [&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500"
                        />
                        <div className="grid grid-cols-5 gap-1 pt-2 pb-2">
                            {(["1Y", "3Y", "5Y", "10Y", "20Y"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => {
                                        setPeriod(p);
                                        setIsAmountManuallySet(true);
                                    }}
                                    className={cn(
                                        "h-11 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center backdrop-blur-md",
                                        period === p
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/30 scale-[1.02] z-10"
                                            : "bg-gradient-to-br from-white/20 to-white/5 hover:from-white/30 hover:to-white/10 text-muted-foreground hover:text-foreground border border-white/20 hover:border-white/40 shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1"
                                    )}
                                >
                                    {p.replace("Y", "년 전")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CTA Button with Glow */}
                    <div className="pt-2">
                        <Button
                            onClick={onCalculate}
                            disabled={isLoading || !ticker}
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-[0_4px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_32px_rgba(16,185,129,0.4)] rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    계산 중...
                                </>
                            ) : (
                                "가치 확인하기"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
                <Card className="border-red-500/20 bg-red-500/10">
                    <CardContent className="py-4 text-center text-red-500">
                        {error}
                    </CardContent>
                </Card>
            )}

            {isCalculated && (
                <div className="space-y-6">
                    {result ? (
                        <Card ref={resultRef} className="overflow-hidden border border-white/30 bg-white/70 dark:bg-black/50 backdrop-blur-3xl shadow-[0_40px_80px_rgba(16,185,129,0.15)] dark:shadow-[0_40px_80px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-bottom-6 duration-700 ring-1 ring-white/20">
                            <CardContent className="pt-6 sm:pt-8 pb-0 px-2 sm:px-6 text-center space-y-2 relative z-10">
                                {/* Stock Name & Ticker */}
                                <div className="flex flex-col items-center gap-1 mb-4 w-full">
                                    {/* Conditionally show logo for individual stocks, hide for ETFs */}
                                    {!result.isEtf && (
                                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-xl flex items-center justify-center flex-shrink-0 mb-3 group-hover:scale-105 transition-transform duration-500">
                                            <img
                                                src={`/api/logo?ticker=${result.ticker}`}
                                                alt={result.ticker}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-initial');
                                                    if (fallback) fallback.classList.remove('hidden');
                                                }}
                                            />
                                            <div className="fallback-initial hidden absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-xl font-bold text-white/90">
                                                {result.ticker.slice(0, 2)}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-center gap-2 w-full px-4 overflow-hidden">
                                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/50 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                                            {result.ticker.replace(".KS", "")}
                                        </span>
                                        <h3 className="text-lg font-black text-foreground tracking-tight truncate whitespace-nowrap">
                                            {result.name}
                                        </h3>
                                    </div>
                                </div>

                                {result.actualPeriod && (
                                    <div className="flex flex-col items-center justify-center gap-1 mb-2">
                                        <p className="text-xs text-muted-foreground">
                                            {result.actualPeriod}년부터 {currency === "KRW" ? `${formatCompactNumber(result.originalAmount)}원` : `$${formatCompactNumber(result.originalAmount)}`} {result.investmentType === "DCA" ? "매월 적립식으로 투자" : "거치식으로 투자"}
                                            {result.investmentType === "DCA" && <span className="block mt-0.5 opacity-70">(총 누적 원금: {currency === "KRW" ? `${formatCompactNumber(result.initialInvestment)}원` : `$${formatCompactNumber(result.initialInvestment)}`})</span>}
                                        </p>
                                        {result.pastExchangeRate && result.currentExchangeRate && !(currency === "KRW" && (result as any).isKrwBased) && (
                                            <p className="text-xs text-muted-foreground">
                                                (환율 변동 반영: 당시 {Math.round(result.pastExchangeRate).toLocaleString()}원 → 현재 {Math.round(result.currentExchangeRate).toLocaleString()}원)
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="w-full overflow-hidden px-1 mt-6">
                                    <p className="text-base font-semibold text-muted-foreground mb-1">현재 추정 가치</p>
                                    {(() => {
                                        const formattedValue = formatCurrency(result.currentValue);
                                        const len = formattedValue.length;

                                        // Ultra-safe scaling to prevent clipping on any device
                                        let fontSizeClass = "text-3xl sm:text-6xl";
                                        if (len > 18) fontSizeClass = "text-xs sm:text-xl";
                                        else if (len > 15) fontSizeClass = "text-sm sm:text-2xl";
                                        else if (len > 12) fontSizeClass = "text-lg sm:text-3xl";
                                        else if (len > 10) fontSizeClass = "text-xl sm:text-4xl";
                                        else if (len > 8) fontSizeClass = "text-2xl sm:text-5xl";

                                        return (
                                            <h2 className={cn(
                                                "font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-700 whitespace-nowrap px-2 pb-2 text-center w-full transition-all",
                                                fontSizeClass,
                                                isHighlighting && "animate-pulse scale-105"
                                            )}>
                                                {formattedValue}
                                            </h2>
                                        );
                                    })()}
                                </div>

                                <div className="grid grid-cols-3 gap-1 sm:gap-4 gap-y-8 mt-8 w-full max-w-3xl mx-auto">
                                    {/* 1. Total Profit */}
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2">
                                        <span className="opacity-80 text-[13px] sm:text-sm font-bold tracking-tight mb-1.5 text-muted-foreground whitespace-nowrap">총 수익률</span>
                                        <span className={cn(
                                            "text-[15px] sm:text-xl font-black flex items-center justify-center gap-0.5 whitespace-nowrap transition-all",
                                            result.returnRate >= 0 ? "text-red-500" : "text-blue-500",
                                            isHighlighting && "animate-bounce scale-110"
                                        )}>
                                            {result.returnRate >= 0 ? "+" : ""}
                                            {result.returnRate >= 10000
                                                ? formatCompactNumber(result.returnRate)
                                                : Number(result.returnRate.toFixed(1)).toLocaleString()
                                            }%
                                        </span>
                                    </div>

                                    {/* 2. CAGR */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                                <div className="flex items-center gap-0.5 sm:gap-1 mb-1.5 whitespace-nowrap">
                                                    <span className="opacity-80 text-[13px] sm:text-sm font-bold tracking-tight text-muted-foreground whitespace-nowrap">연평균 수익률</span>
                                                    <HelpCircle className="w-3 h-3 opacity-40 shrink-0" />
                                                </div>
                                                <span className={`text-[15px] sm:text-xl font-black ${result.cagr >= 0 ? "text-red-500" : "text-blue-500"}`} style={{ whiteSpace: "nowrap" }}>
                                                    {result.cagr >= 0 ? "+" : ""}{Number(result.cagr.toFixed(1)).toLocaleString()}%
                                                </span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-foreground/10 backdrop-blur-md text-white/90 leading-relaxed">
                                            <p className="font-bold text-emerald-400 mb-1">연평균 수익률 (CAGR)</p>
                                            기하급수적으로 자산이 매년 평균 몇 %씩 성장했는지를 보여주는 지표입니다. 복리 수익을 반영한 실질 성장률입니다.
                                        </PopoverContent>
                                    </Popover>

                                    {/* 3. MDD */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                                <div className="flex items-center gap-0.5 sm:gap-1 mb-1.5 whitespace-nowrap">
                                                    <span className="opacity-80 text-[13px] sm:text-sm font-bold tracking-tight text-muted-foreground whitespace-nowrap">최대 낙폭(MDD)</span>
                                                    <HelpCircle className="w-3 h-3 opacity-40 shrink-0" />
                                                </div>
                                                <span className="text-[15px] sm:text-xl font-black text-blue-500" style={{ whiteSpace: "nowrap" }}>
                                                    -{Number(result.mdd.toFixed(1)).toLocaleString()}%
                                                </span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-foreground/10 backdrop-blur-md text-white/90 leading-relaxed">
                                            <p className="font-bold text-red-400 mb-1">최대 낙폭 (MDD)</p>
                                            투자 기간 중 최고점에서 최저점까지 최대 하락했던 정도입니다. 투자자의 인내심을 테스트하는 가장 중요한 리스크 지표입니다.
                                            {result.mddPeriod && (
                                                <div className="mt-2 pt-2 border-t border-foreground/10 text-emerald-400/80">
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

                                    {/* 4. Quantity */}
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2">
                                        <span className="opacity-80 text-[13px] sm:text-sm font-bold tracking-tight mb-1.5 text-muted-foreground whitespace-nowrap">보유 수량</span>
                                        <span className="text-[15px] sm:text-xl font-black text-foreground/70" style={{ whiteSpace: "nowrap" }}>
                                            약 {Math.round(result.quantity).toLocaleString()}주
                                        </span>
                                    </div>

                                    {/* 5. Avg Price */}
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2">
                                        <span className="opacity-80 text-[13px] sm:text-sm font-bold tracking-tight mb-1.5 text-muted-foreground whitespace-nowrap">당시 평단가</span>
                                        <span className="text-[15px] sm:text-xl font-black text-foreground/70" style={{ whiteSpace: "nowrap" }}>
                                            {(() => {
                                                const val = Math.round(result.avgPrice);
                                                if (currency === "KRW") {
                                                    let formatted = "";
                                                    if (val >= 100000000) formatted = `${Math.floor(val / 100000000)}억`;
                                                    else if (val >= 10000) formatted = `${Math.floor(val / 10000)}만`;
                                                    else formatted = val.toLocaleString();
                                                    return `약 ${formatted}원`;
                                                } else {
                                                    const formatted = new Intl.NumberFormat("en-US", {
                                                        notation: "compact",
                                                        maximumFractionDigits: 0,
                                                    }).format(val);
                                                    return `약 $${formatted}`;
                                                }
                                            })()}
                                        </span>
                                    </div>

                                    {/* 6. Drop From ATH */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                                <div className="flex items-center gap-0.5 sm:gap-1 mb-1.5 whitespace-nowrap">
                                                    <span className="opacity-80 text-[13px] sm:text-sm font-bold tracking-tight text-muted-foreground whitespace-nowrap">고점 대비 하락</span>
                                                    <HelpCircle className="w-3 h-3 opacity-40 shrink-0" />
                                                </div>
                                                <span className="text-[15px] sm:text-xl font-black text-blue-500" style={{ whiteSpace: "nowrap" }}>
                                                    {Number(result.dropFromAth.toFixed(1)).toLocaleString()}%
                                                </span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-foreground/10 backdrop-blur-md text-white/90 leading-relaxed">
                                            <p className="font-bold text-emerald-400 mb-1">고점 대비 하락</p>
                                            역대 최고가(ATH) 대비 현재 주가의 위치입니다. 0%이면 최고가 경신중이며, 수치가 클수록 전성기 대비 많이 할인된 상태입니다.
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="h-48 w-full mt-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={result.chartData}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis
                                                dataKey="name"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                interval="preserveStartEnd"
                                                minTickGap={60}
                                                tickFormatter={(value) => {
                                                    try {
                                                        const date = new Date(value);
                                                        if (isNaN(date.getTime())) return value;

                                                        const year = date.getFullYear();
                                                        const month = date.getMonth() + 1;
                                                        return `${year}년 ${month}월`;
                                                    } catch {
                                                        return value;
                                                    }
                                                }}
                                            />
                                            <YAxis
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => {
                                                    if (currency === "KRW") {
                                                        if (value >= 100000000) return `${Math.round(value / 100000000).toLocaleString()}억`;
                                                        if (value >= 10000) return `${Math.round(value / 10000).toLocaleString()}만`;
                                                        return value.toLocaleString();
                                                    }
                                                    return `$${Math.round(value / 1000).toLocaleString()}k`;
                                                }}
                                            />
                                            <Tooltip
                                                content={(props: any) => {
                                                    const { active, payload, label } = props;
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-white/90 dark:bg-zinc-900/90 p-3 rounded-xl shadow-2xl border border-black/5 dark:border-white/10 text-xs sm:text-sm backdrop-blur-md">
                                                                <p className="mb-1 font-semibold text-foreground">{label}</p>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground font-medium">
                                                                        가치: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.value)}</span>
                                                                    </p>
                                                                    <p className="text-muted-foreground font-medium">
                                                                        주가: <span className="text-foreground">{formatCompactNumber(data.stockPrice)}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#10B981"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorValue)"
                                                isAnimationActive={true}
                                                animationDuration={4000}
                                                animationEasing="ease-in-out"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* 💡 다음 단계 추천 (Next Steps) */}
                                <div className="mt-6 pt-4 border-t border-foreground/[0.03] w-full">
                                    <div className="relative mb-8 group">
                                        {/* Premium Subtle Glow Background (Not a pill) */}
                                        <div className="absolute -left-6 -top-6 w-32 h-32 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] blur-[40px] rounded-full pointer-events-none" />
                                        
                                        <div className="flex items-center gap-4 relative z-10">
                                            {/* Stylized Icon Container */}
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-lg animate-pulse" />
                                                <div className="relative w-10 h-10 rounded-xl bg-white dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-center shadow-[0_8px_16px_rgba(16,185,129,0.08)]">
                                                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                            </div>

                                            <div className="flex flex-col">
                                                <h3 className="text-[17px] font-bold tracking-tight text-black dark:text-white flex items-center gap-2">
                                                    결과를 중심으로 다음 단계 추천!
                                                </h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 w-full max-w-[320px] mx-auto items-center">
                                        {/* 0. Share Results (Moved to top with natural UI) */}
                                        <button
                                            onClick={handleShare}
                                            className="group relative flex items-center justify-between p-4 h-[100px] rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 transition-all text-left shadow-[0_4px_15px_rgba(16,185,129,0.02)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.08)] w-full overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] to-transparent group-hover:from-emerald-500/[0.08] transition-all" />
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all shrink-0 shadow-inner">
                                                    <Share2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div>
                                                    <div className="text-[14px] font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">친구에게 결과 공유하기</div>
                                                    <div className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis opacity-80">사자고 했제? 수익률 자랑해보세요</div>
                                                </div>
                                            </div>
                                            <span className="relative z-10 text-muted-foreground/30 group-hover:text-emerald-500 transition-all text-lg font-light translate-x-0 group-hover:translate-x-1">→</span>
                                        </button>

                                        {/* 1. Switch Mode */}
                                        <button
                                            onClick={handleSwitchMode}
                                            className="group relative flex items-center justify-between p-4 h-[100px] rounded-2xl bg-white/40 dark:bg-white/5 border border-blue-500/10 hover:border-blue-500/40 transition-all text-left shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(59,130,246,0.1)] w-full overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.03] to-transparent group-hover:from-blue-500/[0.08] transition-all" />
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all shrink-0 shadow-inner">
                                                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <div className="text-[14px] font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {investmentType === "LUMP_SUM" ? "적립식으로 투자했다면 어땠을까?" : "거치식으로 투자했다면 어땠을까?"}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis opacity-80">
                                                        {investmentType === "LUMP_SUM" ? "꾸준한 월 적립 매수 시 수익률 확인하기" : "목돈을 한 번에 다 매수했을 때 수익률 확인하기"}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="relative z-10 text-muted-foreground/30 group-hover:text-blue-500 transition-all text-lg font-light translate-x-0 group-hover:translate-x-1">→</span>
                                        </button>

                                        {/* 2. AI Mentor */}
                                        {(() => {
                                            const ticker = result.ticker;
                                            const isEtf = result.isEtf || result.quoteType === "ETF";
                                            const assetAllocationEtfs = ["AOA", "AOR", "AOM", "AOK", "RPAR", "SWAN"];
                                            const isAssetAllocation = isEtf && assetAllocationEtfs.some(e => ticker.toUpperCase().includes(e));

                                            let personaId = "sage";
                                            let mentorEmoji = "🧙‍♂️";

                                            if (isAssetAllocation) {
                                                personaId = "architect";
                                                mentorEmoji = "👨‍🏫";
                                            } else if (isEtf) {
                                                personaId = "father";
                                                mentorEmoji = "👨‍🌾";
                                            } else {
                                                const isGrowth = result.cagr > 20;
                                                if (isGrowth) {
                                                    personaId = "hero";
                                                    mentorEmoji = "🦸";
                                                }
                                            }

                                            const cleanTicker = ticker.replace(".KS", "");
                                            const perfDesc = result.returnRate >= 0
                                                ? `과거 성과가 좋았는데 (${result.returnRate.toFixed(1)}%)`
                                                : `과거 성과가 아쉬웠는데 (${result.returnRate.toFixed(1)}%)`;
                                            const queryText = encodeURIComponent(`${cleanTicker}의 ${perfDesc}, 앞으로의 미래 전망에 대해 진단해 주세요`);
                                            const guruUrl = `/mentor?mentor=${personaId}&q=${queryText}`;

                                            return (
                                                <a
                                                    href={guruUrl}
                                                    className="group relative flex items-center justify-between p-4 h-[100px] rounded-2xl bg-white/40 dark:bg-white/5 border border-violet-500/10 hover:border-violet-500/40 transition-all text-left shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(139,92,246,0.1)] w-full overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.03] to-transparent group-hover:from-violet-500/[0.08] transition-all" />
                                                    <div className="flex items-center gap-4 relative z-10">
                                                        <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all shrink-0 shadow-inner">
                                                            <span className="text-xl leading-none">{mentorEmoji}</span>
                                                        </div>
                                                        <div>
                                            <div className="text-[14px] font-bold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">AI 투자 멘토와 이어서 대화하기</div>
                                                            <div className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis opacity-80">"{cleanTicker}의 미래 전망은 어떨까요?"</div>
                                                        </div>
                                                    </div>
                                                    <span className="relative z-10 text-muted-foreground/30 group-hover:text-violet-500 transition-all text-lg font-light translate-x-0 group-hover:translate-x-1">→</span>
                                                </a>
                                            );
                                        })()}

                                        {/* Advertisement Slot */}
                                        <div className="w-full flex justify-center overflow-hidden rounded-2xl">
                                            <AdSlot placement="in-article" />
                                        </div>

                                        {/* 3. Future Projection (Combined) */}
                                        {result.cagr > 0 && (() => {
                                            const cleanTicker = result.ticker.replace(".KS", "");
                                            const cagr = Math.round(result.cagr * 10) / 10;
                                            const conservativeCagr = Math.round(cagr * 0.5 * 10) / 10;

                                            const isDCA = result.investmentType === "DCA";
                                            const initialAmount = isDCA ? 0 : amount;
                                            const monthlyAmount = isDCA ? amount : 0;

                                            const baseParams = `tab=compound&years=10&monthly=${monthlyAmount}&initial=${initialAmount}&from=regret&ticker=${cleanTicker}`;

                                            return (
                                                <div className="group relative flex flex-col p-5 rounded-2xl bg-white/40 dark:bg-white/5 border border-foreground/5 hover:border-emerald-500/20 dark:hover:border-emerald-500/40 transition-all text-left shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)] w-full gap-5 overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-amber-500/[0.02] group-hover:from-emerald-500/[0.05] group-hover:to-amber-500/[0.05] transition-all" />
                                                    <div className="flex items-center gap-4 relative z-10">
                                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/10 to-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-all shrink-0 shadow-inner">
                                                            <span className="text-xl leading-none">🚀</span>
                                                        </div>
                                                        <div>
                                                            <div className="text-[14px] font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">{cleanTicker}에 향후 10년간 투자한다면?</div>
                                                            <div className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis opacity-80">과거 수익률 기반 복리 시뮬레이션</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2.5 w-full mt-1 relative z-10">
                                                        <a
                                                            href={`/calc?${baseParams}&rate=${cagr}`}
                                                            className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10 hover:border-emerald-500/30 transition-all shadow-sm hover:translate-x-1"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="text-[14px] shrink-0">📈</span>
                                                                <span className="text-[12px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">과거 수익률 그대로 반영</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[11px] font-extrabold bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-lg tabular-nums">약 {Math.round(cagr)}%</span>
                                                                <span className="text-muted-foreground/40 text-lg font-light leading-none">→</span>
                                                            </div>
                                                        </a>
                                                        <a
                                                            href={`/calc?${baseParams}&rate=${conservativeCagr}`}
                                                            className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/10 hover:border-amber-500/30 transition-all shadow-sm hover:translate-x-1"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="text-[14px] shrink-0">📉</span>
                                                                <span className="text-[12px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">과거 수익률 보수적 반영 (50%)</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[11px] font-extrabold bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-1 rounded-lg tabular-nums">약 {Math.round(conservativeCagr)}%</span>
                                                                <span className="text-muted-foreground/40 text-lg font-light leading-none">→</span>
                                                            </div>
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed border-2 bg-transparent">
                            <CardContent className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                                해당 종목의 데이터를 찾을 수 없습니다.
                            </CardContent>
                        </Card>
                    )}


                    <div className="pb-8" />
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, HelpCircle, Share2, Download, TrendingUp, Search, DollarSign, CalendarDays } from "lucide-react";
import { toPng } from 'html-to-image';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StockSearchInput } from "@/components/ui/StockSearchInput";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RegretResult {
    ticker: string;
    name: string;
    initialInvestment: number;
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
    actualPeriod?: string;
    mddPeriod?: {
        start: string;
        end: string;
    };
}

export function RegretCalculator() {
    const { currency, exchangeRate, formatCurrency, formatCompactNumber } = useCurrency();
    const [ticker, setTicker] = useState("");
    const [stockName, setStockName] = useState("");
    const [amount, setAmount] = useState<number>(1000000);
    const [period, setPeriod] = useState<"1Y" | "3Y" | "5Y" | "10Y" | "20Y" | "30Y">("10Y");
    const [result, setResult] = useState<RegretResult | null>(null);
    const [isCalculated, setIsCalculated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    const handleDownloadImage = useCallback(async () => {
        if (resultRef.current === null) return;

        try {
            setIsLoading(true);
            const dataUrl = await toPng(resultRef.current, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                style: {
                    borderRadius: '0',
                    fontFamily: 'Pretendard, sans-serif'
                }
            });
            const link = document.createElement('a');
            link.download = `core-regret-result-${new Date().getTime()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download image', err);
        } finally {
            setIsLoading(false);
        }
    }, [resultRef]);

    const handleShare = useCallback(async () => {
        if (!result) return;

        const shareText = `했제? 그때 ${result.name}(${result.ticker}) 샀으면 지금쯤 수익률이 ${result.returnRate.toFixed(1)}%라니까! 🔥\n\n` +
            `📊 투자 기간: ${result.actualPeriod} ~ 현재\n` +
            `📈 연평균 수익률(CAGR): ${result.cagr.toFixed(1)}%\n` +
            `📉 최대 낙폭(MDD): ${result.mdd.toFixed(1)}%\n\n` +
            `지금 CORE에서 당신의 후회를 확인해보세요!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'CORE 했제 계산기 결과',
                    text: shareText,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share cancelled or failed', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText + "\n" + window.location.href);
                alert('결과가 클립보드에 복사되었습니다! 친구에게 공유해보세요.');
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    }, [result]);

    // Update default amount when currency changes
    useEffect(() => {
        if (currency === "KRW") {
            setAmount(1000000);
        } else {
            setAmount(1000);
        }
        setIsCalculated(false);
        setResult(null);
    }, [currency]);

    const handleStockSelect = (selectedTicker: string, name?: string) => {
        setTicker(selectedTicker);
        setStockName(name || selectedTicker);
        setIsCalculated(false);
        setResult(null);
    };

    const onCalculate = async () => {
        if (!ticker) return;

        setIsLoading(true);
        setError(null);

        try {
            // Fetch historical data from API
            const res = await fetch(`/api/stock/historical?ticker=${encodeURIComponent(ticker)}&period=${period}`);
            const data = await res.json();

            if (!res.ok || data.error) {
                setError(data.error || "Failed to fetch data");
                setIsLoading(false);
                return;
            }

            const { pastPrice, currentPrice, chartData, name, actualStartDate } = data;

            // Calculate investment based on currency
            const investmentUSD = currency === "KRW" ? amount / exchangeRate : amount;
            const shares = investmentUSD / pastPrice;
            const currentValueUSD = shares * currentPrice;
            const profitUSD = currentValueUSD - investmentUSD;
            const returnRate = (profitUSD / investmentUSD) * 100;

            // Convert back to display currency
            const multiplier = currency === "KRW" ? exchangeRate : 1;

            // Build chart data with investment values and prices
            const investmentChartData = chartData.map((point: any, idx: number) => {
                const priceRatio = point.price / pastPrice;
                const value = investmentUSD * priceRatio * multiplier;
                return {
                    name: point.name,
                    value: Math.round(value),
                    stockPrice: point.price * multiplier, // Add stock price
                };
            });

            // Calculate MDD and Drop From ATH
            let peakValue = investmentChartData[0].value;
            let peakDate = investmentChartData[0].name;
            let maxDrawdown = 0;
            let mddStart = investmentChartData[0].name;
            let mddEnd = investmentChartData[0].name;
            let athPrice = investmentChartData[0].stockPrice;

            for (const point of investmentChartData) {
                // MDD (Portfolio Value)
                if (point.value > peakValue) {
                    peakValue = point.value;
                    peakDate = point.name;
                }
                const drawdown = (peakValue - point.value) / peakValue;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                    mddStart = peakDate;
                    mddEnd = point.name;
                }

                // ATH Price
                if (point.stockPrice > athPrice) athPrice = point.stockPrice;
            }

            const mdd = maxDrawdown * 100;
            const dropFromAth = ((investmentChartData[investmentChartData.length - 1].stockPrice - athPrice) / athPrice) * 100;

            // Calculate CAGR
            const years = parseInt(period.replace("Y", ""));
            const cagr = ((Math.pow(currentValueUSD / investmentUSD, 1 / years) - 1) * 100);

            setResult({
                ticker: data.ticker,
                name: name || stockName,
                initialInvestment: amount,
                period,
                pastPrice: pastPrice * multiplier,
                currentPrice: currentPrice * multiplier,
                currentValue: currentValueUSD * multiplier,
                profit: profitUSD * multiplier,
                returnRate,
                cagr,
                mdd,
                quantity: shares,
                avgPrice: pastPrice * multiplier,
                dropFromAth,
                chartData: investmentChartData,
                actualPeriod: actualStartDate ? `${new Date(actualStartDate).getFullYear()}` : undefined,
                mddPeriod: {
                    start: mddStart,
                    end: mddEnd
                }
            });
            setIsCalculated(true);
        } catch (err) {
            console.error("Calculate error:", err);
            setError("데이터를 가져오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
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
                            <TrendingUp className="w-4 h-4 text-sky-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground tracking-tight">개별 종목 백테스팅</h3>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground/70 tracking-wide leading-relaxed">
                        그때 그 종목에 투자했었더라면 지금은<br className="sm:hidden" /> 어떻게 되었을지 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-7 pt-6">

                    {/* 1. Ticker Input (Real Search) */}
                    <div className="space-y-3">
                        <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5 text-sky-500/70" />
                            투자 종목 (티커)
                        </label>
                        <StockSearchInput
                            value={ticker}
                            onChange={handleStockSelect}
                            placeholder="종목 검색 (예: AAPL, samsung)..."
                        />
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* 2. Amount Selection (Modern Chips) */}
                    <div className="space-y-3">
                        <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-sky-500/70" />
                            기준 투자 금액 ({currency === "KRW" ? "원" : "$"})
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {(currency === "KRW"
                                ? [100000, 500000, 1000000, 10000000]
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
                                        ? amt >= 10000000
                                            ? `${amt / 10000000}천만원`
                                            : `${(amt / 10000).toLocaleString()}만원`
                                        : `$${amt.toLocaleString()}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* 3. Period Selection (Grid) */}
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

                    {/* CTA Button with Glow */}
                    <div className="pt-2">
                        <Button
                            onClick={onCalculate}
                            disabled={isLoading || !ticker}
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-[0_4px_24px_rgba(14,165,233,0.3)] hover:shadow-[0_4px_32px_rgba(14,165,233,0.4)] rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
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
                        <Card ref={resultRef} className="border-primary/20 bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
                            <CardContent className="pt-0 text-center space-y-2">
                                {/* Stock Name Badge */}
                                <div className="flex items-center justify-center gap-2 mb-2 whitespace-nowrap">
                                    <span className="text-sm font-medium text-sky-500 bg-sky-500/10 border border-sky-500/50 px-2 py-0.5 rounded-md shrink-0">
                                        {result.ticker}
                                    </span>
                                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">{result.name}</span>
                                </div>

                                {result.actualPeriod && (
                                    <p className="text-xs text-muted-foreground">
                                        {result.actualPeriod}년부터 {currency === "KRW" ? `${formatCompactNumber(result.initialInvestment)}원` : `$${formatCompactNumber(result.initialInvestment)}`} 거치식으로 투자
                                    </p>
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
                                                "font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 whitespace-nowrap px-2 pb-2 text-center w-full",
                                                fontSizeClass
                                            )}>
                                                {formattedValue}
                                            </h2>
                                        );
                                    })()}
                                </div>

                                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 w-full max-w-3xl mx-auto">
                                    {/* 1. Total Profit */}
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2">
                                        <span className="opacity-70 text-xs font-semibold tracking-tight mb-1 text-muted-foreground">총 수익률</span>
                                        <span className={`text-sm sm:text-lg font-black flex items-center gap-1 ${result.returnRate >= 0 ? "text-red-500" : "text-blue-500"} whitespace-nowrap`}>
                                            {result.returnRate >= 0 ? "+" : ""}
                                            {result.returnRate >= 10000
                                                ? formatCompactNumber(result.returnRate)
                                                : result.returnRate.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                                            }%
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
                                            기하급수적으로 자산이 매년 평균 몇 %씩 성장했는지를 보여주는 지표입니다. 복리 수익을 반영한 실질 성장률입니다.
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
                                            투자 기간 중 최고점에서 최저점까지 최대 하락했던 정도입니다. 투자자의 인내심을 테스트하는 가장 중요한 리스크 지표입니다.
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

                                    {/* 4. Quantity */}
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2">
                                        <span className="opacity-70 text-xs font-semibold tracking-tight mb-1 text-muted-foreground">보유 수량</span>
                                        <span className="text-sm sm:text-lg font-black text-slate-500 whitespace-nowrap">
                                            약 {Math.round(result.quantity).toLocaleString()}주
                                        </span>
                                    </div>

                                    {/* 5. Avg Price */}
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2">
                                        <span className="opacity-70 text-xs font-semibold tracking-tight mb-1 text-muted-foreground whitespace-nowrap">당시 평단가</span>
                                        <span className="text-sm sm:text-lg font-black text-slate-500 whitespace-nowrap">
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
                                                <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                                                    <span className="opacity-70 text-xs font-semibold tracking-tight text-muted-foreground">고점 대비 하락</span>
                                                    <HelpCircle className="w-3 h-3 opacity-40" />
                                                </div>
                                                <span className="text-sm sm:text-lg font-black text-blue-500 whitespace-nowrap">
                                                    {result.dropFromAth.toFixed(1)}%
                                                </span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed">
                                            <p className="font-bold text-sky-400 mb-1">고점 대비 하락</p>
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
                                                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis
                                                dataKey="name"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                interval="preserveStartEnd"
                                                minTickGap={30}
                                                tickFormatter={(value) => {
                                                    try {
                                                        const date = new Date(value);
                                                        if (isNaN(date.getTime())) return value;

                                                        const now = new Date();
                                                        const diffYears = now.getFullYear() - date.getFullYear();

                                                        if (diffYears <= 0) return "현재";
                                                        return `${diffYears}년전`;
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
                                                            <div className="bg-white/90 dark:bg-black/90 p-3 rounded-xl shadow-xl border border-black/5 dark:border-white/10 text-xs sm:text-sm backdrop-blur-md">
                                                                <p className="mb-1 font-bold">{label}</p>
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">
                                                                        가치: <span className="font-bold text-sky-500">{formatCurrency(data.value)}</span>
                                                                    </p>
                                                                    <p className="text-muted-foreground">
                                                                        주가: <span className="font-medium text-current">{formatCompactNumber(data.stockPrice)}</span>
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
                                                stroke="#0EA5E9"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorValue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
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
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-6">
                        <Button
                            onClick={handleShare}
                            className="w-full sm:flex-1 h-12 text-base font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-xl shadow-blue-500/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Share2 className="w-5 h-5 text-white" />
                            <span>친구에게 공유하기</span>
                        </Button>
                        <Button
                            onClick={handleDownloadImage}
                            disabled={isLoading}
                            className="w-full sm:flex-1 h-12 text-base font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-xl shadow-blue-500/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Download className="w-5 h-5 text-white" />
                            <span>이미지로 저장하기</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { calculateCompoundInterest, CompoundResult } from "@/lib/finance-utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { HelpCircle, Calculator, Wallet, Coins, TrendingUp, CalendarDays, Percent } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { useCurrency } from "@/contexts/CurrencyContext";

export function CompoundCalculator() {
    const { currency, formatCurrency, formatCompactNumber } = useCurrency();

    // Default values based on currency
    const [initial, setInitial] = useState(100000000);
    const [monthly, setMonthly] = useState(1000000);
    const [rate, setRate] = useState(10);
    const [years, setYears] = useState(10);
    const [inflation, setInflation] = useState(3);
    const [data, setData] = useState<CompoundResult[]>([]);
    const [isCalculated, setIsCalculated] = useState(false);



    // Effect to handle currency switching for existing state if needed, 
    // but for now simple reset/defaulting on mount or manual change is fine.
    // Let's just listen to currency change to switch defaults if user hasn't typed? 
    // Actually, simple way: Just use a useEffect to switch values when currency changes
    useEffect(() => {
        if (currency === "KRW") {
            setInitial(100000000);
            setMonthly(1000000);
        } else {
            setInitial(10000);
            setMonthly(500);
        }
        setIsCalculated(false);
    }, [currency]);

    // Reset results when any input changes
    useEffect(() => {
        setIsCalculated(false);
    }, [initial, monthly, rate, years, inflation]);

    const onCalculate = () => {
        const results = calculateCompoundInterest(initial, monthly, rate, years, inflation);
        setData(results);
        setIsCalculated(true);
    };

    const finalResult = data[data.length - 1];

    // Calculate 6 Core Metrics
    const finalNominalAsset = isCalculated ? Math.round(finalResult.totalAmount * Math.pow(1 + inflation / 100, years)) : 0;

    // Total Invested Nominal: sum of initial + annually increasing monthly contributions
    // S = M * 12 * ((1+i)^n - 1) / i
    const totalInvestedNominal = isCalculated
        ? Math.round(initial + (
            inflation === 0
                ? (monthly * 12 * years)
                : (monthly * 12 * (Math.pow(1 + inflation / 100, years) - 1) / (inflation / 100))
        ))
        : 0;

    const totalNetProfitNominal = finalNominalAsset - totalInvestedNominal;
    const totalReturnRate = totalInvestedNominal > 0 ? (totalNetProfitNominal / totalInvestedNominal) * 100 : 0;
    const realValue = isCalculated ? finalResult.totalAmount : 0;
    const lifetimeMonthlyIncome = isCalculated ? Math.round(realValue * 0.04 / 12) : 0;
    const multiplier = totalInvestedNominal > 0 ? (finalNominalAsset / totalInvestedNominal).toFixed(1) : "0";

    const formattedIncome = (() => {
        const val = Math.round(lifetimeMonthlyIncome);
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
            return `$${formatted}`;
        }
    })();

    // Create Nominal Chart Data
    const chartData = data.map((item) => {
        const year = item.year;
        const nominalAsset = Math.round(item.totalAmount * Math.pow(1 + inflation / 100, year));

        // Calculate Nominal Invested
        let nominalInvested = initial;
        if (year > 0) {
            if (inflation === 0) {
                nominalInvested += monthly * 12 * year;
            } else {
                nominalInvested += monthly * 12 * ((Math.pow(1 + inflation / 100, year) - 1) / (inflation / 100));
            }
        }

        return {
            ...item,
            totalAmount: nominalAsset,
            totalInvested: Math.round(nominalInvested),
            interest: nominalAsset - Math.round(nominalInvested)
        };
    });

    return (
        <div className="space-y-8">
            {/* Input Card: Premium Glassmorphism - Enhanced by Stitch */}
            <Card className="relative overflow-hidden border border-white/15 bg-white/5 dark:bg-black/30 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5">
                {/* Top Gradient Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-60" />

                <CardHeader className="pb-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20">
                            <Calculator className="w-4 h-4 text-sky-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground tracking-tight">경제적 자유 시뮬레이션</h3>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground/70 tracking-wide leading-relaxed">
                        복리의 마법이 가져다줄 경제적 자유를<br className="sm:hidden" /> 시뮬레이션 해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-7 pt-6">

                    {/* 1. Initial Amount */}
                    <div className="space-y-3">
                        <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-sky-500/70" />
                            기초 보유 자산 ({currency === "KRW" ? "원" : "$"})
                        </label>
                        <Input
                            type="text"
                            value={initial.toLocaleString()}
                            onChange={(e) => {
                                const val = Number(e.target.value.replace(/[^0-9]/g, ""));
                                setInitial(val);
                            }}
                            className="h-12 bg-white/[0.03] dark:bg-black/10 border-white/[0.06] focus:border-sky-500/50 focus:ring-sky-500/20 transition-all rounded-xl text-lg font-medium"
                            onKeyDown={(e) => e.key === "Enter" && onCalculate()}
                        />
                        <div className="flex flex-nowrap overflow-x-auto gap-1.5 pb-2 -mx-1 px-1 scrollbar-none">
                            {(currency === "KRW"
                                ? [10000000, 50000000, 100000000, 300000000, 500000000, 1000000000]
                                : [10000, 50000, 100000, 300000, 500000, 1000000]
                            ).map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setInitial(amt)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-300 whitespace-nowrap shrink-0",
                                        initial === amt
                                            ? "bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                                            : "bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground border border-white/[0.06] hover:border-white/15"
                                    )}
                                >
                                    {currency === "KRW"
                                        ? amt === 10000000 ? "1천만원"
                                            : amt === 50000000 ? "5천만원"
                                                : amt >= 100000000
                                                    ? `${(amt / 100000000).toLocaleString()}억원`
                                                    : `${(amt / 10000).toLocaleString()}만원`
                                        : `$${(amt / 1000).toLocaleString()}k`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* 2. Monthly Contribution */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-1">
                            <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                <Coins className="w-3.5 h-3.5 text-sky-500/70" />
                                월 추가 투자 금액 ({currency === "KRW" ? "원" : "$"})
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
                                </PopoverTrigger>
                                <PopoverContent className="w-64 text-xs leading-relaxed">
                                    <p className="font-bold mb-1 text-sky-500">납입금 증액 가정</p>
                                    설정하신 인플레이션 수치만큼 매년 월 납입액도 비례해서 증액된다고 가정합니다. 이는 시간이 흘러도 저축의 '실질 가치'를 일정하게 유지하는 현실적인 시나리오를 반영합니다.
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Input
                            type="text"
                            value={monthly.toLocaleString()}
                            onChange={(e) => {
                                const val = Number(e.target.value.replace(/[^0-9]/g, ""));
                                setMonthly(val);
                            }}
                            className="h-12 bg-white/[0.03] dark:bg-black/10 border-white/[0.06] focus:border-sky-500/50 focus:ring-sky-500/20 transition-all rounded-xl text-lg font-medium"
                            onKeyDown={(e) => e.key === "Enter" && onCalculate()}
                        />
                        <div className="flex flex-wrap gap-2">
                            {(currency === "KRW"
                                ? [500000, 1000000, 2000000, 3000000]
                                : [500, 1000, 2000, 3000]
                            ).map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setMonthly(amt)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300",
                                        monthly === amt
                                            ? "bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                                            : "bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground border border-white/[0.06] hover:border-white/15"
                                    )}
                                >
                                    {currency === "KRW"
                                        ? amt >= 100000000
                                            ? `${(amt / 100000000).toLocaleString()}억원`
                                            : `${(amt / 10000).toLocaleString()}만원`
                                        : `$${amt.toLocaleString()}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* 3. Annual Rate */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-sky-500/70" />
                                연평균 목표(명목) 수익률 (%)
                            </label>
                            <span className="text-sm font-bold text-sky-500">{rate}%</span>
                        </div>
                        <Slider
                            value={[rate]}
                            max={30}
                            min={0}
                            step={0.5}
                            onValueChange={(vals) => setRate(vals[0])}
                            className="py-2"
                        />
                        <div className="flex flex-wrap gap-2">
                            {[
                                { val: 3, label: "예적금 (3%)" },
                                { val: 10, label: "S&P 500 (10%)" },
                                { val: 15, label: "NASDAQ 100 (15%)" }
                            ].map((item) => (
                                <button
                                    key={item.val}
                                    onClick={() => setRate(item.val)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300",
                                        rate === item.val
                                            ? "bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                                            : "bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground border border-white/[0.06] hover:border-white/15"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* 4. Years */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-sky-500/70" />
                                투자 기간 (년)
                            </label>
                            <span className="text-sm font-bold text-sky-500">{years}년</span>
                        </div>
                        <Slider
                            defaultValue={[years]}
                            autoFocus
                            value={[years]}
                            max={50}
                            min={1}
                            step={1}
                            onValueChange={(vals) => setYears(vals[0])}
                            className="py-2"
                        />
                        <div className="flex flex-wrap gap-2">
                            {[1, 5, 10, 20, 30].map((y) => (
                                <button
                                    key={y}
                                    onClick={() => setYears(y)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300",
                                        years === y
                                            ? "bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                                            : "bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground border border-white/[0.06] hover:border-white/15"
                                    )}
                                >
                                    {y}년
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* 5. Inflation */}
                    <div className="space-y-3">
                        <label className="text-[13px] font-bold text-foreground/90 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                            <Percent className="w-3.5 h-3.5 text-sky-500/70" />
                            연평균 인플레이션 (%)
                        </label>
                        <Input
                            type="number"
                            value={inflation}
                            onChange={(e) => setInflation(Number(e.target.value))}
                            className="h-12 bg-white/[0.03] dark:bg-black/10 border-white/[0.06] focus:border-sky-500/50 focus:ring-sky-500/20 transition-all rounded-xl text-lg font-medium"
                            onKeyDown={(e) => e.key === "Enter" && onCalculate()}
                        />
                        <div className="flex flex-wrap gap-2">
                            {[2, 3, 4, 5].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setInflation(val)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300",
                                        inflation === val
                                            ? "bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                                            : "bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground border border-white/[0.06] hover:border-white/15"
                                    )}
                                >
                                    {val}%
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CTA Button with Glow */}
                    <div className="pt-2">
                        <Button
                            onClick={onCalculate}
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-[0_4px_24px_rgba(14,165,233,0.3)] hover:shadow-[0_4px_32px_rgba(14,165,233,0.4)] rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]"
                        >
                            자유 계산하기
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isCalculated && finalResult && (
                <Card className="border-primary/20 bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardContent className="pt-6 text-center space-y-6">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">{years}년 후 예상 최종 자산 (명목)</p>
                            {(() => {
                                const formattedValue = formatCurrency(finalNominalAsset);
                                const len = formattedValue.length;
                                let fontSizeClass = "text-3xl sm:text-5xl";

                                if (len > 24) fontSizeClass = "text-lg sm:text-xl";
                                else if (len > 20) fontSizeClass = "text-xl sm:text-2xl";
                                else if (len > 16) fontSizeClass = "text-2xl sm:text-3xl";
                                else if (len > 12) fontSizeClass = "text-2xl sm:text-4xl";

                                return (
                                    <h2 className={cn(
                                        "font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 tracking-tight whitespace-nowrap px-4 py-2 text-center",
                                        fontSizeClass
                                    )}>
                                        {formattedValue}
                                    </h2>
                                );
                            })()}
                        </div>

                        <div className="grid grid-cols-3 gap-1 sm:gap-4 mt-8 w-full max-w-3xl mx-auto">
                            {/* 1. Total Invested */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                        <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                                            <span className="opacity-70 text-xs font-semibold tracking-tight text-muted-foreground">총 원금 합계</span>
                                            <HelpCircle className="w-3 h-3 opacity-40" />
                                        </div>
                                        <span className="text-xs sm:text-lg font-black text-slate-500" style={{ whiteSpace: "nowrap" }}>
                                            {currency === "KRW" ? `${formatCompactNumber(totalInvestedNominal)}원` : `$${formatCompactNumber(totalInvestedNominal)}`}
                                        </span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed shadow-2xl">
                                    <p className="font-bold text-slate-400 mb-1">총 원금 합계 (명목)</p>
                                    초기 자산과 매월 저축한 금액을 합산한 총 투자 원금입니다. 내가 직접 노력해서 모은 돈입니다.
                                </PopoverContent>
                            </Popover>

                            {/* 2. Return Rate */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                        <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                                            <span className="opacity-70 text-xs font-semibold tracking-tight text-muted-foreground">총 수익률</span>
                                            <HelpCircle className="w-3 h-3 opacity-40" />
                                        </div>
                                        <span className={`text-xs sm:text-lg font-black flex items-center justify-center gap-0.5 ${totalReturnRate >= 0 ? "text-red-500" : "text-blue-500"}`} style={{ whiteSpace: "nowrap" }}>
                                            {totalReturnRate >= 0 ? "+" : ""}
                                            {totalReturnRate >= 10000
                                                ? formatCompactNumber(totalReturnRate)
                                                : totalReturnRate.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                                            }%
                                        </span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed shadow-2xl">
                                    <p className="font-bold text-red-400 mb-1">총 수익률</p>
                                    총 원금 대비 불어난 자산의 비율입니다. 복리의 마법이 얼마나 강력하게 작용했는지 보여주는 지표입니다.
                                </PopoverContent>
                            </Popover>

                            {/* 3. Real Value */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                        <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                                            <span className="opacity-70 text-xs font-semibold tracking-tight text-muted-foreground">실질 가치</span>
                                            <HelpCircle className="w-3 h-3 opacity-40" />
                                        </div>
                                        <span className="text-xs sm:text-lg font-black text-red-500" style={{ whiteSpace: "nowrap" }}>
                                            {currency === "KRW" ? `약 ${formatCompactNumber(realValue)}원` : `$${formatCompactNumber(realValue)}`}
                                        </span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed shadow-2xl">
                                    <p className="font-bold text-indigo-400 mb-1">실질 가치 (현재가 기준)</p>
                                    미래의 최종 자산을 현재의 물가 가치로 환산한 금액입니다. 인플레이션을 고려했을 때 실제로 체감되는 '진짜 구매력'입니다.
                                </PopoverContent>
                            </Popover>

                            {/* 4. Net Profit */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                        <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                                            <span className="opacity-70 text-xs font-semibold tracking-tight text-muted-foreground">순수익 합계</span>
                                            <HelpCircle className="w-3 h-3 opacity-40" />
                                        </div>
                                        <span className="text-xs sm:text-lg font-black text-red-500" style={{ whiteSpace: "nowrap" }}>
                                            {currency === "KRW" ? `+${formatCompactNumber(totalNetProfitNominal)}원` : `+$${formatCompactNumber(totalNetProfitNominal)}`}
                                        </span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed shadow-2xl">
                                    <p className="font-bold text-red-400 mb-1">순수익 합계 (명목)</p>
                                    총 원금을 제외하고 오로지 '복리 이자'로만 불어난 순수익 금액입니다. 복리가 벌어다 준 '공돈'의 총합입니다.
                                </PopoverContent>
                            </Popover>

                            {/* 5. Lifetime Monthly Income */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="flex flex-col items-center justify-center min-w-0 py-2 cursor-help transition-opacity hover:opacity-80">
                                        <div className="flex items-center gap-1 mb-1 whitespace-nowrap">
                                            <span className="opacity-70 text-xs font-semibold tracking-tight text-muted-foreground">평생 실질 월급</span>
                                            <HelpCircle className="w-3 h-3 opacity-40" />
                                        </div>
                                        <span className="text-xs sm:text-lg font-black text-red-500" style={{ whiteSpace: "nowrap" }}>
                                            {formattedIncome}
                                        </span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 text-xs font-medium bg-black/90 border-white/10 backdrop-blur-md text-white/90 leading-relaxed shadow-2xl">
                                    <p className="font-bold text-amber-400 mb-1.5">평생 실질 월급 (4% 법칙)</p>
                                    <p className="mb-2">자산의 원금을 유지하면서 평생 인출 가능한 금액입니다. 이 금액이 당신의 한 달 생활비를 넘어선다면, 그것이 바로 <span className="text-amber-200">경제적 자유</span>입니다.</p>
                                    <div className="pt-2 border-t border-white/10 text-[10px] text-muted-foreground">
                                        * 물가 상승을 고려하여 현재의 화폐 가치로 환산된 수치입니다. 즉, "미래에 받을 돈이 현재의 {formattedIncome}과 같은 가치"임을 의미합니다.
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* 6. Investment Period */}
                            <div className="flex flex-col items-center justify-center min-w-0 py-2">
                                <span className="opacity-70 text-xs font-semibold tracking-tight mb-1 text-muted-foreground">투자 기간</span>
                                <span className="text-xs sm:text-lg font-black text-slate-500" style={{ whiteSpace: "nowrap" }}>
                                    {years}년
                                </span>
                            </div>
                        </div>

                        {/* Summary Insight Statement */}
                        <div className="mt-4 p-6 rounded-2xl bg-slate-500/5 border border-slate-500/10 text-center animate-in fade-in zoom-in duration-1000">
                            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400 max-w-3xl mx-auto text-center break-keep">
                                앞으로 <span className="font-bold text-slate-800 dark:text-slate-200">{years}년</span> 동안 이 계획을 완수한다면, 당신의 자산은 총 원금 <span className="font-bold text-slate-800 dark:text-slate-200">{currency === "KRW" ? `${formatCompactNumber(totalInvestedNominal)}원` : `$${formatCompactNumber(totalInvestedNominal)}`}</span> 대비 약 <span className="font-bold text-slate-800 dark:text-slate-200">{multiplier}배</span>인 <span className="font-bold text-slate-800 dark:text-slate-200">{currency === "KRW" ? `약 ${formatCompactNumber(finalNominalAsset)}원` : `approx. $${formatCompactNumber(finalNominalAsset)}`}</span>이 되어 돌아옵니다. 여기서 물가 상승을 이겨낸 <span className="font-bold text-slate-800 dark:text-slate-200">{currency === "KRW" ? `약 ${formatCompactNumber(realValue)}원` : `$${formatCompactNumber(realValue)}`}</span>의 실질 구매력은 4% 법칙에 따라 매달 약 <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {(() => {
                                        const val = Math.round(lifetimeMonthlyIncome);
                                        if (currency === "KRW") {
                                            if (val >= 100000000) return `${Math.floor(val / 100000000)}억`;
                                            if (val >= 10000) return `${Math.floor(val / 10000)}만`;
                                            return val.toLocaleString();
                                        } else {
                                            return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 0 }).format(val);
                                        }
                                    })()}{currency === "KRW" ? "원" : ""}</span>이라는 평생 실질 월급이 되어 당신에게 자유로운 삶을 보장합니다.
                            </p>
                        </div>

                        {/* Chart Section - Nominal Values */}
                        <div className="h-48 w-full mt-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={chartData}
                                    margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
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
                                                const nominalAsset = payload.find((p: any) => p.dataKey === "totalAmount")?.value || 0;
                                                const nominalInvested = payload.find((p: any) => p.dataKey === "totalInvested")?.value || 0;
                                                const nominalProfit = nominalAsset - nominalInvested;
                                                const year = Number(label);

                                                const formatVal = (v: number) => currency === "KRW"
                                                    ? `${Math.round(v).toLocaleString()}원`
                                                    : `$${Math.round(v).toLocaleString()}`;

                                                return (
                                                    <div className="bg-white/90 dark:bg-black/90 p-3 rounded-xl shadow-xl border border-black/5 dark:border-white/10 text-xs sm:text-sm backdrop-blur-md">
                                                        <p className="mb-2 ml-1 font-bold">{year}년 후</p>
                                                        <div className="space-y-1.5 min-w-[180px]">
                                                            <div className="flex justify-between gap-4 items-center">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                                                    <span className="text-muted-foreground">누적 명목 자산</span>
                                                                </div>
                                                                <span className="font-bold text-sky-500 tabular-nums">
                                                                    {formatVal(nominalAsset)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between gap-4 items-center">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${nominalProfit >= 0 ? "bg-red-500" : "bg-blue-500"}`} />
                                                                    <span className="text-muted-foreground">누적 명목 수익</span>
                                                                </div>
                                                                <span className={cn("font-medium tabular-nums", nominalProfit >= 0 ? "text-red-500" : "text-blue-500")}>
                                                                    {nominalProfit > 0 ? "+" : ""}{formatVal(nominalProfit)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between gap-4 items-center">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                                    <span className="text-muted-foreground">누적 납입 원금</span>
                                                                </div>
                                                                <span className="font-medium text-muted-foreground tabular-nums">
                                                                    {formatVal(nominalInvested)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="totalAmount"
                                        stroke="#0EA5E9"
                                        fill="url(#colorTotal)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="totalInvested"
                                        stroke="#64748b"
                                        fill="url(#colorInvested)"
                                        strokeWidth={1}
                                        strokeDasharray="4 4"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )
            }
        </div >
    );
}

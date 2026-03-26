"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { calculateCompoundInterest, CompoundResult } from "@/lib/finance-utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
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

    const onCalculate = () => {
        const results = calculateCompoundInterest(initial, monthly, rate, years, inflation);
        setData(results);
        setIsCalculated(true);
    };

    const finalResult = data[data.length - 1];

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
            {/* Input Card: Premium Glassmorphism */}
            <Card className="overflow-hidden border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5">
                <CardHeader className="pb-2">
                    <p className="text-sm font-medium text-muted-foreground/80 tracking-wide">
                        시간이 만드는 복리의 마법을 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-9">

                    {/* 1. Initial Amount */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                            기초 보유 자산 ({currency === "KRW" ? "원" : "$"})
                        </label>
                        <Input
                            type="text"
                            value={initial.toLocaleString()}
                            onChange={(e) => {
                                const val = Number(e.target.value.replace(/[^0-9]/g, ""));
                                setInitial(val);
                            }}
                            className="h-12 bg-white/5 dark:bg-black/10 border-white/10 focus:border-sky-500/50 focus:ring-sky-500/20 transition-all rounded-xl text-lg font-medium"
                            onKeyDown={(e) => e.key === "Enter" && onCalculate()}
                        />
                        <div className="flex flex-wrap gap-2">
                            {(currency === "KRW"
                                ? [10000000, 50000000, 100000000, 500000000, 1000000000]
                                : [10000, 50000, 100000, 500000, 1000000]
                            ).map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setInitial(amt)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                        initial === amt
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-transparent"
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

                    {/* 2. Monthly Contribution */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">
                            월 추가 투자 금액 ({currency === "KRW" ? "원" : "$"})
                        </label>
                        <Input
                            type="text"
                            value={monthly.toLocaleString()}
                            onChange={(e) => {
                                const val = Number(e.target.value.replace(/[^0-9]/g, ""));
                                setMonthly(val);
                            }}
                            className="h-12 bg-white/5 dark:bg-black/10 border-white/10 focus:border-sky-500/50 focus:ring-sky-500/20 transition-all rounded-xl text-lg font-medium"
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
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                        monthly === amt
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-transparent"
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

                    {/* 3. Annual Rate */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">연평균 목표(명목) 수익률 (%)</label>
                        <Input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(Number(e.target.value))}
                            className="h-12 bg-white/5 dark:bg-black/10 border-white/10 focus:border-sky-500/50 focus:ring-sky-500/20 transition-all rounded-xl text-lg font-medium"
                            onKeyDown={(e) => e.key === "Enter" && onCalculate()}
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
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                        rate === item.val
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-transparent"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4. Years */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">투자 기간 (년)</label>
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
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                        years === y
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-transparent"
                                    )}
                                >
                                    {y}년
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5. Inflation */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider ml-1">연평균 인플레이션 (%)</label>
                        <Input
                            type="number"
                            value={inflation}
                            onChange={(e) => setInflation(Number(e.target.value))}
                            className="h-12 bg-white/5 dark:bg-black/10 border-white/10 focus:border-sky-500/50 focus:ring-sky-500/20 transition-all rounded-xl text-lg font-medium"
                            onKeyDown={(e) => e.key === "Enter" && onCalculate()}
                        />
                        <div className="flex flex-wrap gap-2">
                            {[2, 3, 4, 5].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setInflation(val)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                        inflation === val
                                            ? "bg-sky-500/10 text-sky-500 border border-sky-500/50"
                                            : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-transparent"
                                    )}
                                >
                                    {val}%
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={onCalculate}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:via-blue-400 hover:to-indigo-500 shadow-xl shadow-blue-500/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
                    >
                        자유 계산하기
                    </Button>
                </CardContent>
            </Card>

            {isCalculated && finalResult && (
                <Card className="border-primary/20 bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardContent className="pt-6 text-center flex flex-col gap-5">
                        {/* 1. Final Nominal Asset */}
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">예상 최종 명목 자산</p>
                            {(() => {
                                const formattedValue = formatCurrency(Math.round(finalResult.totalAmount * Math.pow(1 + inflation / 100, years)));
                                const len = formattedValue.length;
                                let fontSizeClass = "text-4xl sm:text-6xl"; // Default for short

                                if (len > 20) fontSizeClass = "text-xl sm:text-3xl";
                                else if (len > 14) fontSizeClass = "text-2xl sm:text-4xl";
                                else if (len > 9) fontSizeClass = "text-3xl sm:text-5xl";

                                return (
                                    <h2 className={cn(
                                        "font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 tracking-tight whitespace-nowrap px-1",
                                        fontSizeClass
                                    )}>
                                        {formattedValue}
                                    </h2>
                                );
                            })()}
                        </div>

                        {/* Nominal Metrics breakdown */}
                        <div className="grid grid-cols-2 gap-4 justify-center max-w-lg mx-auto mt-4">
                            <div className="text-center pr-4 border-r border-white/10">
                                <p className="text-xs text-muted-foreground mb-1">총 납입 원금 (명목)</p>
                                <p className="text-lg font-semibold text-primary">
                                    {currency === "KRW" ? "" : "$"}
                                    {formatCompactNumber(Math.round(
                                        initial + (
                                            monthly * 12 * (
                                                inflation === 0
                                                    ? years
                                                    : (Math.pow(1 + inflation / 100, years) - 1) / (inflation / 100)
                                            )
                                        )
                                    ))}
                                    {currency === "KRW" ? "원" : ""}
                                </p>
                            </div>
                            <div className="text-center pl-4">
                                <p className="text-xs text-muted-foreground mb-1">총 명목 수익</p>
                                <p className="text-lg font-semibold text-primary">
                                    +{currency === "KRW" ? "" : "$"}
                                    {formatCompactNumber(Math.round(
                                        (finalResult.totalAmount * Math.pow(1 + inflation / 100, years)) -
                                        (initial + (
                                            monthly * 12 * (
                                                inflation === 0
                                                    ? years
                                                    : (Math.pow(1 + inflation / 100, years) - 1) / (inflation / 100)
                                            )
                                        ))
                                    ))}
                                    {currency === "KRW" ? "원" : ""}
                                </p>
                            </div>
                        </div>

                        {/* 2. Real Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* 2.1 Real Value */}
                            <div className="p-3 rounded-lg bg-white/5 dark:bg-black/5 flex flex-col justify-between h-full">
                                <div className="flex items-center justify-center gap-1 mb-1 text-xs text-muted-foreground">
                                    <span>실질 가치</span>
                                    <Popover>
                                        <PopoverTrigger>
                                            <Info className="w-3 h-3 cursor-pointer hover:text-foreground transition-colors" />
                                        </PopoverTrigger>
                                        <PopoverContent className="max-w-[200px] text-xs">
                                            예상 최종 명목 자산을 현재의 물가 기준으로 환산했을 때의 실제 구매력입니다. 설정하신 {inflation}%의 인플레이션으로 인해 미래의 돈은 현재보다 가치가 낮아집니다.
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <p className="text-lg font-semibold text-green-500">
                                    {currency === "KRW" ? "" : "$"}
                                    {formatCompactNumber(finalResult.totalAmount)}
                                    {currency === "KRW" ? "원" : ""}
                                </p>
                            </div>

                            {/* 2.2 Real Profit */}
                            <div className="p-3 rounded-lg bg-white/5 dark:bg-black/5 flex flex-col justify-between h-full">
                                <div className="flex items-center justify-center gap-1 mb-1 text-xs text-muted-foreground">
                                    <span>실질 수익</span>
                                    <Popover>
                                        <PopoverTrigger>
                                            <Info className="w-3 h-3 cursor-pointer hover:text-foreground transition-colors" />
                                        </PopoverTrigger>
                                        <PopoverContent className="max-w-[200px] text-xs">
                                            물가 상승분을 제외하고, 실제로 내 자산의 구매력이 얼마나 늘어났는지를 의미합니다. 겉으로 보이는 수익(명목 수익)에서 물가 상승분을 뺀 '진짜 수익'입니다.
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <p className={`text-lg font-semibold ${finalResult.interest >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {finalResult.interest >= 0 ? "+" : ""}
                                    {currency === "KRW" ? "" : "$"}
                                    {formatCompactNumber(finalResult.interest)}
                                    {currency === "KRW" ? "원" : ""}
                                </p>
                            </div>

                            {/* 2.3 Lifetime Monthly Salary */}
                            <div className="p-3 rounded-lg bg-white/5 dark:bg-black/5 flex flex-col justify-between h-full">
                                <div className="flex flex-col items-center justify-center mb-1 text-xs text-muted-foreground">
                                    <span>평생 실질 월급</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px]">(4% 법칙)</span>
                                        <Popover>
                                            <PopoverTrigger>
                                                <Info className="w-3 h-3 cursor-pointer hover:text-foreground transition-colors" />
                                            </PopoverTrigger>
                                            <PopoverContent className="max-w-[200px] text-xs">
                                                안전한 노후 자금 인출 전략인 '4% 법칙'을 적용한 월 수령액입니다. 실질 자산의 4%를 매년 인출해도 원금이 보존될 확률이 높다는 이론에 기반합니다.
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <p className="text-lg font-semibold text-green-500">
                                    {currency === "KRW" ? "" : "$"}
                                    {formatCompactNumber(Math.round(finalResult.totalAmount * 0.04 / 12))}
                                    {currency === "KRW" ? "원" : ""}
                                </p>
                            </div>
                        </div>

                        {/* Chart Section - Nominal Values */}
                        <div className="h-48 w-full mt-4">
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
                                        content={({ active, payload, label }) => {
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
                                                        <p className="mb-2 ml-1">{year}년 후</p>
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
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${nominalProfit >= 0 ? "bg-green-500" : "bg-red-500"}`} />
                                                                    <span className="text-muted-foreground">누적 명목 수익</span>
                                                                </div>
                                                                <span className="font-medium text-muted-foreground tabular-nums">
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
                                        stackId="1"
                                        stroke="#0EA5E9"
                                        fill="url(#colorTotal)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="totalInvested"
                                        stackId="2"
                                        stroke="#64748b"
                                        fill="url(#colorInvested)"
                                        strokeWidth={2}
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

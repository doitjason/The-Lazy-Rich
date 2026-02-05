"use client";

import { useState } from "react";
import FireChart from "@/components/charts/FireChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useFireCalculation, FireCalculationResult } from "@/hooks/useFireCalculation";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function FireCalculator() {
    const [currentAssets, setCurrentAssets] = useState("");
    const [monthlySaving, setMonthlySaving] = useState("");
    const [investmentYears, setInvestmentYears] = useState([10]);
    const [inflationRate, setInflationRate] = useState(3); // Default 3%
    const [returnRate, setReturnRate] = useState([7]); // Default 7%

    const { calculate } = useFireCalculation();
    const [fireResult, setFireResult] = useState<FireCalculationResult | null>(null);

    // Helper: Parse string with commas to number
    const parseNumber = (value: string) => {
        return Number(value.replace(/,/g, "")) || 0;
    };

    // Helper: Format number to string with commas
    const formatNumberInput = (value: string) => {
        // Remove non-digit chars
        const number = value.replace(/\D/g, "");
        if (!number) return "";
        return Number(number).toLocaleString();
    };

    const handleCalculate = () => {
        const result = calculate({
            currentAssets: parseNumber(currentAssets),
            monthlySaving: parseNumber(monthlySaving),
            investmentYears: investmentYears[0],
            annualReturnRate: returnRate[0],
            inflationRate: inflationRate
        });
        setFireResult(result);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (val: string) => void
    ) => {
        setter(formatNumberInput(e.target.value));
    };



    // Helper to format large numbers for Korea units (억, 만) with decimals
    // Helper to format large numbers for Korea units (억, 만) with decimals
    const formatKoreanMoney = (val: number) => {
        if (val >= 100000000) {
            const result = (val / 100000000).toFixed(1);
            return result.endsWith(".0") ? `${result.slice(0, -2)}억원` : `${result}억`;
        }
        if (val >= 10000) {
            return `${(val / 10000).toLocaleString()}만원`;
        }
        return val.toLocaleString();
    };

    return (
        <div className="space-y-6">
            <Card className="glass-card w-full max-w-2xl mx-auto border-0">
                <CardHeader>
                    <CardTitle className="text-2xl font-serif">자유 계산기</CardTitle>
                    <CardDescription>
                        현재 구매력을 기준으로 미래의 자산 가치를 확인하세요.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* 1. Current Assets */}
                    <div className="space-y-3">
                        <Label htmlFor="current-assets">현재 보유 자산 (₩)</Label>
                        <Input
                            id="current-assets"
                            type="text"
                            inputMode="numeric"
                            placeholder="예: 50,000,000"
                            value={currentAssets}
                            onChange={(e) => handleInputChange(e, setCurrentAssets)}
                        />
                        <div className="flex flex-wrap gap-2">
                            {[10_000_000, 50_000_000, 100_000_000, 500_000_000].map((val) => (
                                <Badge
                                    key={val}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary/20 px-3 py-1"
                                    onClick={() => setCurrentAssets(val.toLocaleString())}
                                >
                                    {formatKoreanMoney(val)}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* 2. Monthly Saving */}
                    <div className="space-y-3">
                        <Label htmlFor="monthly-saving">월 저축액 (₩)</Label>
                        <Input
                            id="monthly-saving"
                            type="text"
                            inputMode="numeric"
                            placeholder="예: 2,000,000"
                            value={monthlySaving}
                            onChange={(e) => handleInputChange(e, setMonthlySaving)}
                        />
                        <div className="flex flex-wrap gap-2">
                            {[500_000, 1_000_000, 2_000_000, 3_000_000].map((val) => (
                                <Badge
                                    key={val}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary/20 px-3 py-1"
                                    onClick={() => setMonthlySaving(val.toLocaleString())}
                                >
                                    {formatKoreanMoney(val)}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* 3. Inflation Rate */}
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>예상 물가 상승률</Label>
                            {/* Changed emphasis color to primary (blue) as requested */}
                            <span className="font-bold text-primary">{inflationRate}%</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[2, 3, 4, 5].map((rate) => (
                                <Button
                                    key={rate}
                                    variant={inflationRate === rate ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setInflationRate(rate)}
                                    // Use primary color logic instead of destructive
                                    className={cn("h-8 min-w-[3rem]", inflationRate === rate && "bg-primary hover:bg-primary/90 text-white")}
                                >
                                    {rate}%
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* 4. Investment Period */}
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>투자 기간 (년)</Label>
                            <span className="font-bold text-primary">{investmentYears[0]}년</span>
                        </div>
                        <Slider
                            value={investmentYears}
                            max={50}
                            min={1}
                            step={1}
                            onValueChange={setInvestmentYears}
                        />
                        <div className="flex flex-wrap gap-2">
                            {[1, 5, 10, 15, 20, 30].map((year) => (
                                <Badge
                                    key={year}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary/10 px-3 py-1"
                                    onClick={() => setInvestmentYears([year])}
                                >
                                    {year}년
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* 5. Return Rate */}
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>연평균 수익률</Label>
                            <span className="font-bold text-primary">{returnRate[0]}%</span>
                        </div>
                        <Slider
                            value={returnRate}
                            max={20}
                            min={1}
                            step={0.5}
                            onValueChange={setReturnRate}
                        />
                        <div className="flex flex-wrap gap-2">
                            {[
                                { val: 3, label: "정기 예금 (3%)" },
                                { val: 10, label: "S&P 500 (10%)" },
                                { val: 15, label: "NASDAQ 100 (15%)" }
                            ].map((item) => (
                                <Badge
                                    key={item.val}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary/10 px-3 py-1"
                                    onClick={() => setReturnRate([item.val])}
                                >
                                    {item.label}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 mt-4"
                        onClick={handleCalculate}
                    >
                        미래 가치 계산하기 🚀
                    </Button>
                </CardContent>
            </Card>

            {fireResult && (
                <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-700">
                    <Card className="glass-card w-full max-w-2xl mx-auto border-0">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-center">나의 경제적 미래</CardTitle>
                            <CardDescription className="text-center">
                                {investmentYears[0]}년 후 (물가 상승 반영)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {/* Row 1: Key Metrics */}
                            <div className="grid grid-cols-3 gap-2 text-center mb-2">
                                <div className="p-3 bg-primary/10 rounded-lg flex flex-col justify-center">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 line-clamp-1">명목 자산 (통장)</p>
                                    <p className="text-sm font-bold text-primary">
                                        {formatKoreanMoney(fireResult.finalNominalAssets)}
                                    </p>
                                </div>
                                <div className="p-3 bg-primary/10 rounded-lg flex flex-col justify-center">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 line-clamp-1">실질 자산 (가치)</p>
                                    <p className="text-sm font-bold text-primary">
                                        {formatKoreanMoney(fireResult.finalRealAssets)}
                                    </p>
                                </div>
                                <div className="p-3 bg-primary/10 rounded-lg flex flex-col justify-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider line-clamp-1">평생 실질 월급</p>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="text-[10px] text-primary hover:underline underline-offset-2 font-medium focus:outline-none">
                                                    (4% 룰)
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-3 text-xs">
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-primary">4% 룰이란?</h4>
                                                    <p className="text-muted-foreground leading-relaxed">
                                                        은퇴 자금의 4%를 매년 인출해도 원금이 줄어들지 않고 30년 이상 유지될 확률이 매우 높은 경제학적 법칙입니다.
                                                    </p>
                                                    <p className="text-muted-foreground leading-relaxed">
                                                        즉, 이 금액은 당신이 일을 하지 않아도 평생 받을 수 있는 <span className="font-semibold text-foreground">&apos;마르지 않는 월급&apos;</span>과 같습니다.
                                                    </p>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <p className="text-sm font-bold text-primary">
                                        {formatKoreanMoney(fireResult.monthlyPassiveIncome)}
                                    </p>
                                </div>
                            </div>

                            {/* Row 2: Detail Metrics */}
                            <div className="grid grid-cols-3 gap-2 text-center mb-6">
                                <div className="p-3 bg-primary/10 rounded-lg flex flex-col justify-center">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 line-clamp-1">총 납입 원금</p>
                                    <p className="text-sm font-bold text-primary">
                                        {formatKoreanMoney(fireResult.totalInvested)}
                                    </p>
                                </div>
                                <div className="p-3 bg-primary/10 rounded-lg flex flex-col justify-center">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 line-clamp-1">총 명목 수익</p>
                                    <p className="text-sm font-bold text-primary">
                                        +{formatKoreanMoney(fireResult.finalNominalAssets - fireResult.totalInvested)}
                                    </p>
                                </div>
                                <div className="p-3 bg-primary/10 rounded-lg flex flex-col justify-center">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 line-clamp-1">총 실질 수익</p>
                                    <p className="text-sm font-bold text-primary">
                                        +{formatKoreanMoney(fireResult.finalRealAssets - fireResult.totalInvested)}
                                    </p>
                                </div>
                            </div>

                            <FireChart
                                data={fireResult.data.map(d => ({
                                    year: d.year,
                                    invested: d.totalInvested,
                                    profit: d.nominalAssets - d.totalInvested
                                }))}
                                targetAmount={0}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

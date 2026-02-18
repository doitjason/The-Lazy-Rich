"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Gauge, TrendingUp, Info } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface ValuationCardProps {
    portfolioPer: number; // Weighted Average PER
    portfolioRoe: number; // Weighted Average ROE (Decimal, e.g. 0.15)
    roeCoverage: number; // Percentage of portfolio contributing to ROE
}

export function ValuationCard({ portfolioPer, portfolioRoe, roeCoverage }: ValuationCardProps) {

    // Market Average Reference
    const MARKET_PER = 24.5; // S&P 500 avg
    const MARKET_ROE = 15.0; // S&P 500 avg ~15-20% depending on cycle

    // Convert ROE to percent
    const roePercent = portfolioRoe * 100;

    // Status Logic for PER
    const perStatus = useMemo(() => {
        if (portfolioPer < 15) return { label: "저평가", color: "text-emerald-400", bg: "bg-emerald-500", desc: "매수 기회" };
        if (portfolioPer < 25) return { label: "적정", color: "text-sky-400", bg: "bg-sky-500", desc: "보유 관점" };
        if (portfolioPer < 35) return { label: "고평가", color: "text-orange-400", bg: "bg-orange-500", desc: "주의 구간" };
        return { label: "과열", color: "text-rose-400", bg: "bg-rose-500", desc: "위험 구간" };
    }, [portfolioPer]);

    // Status Logic for ROE
    const roeStatus = useMemo(() => {
        if (roePercent > 20) return { label: "탁월함 (S등급)", color: "text-emerald-400" };
        if (roePercent > 15) return { label: "우수함 (A등급)", color: "text-sky-400" };
        if (roePercent > 10) return { label: "보통 (B등급)", color: "text-yellow-400" };
        return { label: "미흡 (C등급)", color: "text-rose-400" };
    }, [roePercent]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "relative overflow-hidden rounded-2xl border backdrop-blur-md p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between group h-full",
                        "bg-white/40 dark:bg-black/20",
                        "border-sky-500/20 dark:border-sky-500/20"
                    )}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Gauge className="w-12 h-12" />
                    </div>

                    {/* Header */}
                    <div className="space-y-3 relative z-10 h-full flex flex-col justify-between">
                        {/* Section 1: Valuation (Price) */}
                        <div>
                            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mb-0.5">
                                가치평가 (PER)
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="text-lg font-black text-foreground leading-none">
                                    {portfolioPer.toFixed(1)} <span className="text-[9px] font-normal text-muted-foreground">배</span>
                                </div>
                                <div className={cn("text-xs font-bold px-2 py-0.5 rounded-full bg-white/5", perStatus.color)}>
                                    {perStatus.label}
                                </div>
                            </div>

                            {/* Simple Bar for P/E */}
                            <div className="h-1 w-full bg-secondary/50 rounded-full mt-1.5 overflow-hidden flex">
                                <div
                                    className={cn("h-full transition-all duration-500", perStatus.bg.replace("text-", "bg-"))}
                                    style={{ width: `${Math.min((portfolioPer / 40) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Section 2: Fundamentals (Quality) */}
                        <div className="pt-2 border-t border-sky-500/10">
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    기초체력 (ROE)
                                </span>
                                <span className={cn("text-[10px] font-bold", roeStatus.color)}>
                                    {roeCoverage > 20 ? roeStatus.label.split(' ')[0] : "데이터 부족"}
                                </span>
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="text-base font-black text-foreground leading-none">
                                    {roeCoverage > 20 ? roePercent.toFixed(1) : "N/A"} <span className="text-[9px] font-normal text-muted-foreground">%</span>
                                </div>
                                {roeCoverage > 20 && roePercent > MARKET_ROE && (
                                    <span className="text-emerald-400 font-bold text-[10px] flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-0.5" /> 상위
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverTrigger>

            <PopoverContent className="w-72 text-xs bg-black/90 border-white/10 backdrop-blur-xl text-white/90 p-4">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                            🔍 가치 & 펀더멘털 종합 진단
                        </h4>
                        <p className="opacity-70 leading-relaxed">
                            <strong>가격(PER)</strong>과 <strong>품질(ROE)</strong>을 동시에 고려하여 투자의 정당성을 점검합니다.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="bg-white/5 rounded-lg p-2.5">
                            <div className="font-bold text-sky-400 mb-1">1. 가치평가 (PER)</div>
                            <p className="opacity-80">
                                현재 주가가 기업 이익 대비 싼지 비싼지를 나타냅니다. (S&P 500 평균: {MARKET_PER}배)
                            </p>
                            <div className="mt-1 text-[10px] text-muted-foreground">
                                • {portfolioPer.toFixed(1)}배: {perStatus.desc} ({perStatus.label})
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-2.5">
                            <div className="font-bold text-emerald-400 mb-1">2. 기초체력 (ROE)</div>
                            <p className="opacity-80">
                                기업이 내 돈(자본)을 굴려 얼마나 효율적으로 이익을 내는지 보여줍니다. (시장 평균: {MARKET_ROE}%)
                            </p>
                            <div className="mt-1 text-[10px] text-muted-foreground">
                                • {roePercent.toFixed(1)}%: {roeStatus.label}
                            </div>
                            {roeCoverage < 90 && (
                                <div className="mt-1 text-[10px] text-rose-400">
                                    * 전체 자산의 {Math.round(roeCoverage)}%만 반영됨 (채권/원자재 제외)
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 opacity-70 italic text-[10px]">
                        "좋은 기업(High ROE)을 적당한 가격(Fair PER)에 사는 것이 위대한 투자입니다."
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

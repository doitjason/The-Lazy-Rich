"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getCommonMarketData } from "@/app/actions/portfolio-actions";
import { CommonMarketData } from "@/lib/market-types";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Info, Activity, ArrowUpDown, Gauge, Search, BarChart3, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KostolanyEgg } from "./KostolanyEgg";
import Link from "next/link";

export function MarketContext() {
    const [data, setData] = useState<CommonMarketData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDetail, setSelectedDetail] = useState<string | null>(null);

    useEffect(() => {
        // 1. Check sessionStorage cache first (instant render)
        const CACHE_KEY = "marketContextCacheV2"; // Versioned key for new data format
        const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours (since data is static for 24h)
        try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Date.now() < parsed.expiry) {
                    setData(parsed.data);
                    setLoading(false);
                    return;
                }
                sessionStorage.removeItem(CACHE_KEY);
            }
        } catch { /* ignore */ }

        // 2. Cache miss → fetch from new cached API route
        fetch("/api/insights/market-data")
            .then(res => res.ok ? res.json() : null)
            .then((res) => {
                if (res) {
                    setData(res);
                    try {
                        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                            data: res,
                            expiry: Date.now() + CACHE_TTL,
                        }));
                    } catch { /* sessionStorage full, ignore */ }
                }
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <Skeleton className="h-[500px] w-full rounded-2xl" />;
    }

    if (!data) return null;

    const { marketCondition, indices, macro } = data;

    const statusColors: Record<string, string> = {
        Bull: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        Bear: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        Neutral: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        Positive: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        Negative: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        Normal: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        Inverted: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        Flat: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        Stable: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        Volatile: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        Panic: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    };

    const statusLabels: Record<string, string> = {
        Bull: "상승 추세", Bear: "하락 추세", Neutral: "중립",
        Positive: "양호", Negative: "부정적",
        Normal: "정상", Inverted: "역전됨 (침체 경고)", Flat: "평탄화 (주의)",
        Stable: "안정", Volatile: "변동성 확대", Panic: "공포 (저가 매수 기회)",
        A1: "저점 형성", A2: "상승 기류", A3: "과열 광기",
        B1: "고점 신호", B2: "하락 추세", B3: "패닉 투매",
        // New Labels
        Warning: "주의 필요", Stress: "위험 확대",
        Accumulation: "매집 유입", Distribution: "매도 우위"
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <span className={cn(
            "text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider whitespace-nowrap w-fit transition-all duration-300 self-start mt-0.5",
            statusColors[status] || "text-gray-500 bg-gray-500/10 border-gray-500/20"
        )}>
            {statusLabels[status] || status}
        </span>
    );

    const indicatorDetails: Record<string, { title: string; icon: any; explanation: React.ReactNode; criteria: string[] }> = {
        snp500: {
            title: "장기 추세 (Price vs 200MA)",
            icon: TrendingUp,
            explanation: "S&P 500 지수가 200일 이동평균선(MA) 위에 있는지 여부는 시장의 장기적인 생사 여부를 결정짓는 '생명선' 중 하나로 볼 수 있습니다.",
            criteria: [
                "상승 추세(Bull): 주가가 200일선 대비 +5% 이상 상회하는 경우",
                "하락 추세(Bear): 주가가 200일선 대비 -5% 이하 하회하는 경우",
                "중립(Neutral): 200일선 부근에서 좁은 범위의 혼조세를 보이는 국면"
            ]
        },
        yieldSpread: {
            title: "경기 사이클 (장단기 금리차)",
            icon: ArrowUpDown,
            explanation: "10년물(장기)과 3개월물(단기) 금리의 차이는 미래 경제 성장에 대한 시장의 기대를 반영하는 지표로 활용됩니다. 역전 현상은 역사적으로 강력한 경기 침체 가능성을 시사해 왔습니다.",
            criteria: [
                "정상(Normal): 장기 금리가 단기보다 0.2%p 이상 높은 안정적인 상태",
                "평탄(Flat): 금리차가 좁혀지며 0.2%p ~ -0.1%p 범위에 위치한 상태",
                "역전(Inverted): 단기 금리가 더 높아져 -0.1%p 이하를 기록하는 상태"
            ]
        },
        realRate: {
            title: "통화 환경 (실질 금리)",
            icon: Info,
            explanation: "명목 금리에서 물가 상승분을 제외한 '화폐의 실제 가치'를 의미합니다. 실질 금리가 높게 형성되면 저축 유인이 커져 위험 자산에서 자금이 이탈할 가능성이 존재합니다.",
            criteria: [
                "부정적(Negative): 실질 금리가 2.0%를 초과하여 유동성이 위축되는 환경",
                "중립(Neutral): 실질 금리가 0.5% ~ 2.0% 사이의 적정 수준을 유지하는 환경",
                "양호(Positive): 실질 금리가 0.5% 미만으로 낮아 유동성이 공급되는 환경"
            ]
        },
        vix: {
            title: "시장 공포 (불안 지수)",
            icon: Gauge,
            explanation: (
                <>
                    투자자들이 가장 두려워하는 지표, 일명 <Link href="/columns/vix-fear-index" className="text-emerald-500 font-bold underline underline-offset-4 hover:text-emerald-600 transition-colors">'변동성 지수(Volatility Index)', 일명 VIX입니다.</Link> 향후 30일간 지수의 기대 변동성을 수치화한 것으로, 수치가 높을수록 시장의 공포가 극에 달했음을 시사합니다.
                </>
            ),
            criteria: [
                "안정(Stable): VIX 20 미만으로 상대적인 안도감이 형성된 구간",
                "변동성 확대(Volatile): VIX 20 ~ 30 사이로 불확실성이 존재하는 구간",
                "공포(Panic): VIX 30 초과로 투매 등 패닉 가능성이 높은 구간"
            ]
        },
        credit: {
            title: "신용 위험 (기업 부도 리스크)",
            icon: ShieldAlert,
            explanation: "하이일드 채권 지표는 상대적으로 신용도가 낮은 기업들의 자금 조달 여건을 투영합니다. 지표가 급락할 경우 기업들의 파산 위험이 증가하고 있음을 시사할 수 있습니다.",
            criteria: [
                "안정(Stable): HYG 가격 변동폭이 -0.7% 이내에서 조절되는 상태",
                "주의 필요(Warning): 가격이 -0.7% ~ -1.5% 하락하며 경계감이 발생하는 상태",
                "위험 확대(Stress): 가격이 -1.5% 이상 하락하여 자금 경색 우려가 높은 상태"
            ]
        },
        volume: {
            title: "거래 활성도 (자금 수급)",
            icon: BarChart3,
            explanation: "가격 변화에 거래량이 수반되는지의 여부는 해당 움직임의 신뢰도를 뒷받침하는 근거가 될 수 있습니다. 강한 거래량은 주요 자금의 매집 또는 이탈의 신호로 해석되기도 합니다.",
            criteria: [
                "매집 유입(Accumulation): 거래량이 10% 이상 증가하며 주가가 상승하는 흐름",
                "중립(Neutral): 거래량이 평균적이며 뚜렷한 방향성이 감지되지 않는 흐름",
                "매도 우위(Distribution): 거래량이 10% 이상 증가하며 주가가 하락하는 흐름"
            ]
        }
    };

    return (
        <div className="space-y-8">

            {/* Kostolany's Egg Section */}
            <div className="flex flex-col items-center gap-6 py-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="text-center space-y-2 mb-2 cursor-pointer group/egg touch-none">
                            <h3 className="text-lg font-black tracking-tight text-foreground/90 flex items-center justify-center gap-2 group-hover/egg:text-primary transition-colors">
                                🥚 코스톨라니의 달걀
                                <Info className="w-4 h-4 text-muted-foreground/40 group-hover/egg:text-primary/70" />
                            </h3>
                            <p className="text-[13px] text-muted-foreground/70 font-medium whitespace-nowrap">
                                금리와 심리 지표를 기반으로 추정한 시장의 순환 단계일 수 있습니다
                            </p>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent
                        side="top"
                        align="center"
                        sideOffset={10}
                        className="w-[300px] p-6 rounded-[2rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-black/5 dark:border-white/10 shadow-2xl z-[100]"
                    >
                        <div className="space-y-3">
                            <h4 className="font-black text-primary flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                코스톨라니의 달걀이란?
                            </h4>
                            <p className="text-sm leading-relaxed font-medium text-foreground/80 break-keep">
                                전설적인 투자자 <span className="font-bold">앙드레 코스톨라니</span>가 제안한 투자 심리 사이클입니다.
                            </p>
                            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10">
                                <p className="text-[13px] leading-relaxed font-semibold text-muted-foreground break-keep">
                                    금리와 투자자 심리에 따른 <span className="text-foreground">순환 단계</span>를 나타내며, 대중이 비관적일 때(B3) 매수하고 광기에 휩싸였을 때(A3) 매도하는 <span className="text-primary font-bold">역발상 투자의 정수</span>를 보여줍니다.
                                </p>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
                <KostolanyEgg
                    currentPhase={marketCondition.kostolanyPhase}
                    interestRateTrend={marketCondition.interestRateTrend}
                />
                <div className="max-w-[400px] text-center">
                    <p className="text-sm text-muted-foreground/60 leading-relaxed font-medium break-keep">
                        상승 사이클(A)은 대세 상승과 과열을 시사할 수 있으며,
                        하락 사이클(B)은 하락세와 패닉 가능성이 존재할 수 있습니다.
                        현재 지표상으로는 <span className="text-foreground font-bold underline underline-offset-4">{statusLabels[marketCondition.kostolanyPhase] || "분석 중"}</span> 국면으로 해석될 여지가 있습니다.
                    </p>
                </div>
            </div>

            {/* Dashboard Section */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-black tracking-tight text-foreground/90 flex items-center gap-2">
                        <Search className="w-5 h-5 text-emerald-500" />
                        시장 상황 판독 지표
                    </h3>
                    <div className="text-[11px] font-black text-emerald-500/60 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Daily Market Summary
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Helper to get theme class based on status */}
                    {(() => {
                        const getTheme = (status: string) => {
                            if (statusColors[status]?.includes("emerald")) return {
                                text: "text-emerald-700 dark:text-emerald-400",
                                bg: "bg-emerald-500/5 border-emerald-500/10",
                                dot: "bg-emerald-500",
                                meta: "text-emerald-600/60 dark:text-emerald-400/60",
                                icon: "text-emerald-500"
                            };
                            if (statusColors[status]?.includes("rose")) return {
                                text: "text-rose-700 dark:text-rose-400",
                                bg: "bg-rose-500/5 border-rose-500/10",
                                dot: "bg-rose-500",
                                meta: "text-rose-600/60 dark:text-rose-400/60",
                                icon: "text-rose-500"
                            };
                            return {
                                text: "text-amber-700 dark:text-amber-400",
                                bg: "bg-amber-500/5 border-amber-500/10",
                                dot: "bg-amber-500",
                                meta: "text-amber-600/60 dark:text-amber-400/60",
                                icon: "text-amber-500"
                            };
                        };

                        const snpTheme = getTheme(marketCondition.snp500Trend);
                        const yieldTheme = getTheme(marketCondition.yieldSpreadStatus);
                        const realRateTheme = getTheme(marketCondition.realRateStatus);
                        const vixTheme = getTheme(marketCondition.vixStatus);
                        const creditTheme = getTheme(marketCondition.creditSpreadStatus);
                        const volumeTheme = getTheme(marketCondition.volumeTrend);

                        return (
                            <>
                                {/* 1. S&P 500 Trend */}
                                <Card
                                    onClick={() => setSelectedDetail("snp500")}
                                    className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/30 dark:border-white/10 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                                >
                                    <CardHeader className="px-4 pt-4 pb-0 flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                            <TrendingUp className={cn("w-3.5 h-3.5", snpTheme.icon)} />
                                            장기 추세
                                        </CardTitle>
                                        <StatusBadge status={marketCondition.snp500Trend} />
                                    </CardHeader>
                                    <CardContent className="px-4 pt-2 pb-4">
                                        <div className="flex flex-col gap-0.5 mb-2 min-h-[52px] justify-center">
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest whitespace-nowrap", snpTheme.meta)}>S&P 500 vs 200MA</span>
                                            <div className="flex items-baseline gap-1.5 flex-nowrap">
                                                <span className={cn("text-xl font-black tracking-tighter tabular-nums whitespace-nowrap", snpTheme.text)}>
                                                    {(macro.snp500DistanceMA200 ?? 0) >= 0 ? "+" : ""}{macro.snp500DistanceMA200?.toFixed(2) ?? "N/A"}%
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground/50 whitespace-nowrap shrink-0">
                                                    ({indices?.snp500?.price?.toLocaleString() ?? "N/A"})
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn("flex items-center gap-1.5 mt-2 p-1.5 rounded-xl border", snpTheme.bg)}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", snpTheme.dot, marketCondition.snp500Trend === "Bull" && "animate-pulse")} />
                                            <span className={cn("text-[10px] font-bold break-keep leading-tight", snpTheme.text)}>
                                                {marketCondition.snp500Trend === "Bull" ? "기조적 상승 장세 지속" : "하방 압력 및 추세 이탈 경계"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 2. Yield Spread */}
                                <Card
                                    onClick={() => setSelectedDetail("yieldSpread")}
                                    className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/30 dark:border-white/10 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                                >
                                    <CardHeader className="px-4 pt-4 pb-0 flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                            <ArrowUpDown className={cn("w-3.5 h-3.5", yieldTheme.icon)} />
                                            경기 사이클
                                        </CardTitle>
                                        <StatusBadge status={marketCondition.yieldSpreadStatus} />
                                    </CardHeader>
                                    <CardContent className="px-4 pt-2 pb-4">
                                        <div className="flex flex-col gap-0.5 mb-2 min-h-[52px] justify-center">
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest whitespace-nowrap", yieldTheme.meta)}>Yield Spread (10Y-3M)</span>
                                            <div className="flex items-baseline gap-2 flex-nowrap">
                                                <span className={cn("text-xl font-black tracking-tighter tabular-nums whitespace-nowrap", yieldTheme.text)}>
                                                    {macro.yieldSpread10Y3M?.toFixed(2) ?? "N/A"}
                                                    <span className="text-base font-bold ml-0.5">%p</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn("flex items-center gap-1.5 mt-2 p-1.5 rounded-xl border", yieldTheme.bg)}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", yieldTheme.dot, marketCondition.yieldSpreadStatus === "Inverted" && "animate-pulse")} />
                                            <span className={cn("text-[10px] font-bold break-keep leading-tight", yieldTheme.text)}>
                                                {marketCondition.yieldSpreadStatus === "Inverted" ? "장단기 금리 역전: 침체 경보" : "장단기 금리차 정상 범위"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 3. Real Rate */}
                                <Card
                                    onClick={() => setSelectedDetail("realRate")}
                                    className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/30 dark:border-white/10 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                                >
                                    <CardHeader className="px-4 pt-4 pb-0 flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                            <Info className={cn("w-3.5 h-3.5", realRateTheme.icon)} />
                                            통화 환경
                                        </CardTitle>
                                        <StatusBadge status={marketCondition.realRateStatus} />
                                    </CardHeader>
                                    <CardContent className="px-4 pt-2 pb-4">
                                        <div className="flex flex-col gap-0.5 mb-2 min-h-[52px] justify-center">
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest whitespace-nowrap", realRateTheme.meta)}>Real Rate (Nominal - {macro.expectedInflation}%)</span>
                                            <div className="flex items-baseline gap-2 flex-nowrap">
                                                <span className={cn("text-xl font-black tracking-tighter tabular-nums whitespace-nowrap", realRateTheme.text)}>
                                                    {(macro.realRate ?? 0).toFixed(2)}
                                                    <span className="text-base font-bold ml-0.5">%</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn("flex items-center gap-1.5 mt-2 p-1.5 rounded-xl border", realRateTheme.bg)}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", realRateTheme.dot, marketCondition.realRateStatus === "Positive" && "animate-pulse")} />
                                            <span className={cn("text-[10px] font-bold break-keep leading-tight", realRateTheme.text)}>
                                                {marketCondition.realRateStatus === "Positive" ? "중립 이상의 긴축적 통화 환경" : "비교적 낮은 실질 금리 환경"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 4. VIX */}
                                <Card
                                    onClick={() => setSelectedDetail("vix")}
                                    className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/30 dark:border-white/10 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                                >
                                    <CardHeader className="px-4 pt-4 pb-0 flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                            <Gauge className={cn("w-3.5 h-3.5", vixTheme.icon)} />
                                            시장 공포
                                        </CardTitle>
                                        <StatusBadge status={marketCondition.vixStatus} />
                                    </CardHeader>
                                    <CardContent className="px-4 pt-2 pb-4">
                                        <div className="flex flex-col gap-0.5 mb-2 min-h-[52px] justify-center">
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest whitespace-nowrap", vixTheme.meta)}>Volatility Index (VIX)</span>
                                            <div className="flex items-baseline gap-1.5 flex-nowrap">
                                                <span className={cn("text-xl font-black tracking-tighter tabular-nums whitespace-nowrap", vixTheme.text)}>
                                                    {(macro.vix ?? 0).toFixed(2)}
                                                </span>
                                                {macro.vixDistanceMA50 !== null && (
                                                    <span className={cn(
                                                        "text-[10px] font-bold tracking-tight opacity-80 whitespace-nowrap shrink-0",
                                                        vixTheme.text
                                                    )}>
                                                        {macro.vixDistanceMA50 >= 0 ? "▲" : "▼"}{Math.abs(macro.vixDistanceMA50).toFixed(1)}% (50MA)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={cn("flex items-center gap-1.5 mt-2 p-1.5 rounded-xl border", vixTheme.bg)}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", vixTheme.dot, marketCondition.vixStatus === "Panic" && "animate-pulse")} />
                                            <span className={cn("text-[10px] font-bold break-keep leading-tight", vixTheme.text)}>
                                                {marketCondition.vixStatus === "Panic" ? "투심 위축 및 변동성 확대" : "시장 안정 심리 우세 가능성"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 5. Credit Risk (High Yield Spread Proxy) */}
                                <Card
                                    onClick={() => setSelectedDetail("credit")}
                                    className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/30 dark:border-white/10 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                                >
                                    <CardHeader className="px-4 pt-4 pb-0 flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                            <ShieldAlert className={cn("w-3.5 h-3.5", creditTheme.icon)} />
                                            신용 위험
                                        </CardTitle>
                                        <StatusBadge status={marketCondition.creditSpreadStatus} />
                                    </CardHeader>
                                    <CardContent className="px-4 pt-2 pb-4">
                                        <div className="flex flex-col gap-0.5 mb-2 min-h-[52px] justify-center">
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest whitespace-nowrap", creditTheme.meta)}>HYG vs 200MA</span>
                                            <div className="flex items-baseline gap-1.5 flex-nowrap">
                                                <span className={cn("text-xl font-black tracking-tighter tabular-nums whitespace-nowrap", creditTheme.text)}>
                                                    {(macro.hygDistanceMA200 ?? 0) >= 0 ? "+" : ""}{macro.hygDistanceMA200?.toFixed(2) ?? "N/A"}%
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground/50 whitespace-nowrap shrink-0">
                                                    (${macro.hygPrice?.toFixed(1) ?? "N/A"})
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn("flex items-center gap-1.5 mt-2 p-1.5 rounded-xl border", creditTheme.bg)}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", creditTheme.dot, marketCondition.creditSpreadStatus === "Stress" && "animate-pulse")} />
                                            <span className={cn("text-[10px] font-bold break-keep leading-tight", creditTheme.text)}>
                                                {marketCondition.creditSpreadStatus === "Stress" ? "신용 시장 자금 경색 가능성" : "안정적인 기업 자금 조달 환경"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 6. Volume Activity */}
                                <Card
                                    onClick={() => setSelectedDetail("volume")}
                                    className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/30 dark:border-white/10 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                                >
                                    <CardHeader className="px-4 pt-4 pb-0 flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                            <BarChart3 className={cn("w-3.5 h-3.5", volumeTheme.icon)} />
                                            거래 활성도
                                        </CardTitle>
                                        <StatusBadge status={marketCondition.volumeTrend} />
                                    </CardHeader>
                                    <CardContent className="px-4 pt-2 pb-4">
                                        <div className="flex flex-col gap-0.5 mb-2 min-h-[52px] justify-center">
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest whitespace-nowrap", volumeTheme.meta)}>Volume vs Avg (3M)</span>
                                            <div className="flex items-baseline gap-1.5 flex-nowrap">
                                                <span className={cn("text-xl font-black tracking-tighter tabular-nums whitespace-nowrap", volumeTheme.text)}>
                                                    {macro.snp500Volume ? `${(macro.snp500Volume / 1000000).toFixed(0)}M` : "N/A"}
                                                </span>
                                                {macro.snp500Volume && macro.snp500AvgVolume ? (
                                                    <span className="text-[10px] font-black tracking-tight text-muted-foreground/70 whitespace-nowrap shrink-0">
                                                        ({((macro.snp500Volume / macro.snp500AvgVolume) * 100).toFixed(0)}%)
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className={cn("flex items-center gap-1.5 mt-2 p-1.5 rounded-xl border", volumeTheme.bg)}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", volumeTheme.dot, (marketCondition.volumeTrend === "Accumulation" || marketCondition.volumeTrend === "Distribution") && "animate-pulse")} />
                                            <span className={cn("text-[10px] font-bold break-keep leading-tight", volumeTheme.text)}>
                                                {marketCondition.volumeTrend === "Accumulation" ? "매수세 유입 및 매집 가능성" : marketCondition.volumeTrend === "Distribution" ? "매도 압력 및 차익 실현 주의" : "관망세 및 수급 균형 구간"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        );
                    })()}
                </div>

                <Dialog open={!!selectedDetail} onOpenChange={(open) => !open && setSelectedDetail(null)}>
                    <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[440px] max-h-[90vh] rounded-[2.5rem] sm:rounded-[2rem] border-white/10 dark:bg-black/90 backdrop-blur-3xl p-0 outline-none shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-50" />

                        {selectedDetail && indicatorDetails[selectedDetail] && (
                            <ScrollArea className="max-h-[90vh] w-full">
                                <div className="space-y-6 p-6 sm:p-8">
                                    <DialogHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                                {(() => {
                                                    const Icon = indicatorDetails[selectedDetail].icon;
                                                    return <Icon className="w-5 h-5 text-emerald-500" />;
                                                })()}
                                            </div>
                                            <DialogTitle className="text-xl font-black tracking-tight">{indicatorDetails[selectedDetail].title}</DialogTitle>
                                        </div>
                                        <DialogDescription className="text-[14px] leading-relaxed font-medium break-keep text-muted-foreground/80">
                                            {indicatorDetails[selectedDetail].explanation}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                        {/* Real-time Analysis Result */}
                                        {(() => {
                                            const getStatus = () => {
                                                if (selectedDetail === "snp500") return marketCondition.snp500Trend;
                                                if (selectedDetail === "yieldSpread") return marketCondition.yieldSpreadStatus;
                                                if (selectedDetail === "realRate") return marketCondition.realRateStatus;
                                                if (selectedDetail === "vix") return marketCondition.vixStatus;
                                                if (selectedDetail === "credit") return marketCondition.creditSpreadStatus;
                                                if (selectedDetail === "volume") return marketCondition.volumeTrend;
                                                return "Neutral";
                                            };
                                            const currentStatus = getStatus();
                                            const isEmerald = statusColors[currentStatus]?.includes("emerald");
                                            const isRose = statusColors[currentStatus]?.includes("rose");

                                            const themeClass = isEmerald
                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                : isRose
                                                    ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                                                    : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400";

                                            return (
                                                <div className={cn("p-6 rounded-[2rem] border space-y-3 relative overflow-hidden group", themeClass.split(' ').slice(0, 2).join(' '))}>
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                                        <Activity className={cn("w-12 h-12", themeClass.split(' ').slice(-1)[0])} />
                                                    </div>
                                                    <h4 className={cn("text-[11px] font-black uppercase tracking-widest flex items-center gap-2", themeClass.split(' ').slice(-1)[0])}>
                                                        <Gauge className="w-3 h-3" />
                                                        현재 국면 집중 분석
                                                    </h4>
                                                    <p className="text-[15px] font-medium text-foreground/90 leading-relaxed break-keep">
                                                        {selectedDetail === "snp500" && (
                                                            `현재 S&P 500 지수가 200일 이동평균선 대비 ${macro.snp500DistanceMA200?.toFixed(2) ?? 'N/A'}% ${(macro.snp500DistanceMA200 ?? 0) >= 0 ? '상단' : '하단'}에 위치한 것으로 관측됩니다. 이는 시장의 장기적인 에너지가 ${marketCondition.snp500Trend === 'Bull' ? '유지되고 있음' : '다소 약화되었음'}을 시사하는 '${statusLabels[marketCondition.snp500Trend] || marketCondition.snp500Trend}' 국면으로 해석될 수 있습니다.`
                                                        )}
                                                        {selectedDetail === "yieldSpread" && (
                                                            `장단기 금리차(10Y-3M)가 ${macro.yieldSpread10Y3M?.toFixed(2) ?? 'N/A'}%p 수준을 기록하고 있습니다. ${(macro.yieldSpread10Y3M ?? 0) < 0 ? '수치가 마이너스 영역에 머물며 경기에 대한 주의가 필요한' : '스프레드가 양의 값을 유지하며 경기가 완만한 흐름을 보이는'} '${statusLabels[marketCondition.yieldSpreadStatus] || marketCondition.yieldSpreadStatus}' 상태로 풀이됩니다.`
                                                        )}
                                                        {selectedDetail === "realRate" && (
                                                            `실질 금리가 ${(macro.realRate ?? 0).toFixed(2)}% 수준으로 산출되었습니다. 물가 상승률을 고려한 화폐의 실질 가치가 ${(macro.realRate ?? 0) > 2 ? '상당히 높아 유동성 위축 가능성이 존재하는' : '상대적으로 낮아 자산 시장에 우호적일 수 있는'} '${statusLabels[marketCondition.realRateStatus] || marketCondition.realRateStatus}' 환경으로 판단됩니다.`
                                                        )}
                                                        {selectedDetail === "vix" && (
                                                            `변동성 지수(VIX)가 ${(macro.vix ?? 0).toFixed(2)} 포인트 부근에서 움직이고 있습니다. 이는 전일 대비 ${Math.abs(macro.vixChangePercent ?? 0).toFixed(2)}% ${(macro.vixChangePercent ?? 0) >= 0 ? '상승하며 공포 심리가 확산되는' : '하락하며 투자 심리가 진정되어가는'} 추세입니다. 특히 50일 평균 대비 ${Math.abs(macro.vixDistanceMA50 ?? 0).toFixed(1)}% ${(macro.vixDistanceMA50 ?? 0) >= 0 ? '상회하고 있어, 시장의 변동성 체급 자체가 전반적으로 높아진(High Volatility Regime)' : '하회하고 있어, 여전히 구조적인 안정권에 머물러 있는'} 상태로 해석할 수 있습니다.`
                                                        )}
                                                        {selectedDetail === "credit" && (
                                                            `하이일드(HYG) 지표가 200일선 대비 ${macro.hygDistanceMA200?.toFixed(2) ?? 'N/A'}% 수준에 위치하며, 기업들의 자금 조달 여건이 '${statusLabels[marketCondition.creditSpreadStatus] || marketCondition.creditSpreadStatus}'한 것으로 분석됩니다. 이는 ${marketCondition.creditSpreadStatus === 'Stable' ? '상대적인 부도 위험이 낮아 시장의 하방 경직성이 확보됨' : '잠재적인 신용 경색 위험을 주시할 필요가 있음'}을 시사할 수 있습니다.`
                                                        )}
                                                        {selectedDetail === "volume" && (
                                                            `3개월 평균 대비 현재 거래량이 약 ${macro.snp500Volume && macro.snp500AvgVolume ? ((macro.snp500Volume / macro.snp500AvgVolume) * 100).toFixed(0) : 'N/A'}% 수준을 기록 중인 것으로 파악됩니다. 이는 현재의 가격 흐름에 ${marketCondition.volumeTrend === 'Accumulation' ? '매수세가 유입되며 신뢰도가 더해지는' : '관망세가 짙어져 힘이 분산되는'} '${statusLabels[marketCondition.volumeTrend] || marketCondition.volumeTrend}' 단계로 조심스럽게 예측해 볼 수 있습니다.`
                                                        )}
                                                    </p>
                                                </div>
                                            );
                                        })()}

                                        {/* Decision Criteria */}
                                        <div className="p-6 rounded-[2rem] bg-slate-500/5 border border-slate-500/10 space-y-4">
                                            <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                <Search className="w-3 h-3" />
                                                판독 시스템 기준
                                            </h4>
                                            <ul className="space-y-3">
                                                {indicatorDetails[selectedDetail].criteria.map((c, i) => (
                                                    <li key={i} className="text-sm font-medium flex items-start gap-3 group/item">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 mt-1.5 shrink-0 group-hover/item:bg-emerald-500 transition-colors" />
                                                        <span className="text-muted-foreground leading-snug">{c}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        )}
                    </DialogContent>
                </Dialog>

                <div className="text-[12px] text-muted-foreground/40 text-center pt-8 border-t border-dashed border-white/10 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    * The Lazy Rich AI는 1일 1회 업데이트되는 데일리 지표를 종합 분석합니다. 최종 투자 결정은 본인의 판단하에 이루어져야 합니다.
                </div>
            </div>
        </div>
    );
}

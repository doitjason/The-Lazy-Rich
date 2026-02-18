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
import { KostolanyEgg } from "./KostolanyEgg";

export function MarketContext() {
    const [data, setData] = useState<CommonMarketData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDetail, setSelectedDetail] = useState<string | null>(null);

    useEffect(() => {
        getCommonMarketData().then((res) => {
            if (res) setData(res);
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

    const indicatorDetails: Record<string, { title: string; icon: any; explanation: string; criteria: string[] }> = {
        snp500: {
            title: "장기 추세 (Price vs 200MA)",
            icon: TrendingUp,
            explanation: "S&P 500 지수가 200일 이동평균선(MA) 위에 있는지 여부는 시장의 장기적인 생사 여부를 결정짓는 '생명선'으로 여겨집니다.",
            criteria: [
                "강세(Bull): 주가가 200일선 대비 +5% 이상 상회",
                "약세(Bear): 주가가 200일선 대비 -5% 이하 하회",
                "중립(Neutral): 200일선 부근에서 혼조세"
            ]
        },
        yieldSpread: {
            title: "경기 사이클 (장단기 금리차)",
            icon: ArrowUpDown,
            explanation: "10년물(장기)과 3개월물(단기) 금리의 차이는 미래 경제 성장에 대한 시장의 기대를 반영합니다. 역전 현상은 역사적으로 강력한 경기 침체 신호였습니다.",
            criteria: [
                "정상(Normal): 장기 금리가 단기보다 0.2%p 이상 높음",
                "평탄(Flat): 금리차가 좁혀짐 (0.2%p ~ -0.1%p)",
                "역전(Inverted): 단기 금리가 더 높음 (-0.1%p 이하)"
            ]
        },
        realRate: {
            title: "통화 환경 (실질 금리)",
            icon: Info,
            explanation: "명목 금리에서 물가 상승분을 제외한 '진짜 돈의 가격'입니다. 실질 금리가 높으면 저축의 유인이 커져 주식 시장의 자금이 유출될 수 있습니다.",
            criteria: [
                "긴축(Positive): 실질 금리 2.0% 초과 (유동성 위축)",
                "중립(Neutral): 실질 금리 0.5% ~ 2.0%",
                "완화(Negative): 실질 금리 0.5% 미만 (유동성 공급)"
            ]
        },
        vix: {
            title: "시장 공포 (불안 지수)",
            icon: Gauge,
            explanation: "VIX 지수는 향후 30일간 지수의 기대 변동성을 의미합니다. 수치가 높을수록 시장 참여자들의 불안감이 극에 달해 있음을 뜻합니다.",
            criteria: [
                "안정(Stable): VIX 20 미만 (안도 랠리 가능성)",
                "경계(Volatile): VIX 20 ~ 30 (불확실성 확대)",
                "공포(Panic): VIX 30 초과 (투매 및 패닉 구간)"
            ]
        },
        credit: {
            title: "신용 위험 (기업 부도 리스크)",
            icon: ShieldAlert,
            explanation: "하이일드 채권(HYG)은 부실 기업들의 자금 조달 상태를 보여주는 거울입니다. 채권 가격이 급락하면 기업들의 파산 위험이 커지고 있음을 시사합니다.",
            criteria: [
                "안정(Stable): HYG 가격 변동폭이 -0.7% 이내 유지",
                "주의(Warning): 가격이 -0.7% ~ -1.5% 하락",
                "위험(Stress): 가격이 -1.5% 이상 급락 (자금 경색)"
            ]
        },
        volume: {
            title: "거래 활성도 (자금 수급)",
            icon: BarChart3,
            explanation: "가격 변화에 거래량이 동반되는지는 그 움직임의 신뢰도를 결정합니다. 강한 거래량은 기관 등 거대 자금의 매집 또는 이탈을 의미합니다.",
            criteria: [
                "매집(Accumulation): 거래량 10% 이상 증가 + 주가 상승",
                "분산(Distribution): 거래량 10% 이상 증가 + 주가 하락",
                "중립(Neutral): 거래량이 평균 수준이거나 혼조세"
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
                        <Search className="w-5 h-5 text-indigo-500" />
                        시장 상황 판독 지표
                    </h3>
                    <div className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-widest bg-secondary/30 px-2 py-0.5 rounded-full">
                        Live Data Feed
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. S&P 500 Trend */}
                    <Card
                        onClick={() => setSelectedDetail("snp500")}
                        className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                    >
                        <CardHeader className="px-4 pt-3 pb-0 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                장기 추세
                            </CardTitle>
                            <StatusBadge status={marketCondition.snp500Trend} />
                        </CardHeader>
                        <CardContent className="px-4 pt-1 pb-3">
                            <div className="flex flex-col gap-0.5 mb-1">
                                <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest">S&P 500 vs 200MA</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black tracking-tighter tabular-nums text-foreground whitespace-nowrap">
                                        {(macro.snp500DistanceMA200 ?? 0) >= 0 ? "+" : ""}{macro.snp500DistanceMA200?.toFixed(2) ?? "N/A"}%
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground/50">
                                        ({indices.snp500.price.toLocaleString()})
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1 h-1 rounded-full bg-indigo-500" />
                                <span className="text-[11px] font-bold text-muted-foreground/80 break-keep">
                                    {marketCondition.snp500Trend === "Bull" ? "기조적 상승 장세 지속" : "하방 압력 및 추세 이탈 경계"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Yield Spread */}
                    <Card
                        onClick={() => setSelectedDetail("yieldSpread")}
                        className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                    >
                        <CardHeader className="px-4 pt-3 pb-0 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                <ArrowUpDown className="w-3 h-3 text-blue-500" />
                                경기 사이클
                            </CardTitle>
                            <StatusBadge status={marketCondition.yieldSpreadStatus} />
                        </CardHeader>
                        <CardContent className="px-4 pt-1 pb-3">
                            <div className="flex flex-col gap-0.5 mb-1">
                                <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest">Yield Spread (10Y-3M)</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black tracking-tighter tabular-nums text-foreground whitespace-nowrap">
                                        {macro.yieldSpread10Y3M?.toFixed(2) ?? "N/A"}
                                        <span className="text-base font-bold ml-0.5">%p</span>
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <span className="text-[11px] font-bold text-muted-foreground/80 break-keep">
                                    {marketCondition.yieldSpreadStatus === "Inverted" ? "장단기 금리 역전: 침체 경보" : "장단기 금리차 정상 범위"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Real Rate */}
                    <Card
                        onClick={() => setSelectedDetail("realRate")}
                        className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                    >
                        <CardHeader className="px-4 pt-3 pb-0 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                <Info className="w-3 h-3 text-amber-500" />
                                통화 환경
                            </CardTitle>
                            <StatusBadge status={marketCondition.realRateStatus} />
                        </CardHeader>
                        <CardContent className="px-4 pt-1 pb-3">
                            <div className="flex flex-col gap-0.5 mb-1">
                                <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest">Real Rate (Nominal - {macro.expectedInflation}%)</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black tracking-tighter tabular-nums text-foreground whitespace-nowrap">
                                        {macro.realRate.toFixed(2)}
                                        <span className="text-base font-bold ml-0.5">%</span>
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1 h-1 rounded-full bg-amber-500" />
                                <span className="text-[11px] font-bold text-muted-foreground/80 break-keep">
                                    {marketCondition.realRateStatus === "Positive" ? "중립 이상의 긴축적 통화 환경" : "비교적 낮은 실질 금리 환경"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. VIX */}
                    <Card
                        onClick={() => setSelectedDetail("vix")}
                        className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                    >
                        <CardHeader className="px-4 pt-3 pb-0 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                <Gauge className="w-3 h-3 text-purple-500" />
                                시장 공포
                            </CardTitle>
                            <StatusBadge status={marketCondition.vixStatus} />
                        </CardHeader>
                        <CardContent className="px-4 pt-1 pb-3">
                            <div className="flex flex-col gap-0.5 mb-1">
                                <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest">Volatility Index (VIX)</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black tracking-tighter tabular-nums text-foreground whitespace-nowrap">
                                        {macro.vix.toFixed(2)}
                                    </span>
                                    <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full border tracking-tighter", macro.vix > 25 ? "text-rose-500 border-rose-500/20 bg-rose-500/10" : "text-emerald-500 border-emerald-500/20 bg-emerald-500/10")}>
                                        {macro.vix > 25 ? "PANIC" : "STABLE"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1 h-1 rounded-full bg-purple-500" />
                                <span className="text-[11px] font-bold text-muted-foreground/80 break-keep">
                                    {marketCondition.vixStatus === "Panic" ? "투심 위축 및 변동성 확대" : "시장 안정 심리 우세 가능성"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 5. Credit Risk (High Yield Spread Proxy) */}
                    <Card
                        onClick={() => setSelectedDetail("credit")}
                        className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                    >
                        <CardHeader className="px-4 pt-3 pb-0 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                <ShieldAlert className="w-3 h-3 text-rose-500" />
                                신용 위험
                            </CardTitle>
                            <StatusBadge status={marketCondition.creditSpreadStatus} />
                        </CardHeader>
                        <CardContent className="px-4 pt-1 pb-3">
                            <div className="flex flex-col gap-0.5 mb-1">
                                <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest">HYG vs 200MA (Credit Spread Proxy)</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black tracking-tighter tabular-nums text-foreground whitespace-nowrap">
                                        {(macro.hygDistanceMA200 ?? 0) >= 0 ? "+" : ""}{macro.hygDistanceMA200?.toFixed(2) ?? "N/A"}%
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground/50">
                                        (${macro.hygPrice?.toFixed(1) ?? "N/A"})
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1 h-1 rounded-full bg-rose-500" />
                                <span className="text-[11px] font-bold text-muted-foreground/80 break-keep">
                                    {marketCondition.creditSpreadStatus === "Stress" ? "신용 시장 자금 경색 가능성" : "안정적인 기업 자금 조달 환경"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 6. Volume Activity */}
                    <Card
                        onClick={() => setSelectedDetail("volume")}
                        className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-500"
                    >
                        <CardHeader className="px-4 pt-3 pb-0 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[13px] font-black text-muted-foreground uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                                <BarChart3 className="w-3 h-3 text-blue-500" />
                                거래 활성도
                            </CardTitle>
                            <StatusBadge status={marketCondition.volumeTrend} />
                        </CardHeader>
                        <CardContent className="px-4 pt-1 pb-3">
                            <div className="flex flex-col gap-0.5 mb-1">
                                <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest">Volume vs Avg (3M)</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black tracking-tighter tabular-nums text-foreground whitespace-nowrap">
                                        {macro.snp500Volume ? `${(macro.snp500Volume / 1000000).toFixed(0)}M` : "N/A"}
                                    </span>
                                    {macro.snp500Volume && macro.snp500AvgVolume ? (
                                        <span className="text-[10px] font-black tracking-tight text-muted-foreground/70">
                                            ({((macro.snp500Volume / macro.snp500AvgVolume) * 100).toFixed(0)}%)
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <span className="text-[11px] font-bold text-muted-foreground/80 break-keep">
                                    {marketCondition.volumeTrend === "Accumulation" ? "매수세 유입 및 매집 가능성" : marketCondition.volumeTrend === "Distribution" ? "매도 압력 및 차익 실현 주의" : "관망세 및 수급 균형 구간"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Indicator Detail Dialog */}
                <Dialog open={!!selectedDetail} onOpenChange={(open) => !open && setSelectedDetail(null)}>
                    <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[440px] rounded-[2rem] border-white/10 dark:bg-black/80 backdrop-blur-3xl p-8 outline-none">
                        {selectedDetail && indicatorDetails[selectedDetail] && (
                            <div className="space-y-6">
                                <DialogHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2.5 rounded-2xl bg-primary/10">
                                            {(() => {
                                                const Icon = indicatorDetails[selectedDetail].icon;
                                                return <Icon className="w-5 h-5 text-primary" />;
                                            })()}
                                        </div>
                                        <DialogTitle className="text-xl font-black tracking-tight">{indicatorDetails[selectedDetail].title}</DialogTitle>
                                    </div>
                                    <DialogDescription className="text-[14px] leading-relaxed font-medium break-keep text-muted-foreground/80">
                                        {indicatorDetails[selectedDetail].explanation}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                                        <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                            <Search className="w-3 h-3" />
                                            데이터 판독 기준
                                        </h4>
                                        <ul className="space-y-3">
                                            {indicatorDetails[selectedDetail].criteria.map((c, i) => (
                                                <li key={i} className="text-sm font-bold flex items-start gap-3 group/item">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 mt-1.5 shrink-0 group-hover/item:bg-indigo-500 transition-colors" />
                                                    <span className="text-foreground/80 leading-snug">{c}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed break-keep flex items-start gap-2">
                                            <span>💡</span>
                                            <span>CORE는 위 기준에 따라 현재 지표를 실시간 대조하여 위험도와 기회 구간을 판독하고 있습니다.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <div className="text-[12px] text-muted-foreground/40 text-center pt-8 border-t border-dashed border-white/10 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    * CORE AI는 실시간 지표를 종합 분석합니다. 최종 투자 결정은 본인의 판단하에 이루어져야 합니다.
                </div>
            </div>
        </div>
    );
}

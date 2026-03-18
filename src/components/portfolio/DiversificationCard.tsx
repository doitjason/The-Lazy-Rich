"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Shield, ShieldAlert, ShieldCheck, Layers } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DiversificationCardProps {
    score: number; // 0 to 100
    assetCount: number;
    sectorCount: number;
    topSector: { name: string; percent: number };
    hasDefensiveAssets: boolean;
}

export function DiversificationCard({ score, assetCount, sectorCount, topSector, hasDefensiveAssets }: DiversificationCardProps) {

    // Status Logic
    const status = useMemo(() => {
        if (score >= 80) return { label: "철벽 방어 (Excellent)", color: "text-emerald-400", Icon: ShieldCheck, bg: "bg-emerald-500" };
        if (score >= 60) return { label: "양호 (Good)", color: "text-emerald-400", Icon: Shield, bg: "bg-emerald-500" };
        if (score >= 40) return { label: "주의 (Warning)", color: "text-emerald-400", Icon: ShieldAlert, bg: "bg-emerald-500" };
        return { label: "취약 (Danger)", color: "text-emerald-400", Icon: ShieldAlert, bg: "bg-emerald-500" };
    }, [score]);

    const Icon = status.Icon;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "relative overflow-hidden rounded-2xl border backdrop-blur-md p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between group h-full",
                        "bg-white/40 dark:bg-black/20",
                        "border-emerald-500/20 dark:border-emerald-500/20"
                    )}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Layers className="w-12 h-12" />
                    </div>

                    <div className="space-y-1 relative z-10">
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            분산 점수 (Correlation)
                        </div>
                        <div className={cn("text-lg font-black flex items-end gap-0.5 text-foreground")}>
                            {score}
                            <span className="text-[9px] font-normal text-muted-foreground pb-0.5">점</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-500/10 relative z-10">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">방어력 진단</span>
                            <span className={cn("text-xs font-bold flex items-center gap-1 whitespace-nowrap", status.color)}>
                                <Icon className="w-3 h-3 shrink-0" /> {status.label.split(' ')[0]}
                            </span>
                        </div>
                    </div>


                </div>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-xs bg-white/95 dark:bg-black/95 border-border dark:border-white/10 backdrop-blur-xl text-foreground dark:text-white/90 p-4">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-sm text-foreground dark:text-white mb-1 flex items-center gap-2">
                            🛡️ 포트폴리오 방어력 (Correlation Guard)
                        </h4>
                        <p className="opacity-70 leading-relaxed">
                            "가짜 분산투자"를 감지합니다. 자산들이 얼마나 서로 다르게 움직여 위험을 상쇄하는지 평가합니다.
                        </p>
                    </div>

                    <div className="space-y-2 bg-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                            <span className="opacity-80">보유 자산군</span>
                            <span className="font-bold">{assetCount}개 종목 / {sectorCount}개 섹터</span>
                        </div>
                        <div className="h-px bg-border dark:bg-white/10" />
                        <div className="flex justify-between items-center">
                            <span className="opacity-80">최대 집중 섹터</span>
                            <span className={cn("font-bold", topSector.percent > 40 ? "text-rose-400" : "text-emerald-400")}>
                                {topSector.name} ({Math.round(topSector.percent)}%)
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="opacity-80">방어 자산(채권/금 등)</span>
                            <span className={cn("font-bold", hasDefensiveAssets ? "text-emerald-400" : "text-orange-400")}>
                                {hasDefensiveAssets ? "보유중 ✅" : "미보유 ⚠️"}
                            </span>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border dark:border-white/10 opacity-70 italic text-[10px]">
                        {score < 50
                            ? "Tip: 기술주 외에 채권, 금, 배당주 등을 섞어 방어력을 높이세요."
                            : "Tip: 훌륭한 분산입니다. 하락장에서도 비교적 안정적일 것입니다."}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

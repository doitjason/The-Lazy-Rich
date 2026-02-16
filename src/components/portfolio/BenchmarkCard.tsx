"use client";

import { useState } from "react";
import { formatPercent, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Trophy, AlertCircle } from "lucide-react";
import { BenchmarkHistoryDialog } from "./BenchmarkHistoryDialog";

interface BenchmarkCardProps {
    userReturn: number;
    marketReturn: number;
    className?: string;
    holdings?: { ticker: string; quantity: number }[];
}

export function BenchmarkCard({ userReturn, marketReturn, className, holdings = [] }: BenchmarkCardProps) {
    const [open, setOpen] = useState(false);
    const alpha = userReturn - marketReturn;
    const isWin = alpha >= 0;

    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className={cn(
                    "relative overflow-hidden rounded-2xl border backdrop-blur-md p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]",
                    isWin
                        ? "bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent border-sky-500/20 dark:border-sky-500/20"
                        : "bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20 dark:border-rose-500/20",
                    "bg-white/40 dark:bg-black/20", // Light mode compatibility
                    className
                )}
            >
                {/* Header: Title & Sentiment Badge */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-full", isWin ? "bg-sky-500/20" : "bg-rose-500/20")}>
                            {isWin
                                ? <Trophy className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                : <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            }
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white/90 tracking-wide flex items-center gap-1">
                            데일리 벤치마크 <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">Click</span>
                        </span>
                    </div>

                    {/* Alpha Badge */}
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold tracking-tight border",
                        isWin
                            ? "bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-400"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
                    )}>
                        {alpha > 0 ? "+" : ""}{alpha.toFixed(2)}%p
                        <span className="text-[10px] opacity-70 font-normal ml-0.5">vs 시장</span>
                    </div>
                </div>

                {/* Comparison Bar */}
                <div className="flex items-center justify-between px-1">
                    {/* User Side */}
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-white/60">내 포트폴리오</span>
                        <div className={cn("text-xl font-bold tracking-tight flex items-center gap-1",
                            userReturn >= 0
                                ? "text-sky-700 dark:text-sky-400"
                                : "text-rose-700 dark:text-rose-400"
                        )}>
                            {formatPercent(userReturn)}
                        </div>
                    </div>

                    {/* VS Divider */}
                    <div className="flex flex-col items-center px-4">
                        <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-200 dark:via-white/20 to-transparent"></div>
                    </div>

                    {/* Market Side */}
                    <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-white/60">S&P 500 (SPY ETF)</span>
                        <div className={cn("text-xl font-bold tracking-tight flex items-center gap-1",
                            marketReturn >= 0
                                ? "text-sky-700 dark:text-sky-400"
                                : "text-rose-700 dark:text-rose-400"
                        )}>
                            {formatPercent(marketReturn)}
                        </div>
                    </div>
                </div>

                {/* Context Message (Bottom) */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <p className="text-xs font-bold text-center text-slate-700 dark:text-white/80 whitespace-nowrap overflow-hidden text-ellipsis">
                        {isWin
                            ? "오늘 시장을 이기고 있습니다! 정말 훌륭한 성과네요. 👏"
                            : "오늘은 시장보다 부진할지라도, 원칙을 지키는 투자가 중요합니다. 💪"}
                    </p>
                </div>
            </div>

            <BenchmarkHistoryDialog
                open={open}
                onOpenChange={setOpen}
                holdings={holdings}
            />
        </>
    );
}

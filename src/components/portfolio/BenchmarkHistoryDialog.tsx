"use client";

import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatPercent, cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { getBenchmarkHistory } from "@/app/actions/portfolio-actions";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, ReferenceLine } from "recharts";

type TimeRange = "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD";

interface BenchmarkHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    holdings: { ticker: string; quantity: number }[];
}

export function BenchmarkHistoryDialog({ open, onOpenChange, holdings }: BenchmarkHistoryDialogProps) {
    const [range, setRange] = useState<TimeRange>("1M");
    const [data, setData] = useState<{ date: string; portfolio: number; benchmark: number }[]>([]);
    const [holdingsPerformance, setHoldingsPerformance] = useState<{
        ticker: string;
        firstPrice: number;
        lastPrice: number;
        return: number;
    }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (open && holdings.length > 0) {
            setLoading(true);
            setError(null);

            getBenchmarkHistory(holdings, range)
                .then(res => {
                    if (Array.isArray(res)) {
                        setData(res);
                        setHoldingsPerformance([]);
                    } else {
                        setData(res.chartData);
                        setHoldingsPerformance(res.holdingsPerformance);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch history:", err);
                    setError("데이터를 불러오는데 실패했습니다.");
                })
                .finally(() => setLoading(false));

        }
    }, [open, range, holdings]); // holdings is memoized in parent, so this won't trigger loop

    // Calculate total return for the selected period
    const periodReturn = useMemo(() => {
        if (data.length === 0) return { portfolio: 0, benchmark: 0 };
        const last = data[data.length - 1];
        return { portfolio: last.portfolio, benchmark: last.benchmark };
    }, [data]);

    const alpha = periodReturn.portfolio - periodReturn.benchmark;
    const isWin = alpha >= 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[96vw] max-w-md max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl p-0 shadow-2xl">
                <div className="p-6 pb-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50">
                    <DialogHeader className="mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    데일리 벤치마크 히스토리
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                    내 투자 전략이 시장 지수(S&P 500)를 이기고 있는지 확인해보세요.
                                </DialogDescription>
                            </div>

                            {/* Range Selector */}
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto">
                                {["1W", "1M", "3M", "6M", "1Y"].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setRange(r as TimeRange)}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                            range === r
                                                ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200 dark:border-slate-600"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-2">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">내 수익률 ({range})</span>
                            <span className={cn("text-2xl font-bold tracking-tight", periodReturn.portfolio >= 0 ? "text-sky-600 dark:text-sky-400" : "text-rose-600 dark:text-rose-400")}>
                                {formatPercent(periodReturn.portfolio)}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">시장 (SPY ETF)</span>
                            <span className={cn("text-2xl font-bold tracking-tight", periodReturn.benchmark >= 0 ? "text-sky-600 dark:text-sky-400" : "text-rose-600 dark:text-rose-400")}>
                                {formatPercent(periodReturn.benchmark)}
                            </span>
                        </div>
                        <div className={cn(
                            "rounded-xl p-4 border shadow-sm flex flex-col justify-center relative overflow-hidden",
                            isWin
                                ? "bg-sky-50 dark:bg-sky-500/10 border-sky-100 dark:border-sky-500/20"
                                : "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"
                        )}>
                            <div className={cn("absolute top-0 right-0 p-2 opacity-10 transform translate-x-1 -translate-y-1", isWin ? "text-sky-600" : "text-rose-600")}>
                                {isWin ? "WIN" : "LOSS"}
                            </div>
                            <span className={cn("text-xs font-semibold block mb-1", isWin ? "text-sky-700 dark:text-sky-300" : "text-rose-700 dark:text-rose-300")}>
                                Alpha (초과수익)
                            </span>
                            <span className={cn("text-2xl font-bold tracking-tight z-10", isWin ? "text-sky-600 dark:text-sky-400" : "text-rose-600 dark:text-rose-400")}>
                                {alpha > 0 ? "+" : ""}{alpha.toFixed(2)}%p
                            </span>
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="h-[350px] w-full bg-white dark:bg-slate-900 p-4 relative border-t border-slate-100 dark:border-slate-800">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                            <span className="text-sm font-medium animate-pulse text-slate-600 dark:text-slate-300">데이터를 분석하고 있습니다...</span>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-500 gap-2">
                            <span className="text-lg font-bold">오류 발생</span>
                            <span className="text-sm text-slate-500">{error}</span>
                        </div>
                    ) : data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: "#64748b" }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => {
                                        const d = new Date(val);
                                        return `${d.getMonth() + 1}/${d.getDate()}`;
                                    }}
                                    minTickGap={30}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "#64748b" }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${val}%`}
                                    domain={['auto', 'auto']}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        borderColor: "#e2e8f0",
                                        borderRadius: "12px",
                                        fontSize: "13px",
                                        color: "#1e293b",
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                    }}
                                    labelStyle={{ color: "#64748b", marginBottom: "8px", fontWeight: 600 }}
                                    formatter={(val: any) => [`${Number(val).toFixed(2)}%`]}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                    cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "4 4" }}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: "20px" }}
                                    formatter={(value) => <span className="text-xs font-medium text-slate-600 dark:text-slate-300 ml-1">{value}</span>}
                                />
                                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                                <Line
                                    type="monotone"
                                    dataKey="portfolio"
                                    name="내 포트폴리오"
                                    stroke="#0ea5e9" // sky-500
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 6, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }}
                                    animationDuration={1500}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="benchmark"
                                    name="S&P 500 (SPY ETF)"
                                    stroke="#94a3b8" // slate-400
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={false}
                                    activeDot={{ r: 5, fill: "#94a3b8", stroke: "#fff", strokeWidth: 2 }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
                            <span>데이터가 없습니다.</span>
                            <span className="text-xs text-slate-300">종목을 추가하거나 기간을 변경해 보세요.</span>
                        </div>
                    )}
                </div>

                {/* Holdings Performance (New) */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                    <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">종목별 성과 (기여도 순)</h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{range} 기준</span>
                    </div>
                    <div className="max-h-[180px] overflow-y-auto px-6 py-2">
                        {holdingsPerformance.length > 0 ? (
                            <div className="space-y-2 pb-4">
                                {holdingsPerformance.map((h) => (
                                    <div key={h.ticker} className="flex items-center justify-between py-1 group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-sm group-hover:border-sky-500/30 transition-colors">
                                                {h.ticker.slice(0, 2)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">{h.ticker}</span>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                    {h.firstPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })} → {h.lastPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "text-sm font-bold px-2 py-1 rounded-md",
                                            h.return >= 0
                                                ? "text-sky-600 dark:text-sky-400 bg-sky-500/5"
                                                : "text-rose-600 dark:text-rose-400 bg-rose-500/5"
                                        )}>
                                            {h.return >= 0 ? "+" : ""}{h.return.toFixed(2)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !loading && (
                            <div className="py-8 text-center text-slate-400 text-xs">
                                개별 종목 데이터가 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

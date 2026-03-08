"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Calculator, Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import { getDividendCalendar } from "@/app/actions/portfolio-actions";
import { PortfolioItem } from "@/store/usePortfolioStore";
import { DividendEvent } from "@/lib/market-types";
import { motion, AnimatePresence } from "framer-motion";

interface DividendCalendarDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: PortfolioItem[];
}

export function DividendCalendarDialog({ open, onOpenChange, items }: DividendCalendarDialogProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<DividendEvent[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch Dividend Data
    useEffect(() => {
        if (open && items.length > 0) {
            setLoading(true);
            const tickers = items.map(i => i.ticker);
            getDividendCalendar(tickers)
                .then(data => {
                    setEvents(data);
                })
                .catch(err => console.error("Failed to fetch dividends", err))
                .finally(() => setLoading(false));
        }
    }, [open, items]);

    // Group events by Month (0-11) for the Chart
    const monthlyChartData = useMemo(() => {
        const data = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            label: `${i + 1}월`,
            total: 0,
            isCurrent: i === currentDate.getMonth()
        }));

        events.forEach(event => {
            const date = new Date(event.date);
            const month = date.getMonth(); // 0-11

            // Aggregate quantity in case of multiple entries for same ticker
            const quantity = items.filter(i => i.ticker === event.ticker).reduce((sum, i) => sum + i.quantity, 0);

            if (quantity > 0) {
                // Ensure we only count future/projected events appropriately or sum all known valid ones for an annual view
                // For a "Jan-Dec" view, we typically sum up all expected dividends for the calendar year
                // But since our data might span multiple years or be past/future mixture:
                // Let's filter for the *current calendar year* or *next 12 months*?
                // The prompt says "1월~12월별 배당금 막대 그래프" (Jan-Dec Bar Chart).
                // Usually this means a Calendar Year view. Let's use the year of currentDate.
                if (date.getFullYear() === currentDate.getFullYear()) {
                    data[month].total += event.amount * quantity;
                }
            }
        });

        return data;
    }, [events, items, currentDate]);

    // Filter events for the selected month
    const selectedMonthEvents = useMemo(() => {
        return events.filter(event => {
            const date = new Date(event.date);
            return date.getMonth() === currentDate.getMonth() &&
                date.getFullYear() === currentDate.getFullYear();
        }).map(event => {
            const quantity = items.filter(i => i.ticker === event.ticker).reduce((sum, i) => sum + i.quantity, 0);
            return {
                ...event,
                quantity: quantity,
                totalAmount: quantity * event.amount
            };
        });
    }, [events, items, currentDate]);

    const totalMonthDividend = selectedMonthEvents.reduce((acc, curr) => acc + curr.totalAmount, 0);

    // Determine currency for total
    // If all items in this month have the same currency, use it. Otherwise default to USD.
    const monthCurrency = useMemo(() => {
        if (selectedMonthEvents.length === 0) return "USD";
        const firstCurrency = selectedMonthEvents[0].currency;
        const allSame = selectedMonthEvents.every(e => e.currency === firstCurrency);
        return allSame ? firstCurrency : "USD";
    }, [selectedMonthEvents]);

    const nextMonth = () => {
        setCurrentDate(prev => {
            const next = new Date(prev);
            next.setMonth(prev.getMonth() + 1);
            return next;
        });
    };

    const prevMonth = () => {
        setCurrentDate(prev => {
            const prevDate = new Date(prev);
            prevDate.setMonth(prev.getMonth() - 1);
            return prevDate;
        });
    };

    // Helper to jump to a specific month from chart click
    const handleBarClick = (data: any) => {
        if (data && data.month !== undefined) {
            const clickedMonthIndex = data.month - 1;
            setCurrentDate(prev => {
                const newDate = new Date(prev);
                newDate.setMonth(clickedMonthIndex);
                return newDate;
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-white/20 p-0 overflow-hidden gap-0">
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CalendarIcon className="w-5 h-5 text-emerald-500" />
                        배당 캘린더
                    </DialogTitle>
                    <DialogDescription>
                        월별 예상 배당금 일정입니다.
                    </DialogDescription>
                </DialogHeader>

                {/* 1. Calendar Navigator */}
                <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-y border-white/5">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-white/10 rounded-full">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-lg font-bold tabular-nums">
                        {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-white/10 rounded-full">
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* 2. Jan-Dec Bar Chart */}
                <div className="p-4 h-[200px] w-full bg-gradient-to-b from-white/5 to-transparent">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            데이터 불러오는 중...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10, fill: '#888' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-black/90 border border-white/10 p-2 rounded-lg text-xs shadow-xl backdrop-blur-md">
                                                    <div className="font-bold mb-1">{data.label}</div>
                                                    <div className="text-emerald-400 font-medium">
                                                        {formatCurrency(data.total)}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="total"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                    cursor="pointer"
                                    onClick={handleBarClick}
                                >
                                    {monthlyChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.month === currentDate.getMonth() + 1 ? '#10b981' : '#3f3f46'}
                                            className="transition-all duration-300 hover:opacity-80"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* 3. Monthly Details List */}
                <div className="flex-1 min-h-[300px] bg-card/50">
                    <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-muted/20">
                        <span className="text-xs font-semibold text-muted-foreground">
                            {currentDate.getMonth() + 1}월 예상 배당 총액 <span className="text-[10px] opacity-60 font-normal">(세전)</span>
                        </span>
                        <span className="text-lg font-bold text-emerald-400">
                            {formatCurrency(totalMonthDividend, monthCurrency)}
                        </span>
                    </div>

                    <ScrollArea className="h-[280px] p-4">
                        {selectedMonthEvents.length > 0 ? (
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {selectedMonthEvents.map((item, idx) => (
                                        <motion.div
                                            key={`${item.ticker}-${item.date}-${idx}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 shadow-sm hover:shadow-md hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-200 group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                                    <img
                                                        src={`/api/logo?ticker=${item.ticker}`}
                                                        alt={item.ticker}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback-initial');
                                                            if (fallback) fallback.classList.remove('hidden');
                                                        }}
                                                    />
                                                    <div className="fallback-initial hidden absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                                        {item.ticker.slice(0, 2)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm text-foreground uppercase tracking-tight">{item.ticker.replace(".KS", "")}</div>
                                                    <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                                        {item.quantity}주 보유 <span className="text-[10px] opacity-30">•</span> 주당 {formatCurrency(item.amount, item.currency)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(item.totalAmount, item.currency)}</div>
                                                <div className="text-[10px] font-medium text-muted-foreground">
                                                    {item.isEstimated ? "예상 지급일" : "지급일"}: {item.paymentDate || item.date}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10 opacity-60">
                                <CalendarIcon className="w-10 h-10 mb-2 stroke-1" />
                                <p className="text-sm">이 달에는 예정된 배당금이 없습니다.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

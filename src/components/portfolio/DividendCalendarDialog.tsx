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
import { useCurrency } from "@/contexts/CurrencyContext";

interface DividendCalendarDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: PortfolioItem[];
}

export function DividendCalendarDialog({ open, onOpenChange, items }: DividendCalendarDialogProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<DividendEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const { currency: displayCurrency, exchangeRate, formatCurrency: contextFormatCurrency } = useCurrency();

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
            const targetDateStr = event.paymentDate || event.date;
            const date = new Date(targetDateStr);
            const month = date.getMonth(); // 0-11

            const tickerItems = items.filter(i => i.ticker === event.ticker);
            const quantity = tickerItems.reduce((sum, i) => sum + i.quantity, 0);

            if (quantity > 0) {
                if (date.getFullYear() === currentDate.getFullYear()) {
                    // Convert event amount to display currency
                    let amountInDisplayCurrency = event.amount;
                    if (event.currency === "USD" && displayCurrency === "KRW") {
                        amountInDisplayCurrency = event.amount * exchangeRate;
                    } else if (event.currency === "KRW" && displayCurrency === "USD") {
                        amountInDisplayCurrency = event.amount / exchangeRate;
                    }
                    data[month].total += amountInDisplayCurrency * quantity;
                }
            }
        });

        return data;
    }, [events, items, currentDate, displayCurrency, exchangeRate]);

    // Filter events for the selected month
    const selectedMonthEvents = useMemo(() => {
        return events.filter(event => {
            const targetDateStr = event.paymentDate || event.date;
            const date = new Date(targetDateStr);
            return date.getMonth() === currentDate.getMonth() &&
                date.getFullYear() === currentDate.getFullYear();
        }).map(event => {
            const quantity = items.filter(i => i.ticker === event.ticker).reduce((sum, i) => sum + i.quantity, 0);
            
            // Calculate total in native currency for detail line
            const totalNative = quantity * event.amount;
            
            // Calculate total in display currency for aggregate sum
            let totalInDisplay = totalNative;
            if (event.currency === "USD" && displayCurrency === "KRW") {
                totalInDisplay = totalNative * exchangeRate;
            } else if (event.currency === "KRW" && displayCurrency === "USD") {
                totalInDisplay = totalNative / exchangeRate;
            }

            return {
                ...event,
                quantity: quantity,
                totalAmount: totalNative,
                totalInDisplay: totalInDisplay
            };
        });
    }, [events, items, currentDate, displayCurrency, exchangeRate]);

    const totalMonthDividend = selectedMonthEvents.reduce((acc, curr) => acc + curr.totalInDisplay, 0);

    const nextYear = () => {
        setCurrentDate(prev => {
            const next = new Date(prev);
            next.setFullYear(prev.getFullYear() + 1);
            return next;
        });
    };

    const prevYear = () => {
        setCurrentDate(prev => {
            const prevDate = new Date(prev);
            prevDate.setFullYear(prev.getFullYear() - 1);
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
                    <Button variant="ghost" size="icon" onClick={prevYear} className="h-8 w-8 hover:bg-white/10 rounded-full">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-lg font-bold tabular-nums">
                        {currentDate.getFullYear()}년
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextYear} className="h-8 w-8 hover:bg-white/10 rounded-full">
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
                            <BarChart data={monthlyChartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 9, fill: '#888', fontWeight: 500 }}
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
                                                        {contextFormatCurrency(data.total)}
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
                                            fill={entry.month === currentDate.getMonth() + 1 ? '#10b981' : '#10b98133'}
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
                            {contextFormatCurrency(totalMonthDividend)}
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

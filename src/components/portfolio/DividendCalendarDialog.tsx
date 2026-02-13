"use client";

import { useEffect, useState } from "react";
import { format, parseISO, isSameDay, isSameMonth } from "date-fns";
import { ko } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wallet } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getDividendCalendar } from "@/app/actions/portfolio-actions";
import { DividendEvent } from "@/lib/market-types";
import { formatCurrency, cn } from "@/lib/utils";

interface DividendCalendarDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: { ticker: string; quantity: number }[];
}

export function DividendCalendarDialog({ open, onOpenChange, items }: DividendCalendarDialogProps) {
    const [events, setEvents] = useState<DividendEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    // Fetch data when opened
    useEffect(() => {
        if (open && items.length > 0) {
            const fetchEvents = async () => {
                setLoading(true);
                try {
                    const tickers = items.map(i => i.ticker);
                    const data = await getDividendCalendar(tickers);
                    setEvents(data);

                    const now = new Date();
                    setSelectedDate(now);
                    setCurrentMonth(now);
                } catch (e) {
                    console.error("Failed to fetch dividend calendar", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchEvents();
        }
    }, [open, items]);

    // Filter events for the current displayed month
    const monthEvents = events
        .filter(e => isSameMonth(parseISO(e.date), currentMonth))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Modifiers for calendar styling
    const modifiers = {
        dividend: (date: Date) => events.some(e => isSameDay(parseISO(e.date), date)),
        payDate: (date: Date) => events.some(e => e.paymentDate && isSameDay(parseISO(e.paymentDate), date))
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-gray-950/90 backdrop-blur-2xl border-white/10 text-white p-0 gap-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                        <CalendarIcon className="w-5 h-5 text-emerald-400" />
                        배당 캘린더
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs">
                        월별 배당금 및 분배금 일정입니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col h-[600px]">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            <p className="text-sm text-gray-500 animate-pulse">일정을 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            {/* Calendar Section */}
                            <div className="px-6 pb-4 border-b border-white/5 flex justify-center">
                                <style>{`
                                    .rdp { margin: 0 auto; }
                                    .rdp-caption { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; margin-bottom: 0.5rem; width: 280px; }
                                    .rdp-caption_label { font-size: 0.95rem; font-weight: 600; color: white; }
                                    .rdp-nav { display: flex; gap: 0.5rem; }
                                    .rdp-head_cell { font-size: 0.75rem; font-weight: 500; color: #6b7280; text-transform: uppercase; padding-bottom: 0.5rem; width: 40px; }
                                    .rdp-day { width: 40px; height: 40px; border-radius: 12px; font-size: 0.9rem; transition: all 0.2s; position: relative; }
                                    .rdp-day:hover:not([disabled]) { background-color: rgba(255,255,255,0.1); }
                                    .rdp-day_selected { background: linear-gradient(135deg, #10b981, #059669) !important; color: white; font-weight: bold; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
                                    .rdp-day_today { border: 1px solid #10b981; color: #10b981; }
                                    .marker-dot { position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background-color: #34d399; box-shadow: 0 0 4px #34d399; }
                                `}</style>
                                <DayPicker
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        setSelectedDate(date);
                                    }}
                                    month={currentMonth}
                                    onMonthChange={setCurrentMonth}
                                    modifiers={modifiers}
                                    components={{
                                        DayContent: ((props: any) => {
                                            const isDividend = events.some(e => isSameDay(parseISO(e.date), props.date));
                                            return (
                                                <div className="w-full h-full flex items-center justify-center relative">
                                                    {props.date.getDate()}
                                                    {isDividend && <div className="marker-dot" />}
                                                </div>
                                            );
                                        }) as any,
                                        IconLeft: () => <ChevronLeft className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />,
                                        IconRight: () => <ChevronRight className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                    }}
                                    locale={ko}
                                />
                            </div>

                            {/* List Section */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/20">
                                <div className="text-xs font-medium text-gray-500 px-2 flex justify-between items-center sticky top-0 bg-gray-950/80 backdrop-blur-md py-2 z-10 -mt-2 mb-2">
                                    <span>{format(currentMonth, 'yyyy년 M월 배당 일정', { locale: ko })}</span>
                                    <span>{monthEvents.length}건</span>
                                </div>

                                <AnimatePresence mode="popLayout">
                                    {monthEvents.length > 0 ? (
                                        monthEvents.map((event, idx) => {
                                            const item = items.find(i => i.ticker === event.ticker);
                                            const qty = item?.quantity || 0;
                                            const total = qty * event.amount;
                                            const isSelectedDay = selectedDate && isSameDay(parseISO(event.date), selectedDate);

                                            return (
                                                <motion.div
                                                    key={`${event.ticker}-${event.date}-${idx}`}
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={cn(
                                                        "group relative overflow-hidden rounded-xl border p-4 transition-all active:scale-[0.98]",
                                                        isSelectedDay
                                                            ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                    <div className="relative flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-xs">
                                                                <span className="text-gray-400 text-[10px]">{format(parseISO(event.date), 'M월')}</span>
                                                                <span className="font-bold text-white">{format(parseISO(event.date), 'd일')}</span>
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white flex items-center gap-2">
                                                                    {event.ticker}
                                                                    <span className={cn(
                                                                        "text-[10px] px-1.5 py-0.5 rounded font-medium border border-white/5",
                                                                        event.exDate === event.date
                                                                            ? "bg-blue-500/20 text-blue-300 border-blue-500/20"
                                                                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/20"
                                                                    )}>
                                                                        {event.exDate === event.date ? "권리락" : "지급일"}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-0.5">
                                                                    주당 {formatCurrency(event.amount)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <div className="font-bold text-lg text-emerald-400 tabular-nums">
                                                                +{formatCurrency(total)}
                                                            </div>
                                                            <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                                                <Wallet className="w-3 h-3" /> {qty}주
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="h-full flex flex-col items-center justify-center text-center py-12 px-4"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                <CalendarIcon className="w-8 h-8 text-gray-600" />
                                            </div>
                                            <p className="text-gray-400 text-sm">이 달에는 예정된 배당금이 없습니다.</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getQuoteOfDay, Quote as QuoteType } from "@/lib/quotes";

export function QuoteCard() {
    const [quote, setQuote] = useState<QuoteType | null>(null);

    useEffect(() => {
        setQuote(getQuoteOfDay());
    }, []);

    if (!quote) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-lg overflow-hidden relative rounded-[2rem] shadow-xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-80" />
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.07]">
                    <Quote className="h-16 w-16 transform rotate-12 text-emerald-500" />
                </div>
                <CardContent className="py-8 px-10 text-center space-y-4 relative z-10">
                    <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 tracking-[0.3em] uppercase">오늘의 지혜</p>
                    <blockquote className="text-lg md:text-xl font-black leading-relaxed break-keep text-balance text-foreground/90 italic">
                        "{quote.text}"
                    </blockquote>
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <div className="h-px w-4 bg-emerald-500/30" />
                        <footer className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                            {quote.author}
                        </footer>
                        <div className="h-px w-4 bg-emerald-500/30" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

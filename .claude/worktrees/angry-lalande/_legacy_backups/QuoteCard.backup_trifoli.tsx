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
            <Card className="border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Quote className="h-12 w-12 transform rotate-12" />
                </div>
                <CardContent className="py-6 px-10 text-center space-y-3 relative z-10">
                    <p className="text-sm font-black text-primary tracking-[0.2em] uppercase">오늘의 지혜</p>
                    <blockquote className="text-lg md:text-xl font-bold leading-relaxed break-keep text-balance">
                        "{quote.text}"
                    </blockquote>
                    <footer className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
                        — {quote.author}
                    </footer>
                </CardContent>
            </Card>
        </motion.div>
    );
}

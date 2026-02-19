"use client";

import { Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NEWS_DATA } from "@/lib/dummy-data";
import { motion } from "framer-motion";

export function NewsFeed() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <Newspaper className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold">Market Pulse</h3>
            </div>

            <motion.div
                className="space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {NEWS_DATA.map((news) => (
                    <motion.div key={news.id} variants={item}>
                        <Card
                            className="group flex overflow-hidden border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-white/30 transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md"
                        >
                            <div className={cn(
                                "w-1.5 self-stretch transition-all duration-500 group-hover:w-2",
                                news.sentiment === "positive" && "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
                                news.sentiment === "negative" && "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]",
                                news.sentiment === "neutral" && "bg-slate-400"
                            )} />
                            <div className="p-4 flex-1 space-y-2">
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                    <span className="font-black text-emerald-600 dark:text-emerald-400">{news.source}</span>
                                    <span className="opacity-30">•</span>
                                    <span>{news.time}</span>
                                </div>
                                <h4 className="font-black text-[14px] leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors break-keep">
                                    {news.title}
                                </h4>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}

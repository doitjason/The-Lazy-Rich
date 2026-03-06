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
                            className="group flex overflow-hidden border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-sm hover:bg-white/50 transition-all cursor-pointer"
                        >
                            <div className={cn(
                                "w-1.5 self-stretch transition-colors",
                                news.sentiment === "positive" && "bg-green-500",
                                news.sentiment === "negative" && "bg-red-500",
                                news.sentiment === "neutral" && "bg-gray-400"
                            )} />
                            <div className="p-4 flex-1 space-y-2">
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wide">
                                    <span className="font-semibold text-primary">{news.source}</span>
                                    <span>•</span>
                                    <span>{news.time}</span>
                                </div>
                                <h4 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors">
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

"use client";

import { useState } from "react";
import { QuoteCard } from "@/components/insights/QuoteCard";
import { MarketContext } from "@/components/insights/MarketContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function InsightsPage() {
    const [selectedTab, setSelectedTab] = useState<"market" | "blog" | "community" | "recommended">("market");

    return (
        <div className="flex min-h-screen flex-col p-4 max-w-md mx-auto space-y-8 pb-24">
            <header className="pt-8">
                <h1 className="text-3xl font-bold tracking-tight">인사이트</h1>
                <p className="text-muted-foreground">시장을 꿰뚫어보는 통찰력</p>
            </header>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between w-full gap-1 pb-2">
                {[
                    { id: "market", label: "시장 상황" },
                    { id: "blog", label: "블로그" },
                    { id: "community", label: "커뮤니티" },
                    { id: "recommended", label: "추천 컨텐츠" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id as any)}
                        className={cn(
                            "flex-1 py-3 rounded-full text-[11px] sm:text-sm font-black whitespace-nowrap transition-all duration-300 relative overflow-hidden group/tab",
                            selectedTab === tab.id
                                ? "text-white"
                                : "text-muted-foreground hover:text-foreground bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-sm"
                        )}
                    >
                        {selectedTab === tab.id && (
                            <motion.div
                                layoutId="activeTabInsights"
                                className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 w-full text-center block">
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[400px]">
                {selectedTab === "market" && (
                    <div className="space-y-8">
                        <QuoteCard />
                        <MarketContext />
                    </div>
                )}

                {selectedTab === "blog" && (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
                        <p>✍️ 통찰력 있는 투자 칼럼을 준비 중입니다.</p>
                    </div>
                )}

                {selectedTab === "community" && (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
                        <p>👥 투자자들과 의견을 나누는 공간이 곧 열립니다.</p>
                    </div>
                )}

                {selectedTab === "recommended" && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            <button className="px-4 py-1.5 rounded-full text-sm font-semibold text-foreground bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all whitespace-nowrap">
                                📚 추천 도서
                            </button>
                            <button className="px-4 py-1.5 rounded-full text-sm font-semibold text-foreground bg-secondary/80 border border-border hover:bg-secondary transition-all whitespace-nowrap">
                                🎬 추천 동영상
                            </button>
                        </div>
                        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed rounded-2xl bg-muted/20 mt-4">
                            <p>당신을 위한 맞춤형 투자 컨텐츠를 선별 중입니다. 🚀</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

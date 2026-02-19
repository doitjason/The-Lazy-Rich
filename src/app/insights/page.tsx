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
            <div className="flex items-center justify-center gap-1 pb-2 w-full overflow-hidden">
                {[
                    { id: "market", label: "시장 상황", icon: "📊" },
                    { id: "blog", label: "블로그", icon: "✍️" },
                    { id: "community", label: "커뮤니티", icon: "👥" },
                    { id: "recommended", label: "추천 컨텐츠", icon: "📚" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id as any)}
                        className={cn(
                            "px-2.5 py-2 rounded-full text-[11px] xs:text-[12px] sm:text-[13px] font-black whitespace-nowrap transition-all duration-500 relative overflow-hidden group/tab flex-shrink-0",
                            selectedTab === tab.id
                                ? "text-white scale-105 shadow-lg shadow-emerald-500/20"
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
                        <span className="relative z-10 flex items-center gap-1 scale-[0.9] sm:scale-100 origin-center">
                            <span className="text-[10px] sm:text-xs">{tab.icon}</span>
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
                    <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
                        <p>📚 당신을 위한 맞춤형 투자 컨텐츠를 선별 중입니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

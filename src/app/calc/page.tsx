"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { RegretCalculator } from "@/components/calc/RegretCalculator";
import { CompoundCalculator } from "@/components/calc/CompoundCalculator";
import { PortfolioRegretCalculator } from "@/components/calc/PortfolioRegretCalculator";
import { motion } from "framer-motion";

export default function CalcPage() {
    const [activeTab, setActiveTab] = useState<"regret" | "regret-v2" | "compound">("regret");

    return (
        <div className="flex min-h-screen flex-col p-4 space-y-6 max-w-md mx-auto">
            <header className="pt-8 pb-2">
                <h1 className="text-3xl font-bold tracking-tight">투자 계산기</h1>
                <p className="text-muted-foreground">당신의 투자를 분석하고 계획하세요.</p>
            </header>

            {/* Navigation Tabs (Pill Style) */}
            <div className="flex items-center justify-center gap-1.5 pb-2 w-full overflow-hidden relative">
                {[
                    { id: "regret", label: "했제 계산기 V1", icon: "🕰️" },
                    { id: "regret-v2", label: "했제 계산기 V2", icon: "📊" },
                    { id: "compound", label: "자유 계산기", icon: "📈" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "px-2.5 sm:px-3.5 py-2 rounded-full text-[11px] xs:text-[12px] sm:text-[13px] font-black whitespace-nowrap transition-all duration-500 relative overflow-hidden group/tab flex-shrink-0 tracking-tight",
                            activeTab === tab.id
                                ? "text-white scale-105 shadow-xl shadow-emerald-500/20"
                                : "text-muted-foreground hover:text-foreground bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabCalc"
                                className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5 transition-transform group-hover/tab:scale-105">
                            <span className="text-xs">{tab.icon}</span>
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === "regret" && <RegretCalculator />}
                {activeTab === "regret-v2" && <PortfolioRegretCalculator />}
                {activeTab === "compound" && <CompoundCalculator />}
            </div>
        </div>
    );
}

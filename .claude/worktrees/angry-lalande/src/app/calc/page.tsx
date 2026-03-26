"use client";

import { useState, Suspense, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RegretCalculator } from "@/components/calc/RegretCalculator";
import { CompoundCalculator } from "@/components/calc/CompoundCalculator";
import { PortfolioRegretCalculator } from "@/components/calc/PortfolioRegretCalculator";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

function CalcContent() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") as any;
    const [activeTab, setActiveTab] = useState<"regret" | "regret-v2" | "compound">(
        ["regret", "regret-v2", "compound"].includes(initialTab) ? initialTab : "regret"
    );

    // Sync tab with query param if it changes
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && ["regret", "regret-v2", "compound"].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    return (
        <div className="flex min-h-screen flex-col p-4 space-y-6 max-w-md mx-auto">
            <header className="pt-8 pb-2">
                <h1 className="text-3xl font-bold tracking-tight">투자 계산기</h1>
                <p className="text-muted-foreground">당신의 투자를 분석하고 계획하세요.</p>
            </header>

            {/* Navigation Tabs (Pill Style) */}
            <div className="flex items-center justify-between w-full gap-1">
                {[
                    { id: "regret", label: "했제 계산기 V1" },
                    { id: "regret-v2", label: "했제 계산기 V2" },
                    { id: "compound", label: "자유 계산기" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex-1 py-3 px-1 rounded-full text-[12px] min-[350px]:text-[13px] min-[390px]:text-sm sm:text-[15px] font-black tracking-tight whitespace-nowrap transition-all duration-300 relative overflow-hidden group/tab",
                            activeTab === tab.id
                                ? "text-white"
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
                        <span className="relative z-10 w-full text-center block">
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

export default function CalcPage() {
    return (
        <Suspense fallback={<div className="text-center py-20 opacity-50">Loading...</div>}>
            <CalcContent />
        </Suspense>
    );
}

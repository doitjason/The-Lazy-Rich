"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { RegretCalculator } from "@/components/calc/RegretCalculator";
import { CompoundCalculator } from "@/components/calc/CompoundCalculator";
import { PortfolioRegretCalculator } from "@/components/calc/PortfolioRegretCalculator";

export default function CalcPage() {
    const [activeTab, setActiveTab] = useState<"regret" | "regret-v2" | "compound">("regret");

    return (
        <div className="flex min-h-screen flex-col p-4 space-y-6 max-w-md mx-auto">
            <header className="pt-8 pb-2">
                <h1 className="text-3xl font-bold tracking-tight">투자 계산기</h1>
                <p className="text-muted-foreground">당신의 투자를 분석하고 계획하세요.</p>
            </header>

            {/* Navigation Tabs (Pill Style) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear">
                {[
                    { id: "regret", label: "했제 계산기 V1" },
                    { id: "regret-v2", label: "했제 계산기 V2" },
                    { id: "compound", label: "자유 계산기" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300",
                            activeTab === tab.id
                                ? "bg-foreground text-background shadow-lg scale-105"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {tab.label}
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

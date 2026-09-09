"use client";

import { useState, Suspense } from "react";
import { cn } from "@/lib/utils";
import { RegretCalculator } from "@/components/calc/RegretCalculator";
import { CompoundCalculator } from "@/components/calc/CompoundCalculator";
import { PortfolioRegretCalculator } from "@/components/calc/PortfolioRegretCalculator";
import { motion } from "framer-motion";
import { SearchParamsListener } from "@/components/common/SearchParamsListener";

function CalcContent() {
    const [activeTab, setActiveTab] = useState<"regret" | "regret-v2" | "compound">("regret");

    // Sync tab with query param if it changes
    const applyTabFromUrl = (params: URLSearchParams) => {
        const tab = params.get("tab");
        if (tab && ["regret", "regret-v2", "compound"].includes(tab)) {
            setActiveTab(tab as any);
        }
    };

    return (
        <div className="flex min-h-screen flex-col p-4 space-y-6 max-w-md mx-auto">
            <SearchParamsListener onChange={applyTabFromUrl} />
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
            {/*
              계산기들은 각자 useSearchParams 로 딥링크 값을 채운다. 그래서
              Suspense 경계가 필요한데, 페이지 전체가 아니라 이 영역에만 건다.
              헤더와 탭은 서버 HTML 에 그대로 남는다.
            */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Suspense fallback={<div className="text-center py-20 opacity-50">계산기를 불러오는 중…</div>}>
                    {activeTab === "regret" && <RegretCalculator />}
                    {activeTab === "regret-v2" && <PortfolioRegretCalculator />}
                    {activeTab === "compound" && <CompoundCalculator />}
                </Suspense>
            </div>
        </div>
    );
}

export default function CalcPage() {
    // 페이지 전체를 Suspense 로 감싸지 않는다. 그러면 정적 HTML 이 fallback 만
    // 담게 되어 h1 과 설명, 탭 이름까지 전부 사라진다.
    return <CalcContent />;
}

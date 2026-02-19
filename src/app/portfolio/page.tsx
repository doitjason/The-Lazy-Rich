"use client";

import { useState } from "react";
import { PortfolioDashboard } from "@/components/portfolio/PortfolioDashboard";
import { AddStockDialog } from "@/components/portfolio/AddStockDialog";
import { motion } from "framer-motion";
import { BrandStoryDialog } from "@/components/layout/BrandStoryDialog";

export default function PortfolioPage() {
    const [isAddOpen, setIsAddOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col p-4 max-w-md mx-auto space-y-6 pb-24">
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="pt-8 flex justify-between items-end"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">내 포트폴리오</h1>
                    <p className="text-muted-foreground text-sm">나의 자산 현황을 한눈에 확인하세요.</p>
                </div>
            </motion.header>

            {/* Premium Dashboard */}
            <PortfolioDashboard onAdd={() => setIsAddOpen(true)} />

            <AddStockDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
        </div>
    );
}

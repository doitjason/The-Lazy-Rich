"use client";

import { PortfolioList } from "@/components/portfolio/PortfolioList";
import { motion } from "framer-motion";

export default function PortfolioPage() {
    return (
        <div className="flex min-h-screen flex-col p-4 max-w-md mx-auto space-y-6 pb-24">
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="pt-8 flex justify-between items-end"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">내 자산</h1>
                    <p className="text-muted-foreground">나의 부의 흐름을 추적하세요.</p>
                </div>
            </motion.header>

            {/* Real Portfolio from Supabase */}
            <PortfolioList />
        </div>
    );
}

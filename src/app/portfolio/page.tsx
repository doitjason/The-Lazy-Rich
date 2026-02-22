"use client";

import { useState } from "react";
import { PortfolioDashboard } from "@/components/portfolio/PortfolioDashboard";
import { AddStockDialog } from "@/components/portfolio/AddStockDialog";
import { motion } from "framer-motion";
import { BrandStoryDialog } from "@/components/layout/BrandStoryDialog";
import { GURU_PERSONAS } from "@/lib/guru-personas";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function PortfolioPage() {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isGuruSelectOpen, setIsGuruSelectOpen] = useState(false);
    const router = useRouter();

    const handleGuruSelect = (guruId: string) => {
        setIsGuruSelectOpen(false);
        router.push(`/guru?action=analyze_portfolio&persona=${guruId}`);
    };

    return (
        <div className="flex min-h-screen flex-col p-4 max-w-md mx-auto space-y-6 pb-24 relative">
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="pt-8 flex justify-between items-center"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">내 포트폴리오</h1>
                    <p className="text-muted-foreground text-sm mt-1">나의 자산 현황을 한눈에 확인하세요.</p>
                </div>

                {/* AI 멘토 진단 Button */}
                <motion.button
                    onClick={() => setIsGuruSelectOpen(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                        boxShadow: ["0px 0px 0px rgba(16, 185, 129, 0)", "0px 0px 15px rgba(16, 185, 129, 0.4)", "0px 0px 0px rgba(16, 185, 129, 0)"]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md shadow-sm text-xs font-bold text-emerald-600 dark:text-emerald-400 overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <motion.span
                        animate={{
                            rotate: [0, 15, -15, 0],
                            scale: [1, 1.2, 1.2, 1]
                        }}
                        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
                        className="relative z-10"
                    >
                        ✨
                    </motion.span>
                    <span className="relative z-10 tracking-wide">AI 멘토 진단</span>
                </motion.button>
            </motion.header>

            {/* Premium Dashboard */}
            <PortfolioDashboard onAdd={() => setIsAddOpen(true)} />

            <AddStockDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

            {/* AI Guru Quick Select Modal */}
            <Dialog open={isGuruSelectOpen} onOpenChange={setIsGuruSelectOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-3xl border-white/20 dark:border-white/10 p-0 overflow-hidden fixed bottom-0 top-auto translate-y-0 translate-x-[-50%] sm:top-[50%] sm:-translate-y-1/2 rounded-t-3xl rounded-b-none sm:rounded-2xl z-50">
                    <div className="p-6">
                        <DialogHeader className="mb-4 text-center sm:text-left">
                            <DialogTitle className="text-xl font-bold flex items-center justify-center sm:justify-start gap-2">
                                ✨ AI 멘토 진단
                            </DialogTitle>
                            <DialogDescription className="text-sm mt-1">
                                어떤 멘토에게 자산 진단을 받을까요?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 gap-2 mt-2">
                            {GURU_PERSONAS.map((guru) => (
                                <button
                                    key={guru.id}
                                    onClick={() => handleGuruSelect(guru.id)}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left group border border-transparent hover:border-black/10 dark:hover:border-white/10 active:scale-[0.98]"
                                >
                                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0 transition-transform group-hover:scale-110", guru.color)}>
                                        {guru.avatarEmoji}
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground text-sm truncate">{guru.name}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                {guru.tag}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground leading-tight break-keep line-clamp-2">{guru.description}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

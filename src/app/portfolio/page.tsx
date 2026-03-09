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
    DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { LogIn, PlusCircle, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortfolioPage() {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isGuruSelectOpen, setIsGuruSelectOpen] = useState(false);
    const [isWarningOpen, setIsWarningOpen] = useState(false);
    const { user, signInWithGoogle } = useAuth();
    const { items } = usePortfolioStore();
    const router = useRouter();

    const handleDiagnosticClick = () => {
        if (!user || items.length === 0) {
            setIsWarningOpen(true);
        } else {
            setIsGuruSelectOpen(true);
        }
    };

    const handleGuruSelect = (guruId: string) => {
        setIsGuruSelectOpen(false);
        router.push(`/?action=analyze_portfolio&persona=${guruId}`);
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
                    onClick={handleDiagnosticClick}
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

            {/* Warning Dialog for Guest/Empty Portfolio */}
            <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
                <DialogContent className="sm:max-w-[400px] bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-3xl border-white/20 dark:border-white/10 p-0 overflow-hidden fixed bottom-0 top-auto translate-y-0 translate-x-[-50%] sm:top-[50%] sm:-translate-y-1/2 rounded-t-3xl rounded-b-none sm:rounded-2xl z-50">
                    <div className="p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                            <Sparkles className="w-8 h-8 text-emerald-500" />
                        </div>

                        <DialogHeader className="space-y-3 mb-8">
                            <DialogTitle className="text-2xl font-black tracking-tight">
                                {!user ? "로그인 후 나만의 포트폴리오를 만들어보세요" : "포트폴리오가 비어있어요"}
                            </DialogTitle>
                            <DialogDescription className="text-base font-medium leading-relaxed">
                                {!user
                                    ? "로그인만 하면 내 자산을 간편하게 등록하고\nAI 멘토의 정밀한 진단을 받을 수 있어요! ✨"
                                    : "진단할 종목이 아직 없네요!\n종목을 추가하고 AI 멘토의 조언을 받아보세요. 📈"}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="w-full space-y-3">
                            {!user ? (
                                <Button
                                    onClick={() => {
                                        setIsWarningOpen(false);
                                        signInWithGoogle();
                                    }}
                                    className="w-full h-14 text-base font-bold bg-white hover:bg-gray-100 text-black border border-gray-200 shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Google로 3초 로그인하기
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        setIsWarningOpen(false);
                                        setIsAddOpen(true);
                                    }}
                                    className="w-full h-14 text-base font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    첫 종목 추가하러 가기
                                </Button>
                            )}
                            <button
                                onClick={() => setIsWarningOpen(false)}
                                className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                다음에 할게요
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

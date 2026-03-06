"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Anchor, ChevronLeft, Coffee, Timer, Gem, Landmark } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background pb-24 max-w-md mx-auto relative overflow-hidden">
            {/* Header / Back Button */}
            <header className="absolute top-0 left-0 right-0 z-50 p-4">
                <Link href="/profile">
                    <Button variant="ghost" size="icon" className="rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
            </header>

            {/* Hero Section */}
            <div className="relative h-[40vh] min-h-[300px] bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

                {/* Floating Elements Background */}
                <motion.div
                    animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4"
                >
                    <Timer className="w-12 h-12 text-emerald-300 blur-sm opacity-20" />
                </motion.div>
                <motion.div
                    animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/3 right-1/4"
                >
                    <Gem className="w-8 h-8 text-teal-300 blur-sm opacity-20" />
                </motion.div>

                {/* Main Hero Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 flex flex-col items-center px-6"
                >
                    <div className="p-4 bg-white/10 rounded-full backdrop-blur-md mb-6 shadow-2xl shadow-emerald-900/40 ring-1 ring-white/20">
                        <Landmark className="w-12 h-12 text-white fill-white/10" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md font-serif mb-2">The Lazy Rich</h1>
                    <p className="text-emerald-100/90 text-sm font-medium tracking-widest uppercase text-center leading-relaxed">
                        Masters' Principles Work,<br />while you thrive.
                    </p>
                </motion.div>
            </div>

            {/* Scrollable Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex-1 px-6 -mt-10 relative z-20"
            >
                <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 mb-8">
                    {/* Brand Story */}
                    <section className="space-y-4 mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <Coffee className="w-4 h-4 text-emerald-500" />
                            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Our Philosophy</h2>
                        </div>
                        <p className="text-sm leading-7 text-foreground/90">
                            <strong>The Lazy Rich</strong>는 '게으른 부자'를 꿈꿉니다. 하지만 이는 아무것도 하지 않는 나태함이 아닙니다. 누구보다 치열하게 <strong>거장들의 철학</strong>을 연구하고, 흔들리지 않는 <strong>투자의 원칙</strong>을 세우는 가장 생산적인 게으름입니다.<br /><br />
                            시장의 소음과 차트를 24시간 감시하며 에너지를 낭비하던 시대는 지났습니다. 우리가 설계한 견고한 원칙이 시장에서 묵묵히 일하게 하세요.
                        </p>
                        <blockquote className="my-6 pl-4 border-l-2 border-emerald-500 py-3 text-sm italic text-foreground/80 font-medium bg-emerald-500/5 rounded-r-lg pr-2">
                            "거장들의 원칙이 당신을 위해 일하게 하세요.<br />그동안 당신은 삶의 더 소중한 가치에 집중하세요."
                        </blockquote>
                        <p className="text-sm leading-7 text-foreground/90 space-y-4">
                            우리는 유행을 타는 테마나 요행을 바라는 투기를 경계합니다. 대신 워렌 버핏, 피터 린치, 레이 달리오와 같은 거장들이 수십 년간 증명해온 <strong>'승리의 법칙'</strong>을 당신의 포트폴리오에 이식합니다.<br /><br />
                            당신의 자산이 원칙 위에서 스스로 자라나는 동안, 당신은 가족과 시간을 보내고, 취미를 즐기며, 더 나은 내일을 꿈꿀 수 있습니다. <strong>단단한 자산과 우아한 여유</strong>, 이것이 우리가 지향하는 진정한 부입니다.
                        </p>
                    </section>

                    {/* Core Values */}
                    <section className="space-y-4 pt-6 border-t border-border/40">
                        <div className="flex items-center gap-2 mb-3">
                            <Gem className="w-4 h-4 text-emerald-500" />
                            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Core Values</h2>
                        </div>

                        <div className="grid gap-4">
                            <div className="flex gap-4 items-start p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-emerald-500/10">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                                    <Anchor className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-foreground mb-1">Essence (본질)</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">요행(Luck)을 버리고 기업의 본질(Fundamental)에 집중합니다. 흔들리지 않는 투자의 기준을 세웁니다.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-emerald-500/10">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                                    <Timer className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-foreground mb-1">Efficiency (효율)</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">최소한의 에너지 소모로 최대한의 성과를 냅니다. 원칙이 일하게 하여 시간을 법니다.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-emerald-500/10">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-foreground mb-1">Ease (편안함)</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">투자는 애쓰지 않아도 되는 편안함이어야 합니다. 시스템이 주는 심리적 안정 위에서 누리는 우아한 여유를 지향합니다.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Slogan */}
                    <div className="pt-8 text-center">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-8" />
                        <p className="text-base font-serif italic text-foreground/80 font-medium mb-8 whitespace-nowrap">
                            " 원칙은 단단하게, 당신은 자유롭게. "
                        </p>

                        <div className="flex flex-col gap-2 items-center">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">All Rights Reserved</span>
                            <span className="text-sm font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <Landmark className="w-4 h-4 fill-current" /> The Lazy Rich
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

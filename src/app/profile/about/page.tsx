"use client";

import { Button } from "@/components/ui/button";
import { Club, Sparkles, Heart, Leaf, Anchor, Footprints, ChevronLeft } from "lucide-react";
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
                    <Club className="w-12 h-12 text-emerald-300 blur-sm opacity-20" />
                </motion.div>
                <motion.div
                    animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/3 right-1/4"
                >
                    <Club className="w-8 h-8 text-teal-300 blur-sm opacity-20" />
                </motion.div>

                {/* Main Hero Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 flex flex-col items-center px-6"
                >
                    <div className="p-4 bg-white/10 rounded-full backdrop-blur-md mb-6 shadow-2xl shadow-emerald-900/40 ring-1 ring-white/20">
                        <Club className="w-12 h-12 text-white fill-white/10" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md font-serif mb-2">Trifoli</h1>
                    <p className="text-emerald-100/90 text-sm font-medium tracking-widest uppercase">Luck is rare, Value is everywhere.</p>
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
                            <Club className="w-4 h-4 text-emerald-500" />
                            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service Story</h2>
                        </div>
                        <p className="text-sm leading-7 text-foreground/90">
                            투자 시장은 거대한 클로버 들판과 같습니다.<br />
                            대부분의 사람들은 눈에 불을 켜고 <strong className="text-emerald-600 dark:text-emerald-400">1% 확률의 '네잎클로버(행운, Luck)'</strong>를 찾으려 혈안이 되어 있습니다.
                            그 '행운'을 찾기 위해 수많은 <strong className="text-emerald-600 dark:text-emerald-400">'세잎클로버(행복, Happiness)'</strong>들을 짓밟고 다닙니다.
                        </p>
                        <blockquote className="my-4 pl-4 border-l-2 border-emerald-500 py-2 text-sm italic text-foreground/80 font-medium bg-emerald-500/5 rounded-r-lg pr-2">
                            "왜 보이지 않는 행운에 당신의 인생을 거나요?<br />
                            당신 발밑에 언제나 당신과 함께하는 99%의 확실한 행복은 보이지 않나요?"
                        </blockquote>
                        <p className="text-sm leading-7 text-foreground/90">
                            <strong>트리폴리(Trifoli)</strong>는 행운을 쫓지 않습니다.
                            지루해 보일지 몰라도, 비바람에도 꺾이지 않고 언제나 들판을 가득 채우는 <strong>세잎클로버(건전한 기업, 배당, 성장)</strong>의 생명력에 집중합니다.
                        </p>
                    </section>

                    {/* Core Values */}
                    <section className="space-y-4 pt-6 border-t border-border/40">
                        <div className="flex items-center gap-2 mb-3">
                            <Leaf className="w-4 h-4 text-emerald-500" />
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
                                    <Footprints className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-foreground mb-1">Ordinary (일상)</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">특별한 정보가 아닌, 상식적인 투자로 비범한 결과를 만듭니다. 꾸준함이 가장 위대한 재능입니다.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-emerald-500/10">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-foreground mb-1">Happiness (행복)</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">투자는 불안한 도박이 아니라, 내 삶을 지켜주는 행복이어야 합니다. 마음이 편안한 투자를 지향합니다.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Slogan */}
                    <div className="pt-8 text-center">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-8" />
                        <p className="text-lg font-serif italic text-foreground/80 font-medium mb-8">
                            " 행운을 쫓지 마세요.<br />행복을 심으세요. "
                        </p>

                        <div className="flex flex-col gap-2 items-center">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Designed by</span>
                            <span className="text-sm font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <Club className="w-4 h-4 fill-current" /> Trifoli Team
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

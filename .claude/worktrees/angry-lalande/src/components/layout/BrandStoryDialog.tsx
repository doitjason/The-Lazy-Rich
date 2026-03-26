"use client";

import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Anchor, Coffee, Timer, Gem, Landmark } from "lucide-react";
import * as React from "react"; // Explicit import

export function BrandStoryDialog({ children }: { children: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden">
                <div className="relative h-40 bg-gradient-to-br from-emerald-500 to-teal-700 flex flex-col items-center justify-center text-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />

                    {/* Animated Intro */}
                    <div className="relative z-10 flex flex-col items-center transform transition-all hover:scale-105 duration-500">
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm mb-3 shadow-lg shadow-emerald-900/20 ring-1 ring-white/30">
                            <Landmark className="w-8 h-8 text-white fill-white/20" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm font-serif">The Lazy Rich</h2>
                        <p className="text-emerald-100 text-xs font-medium tracking-wide mt-1 uppercase opacity-90">Masters' Principles Work, while you thrive.</p>
                    </div>
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto w-full">
                    {/* Brand Story */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Coffee className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Our Philosophy</h3>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/80">
                            <strong>The Lazy Rich</strong>는 아무것도 하지 않는 나태함이 아닌,<br />
                            검증된 <strong>거장들의 원칙</strong>이 나 대신 일하게 하는 가장 생산적인 게으름을 추구합니다.
                        </p>
                        <blockquote className="pl-4 border-l-2 border-emerald-500 py-1 text-sm italic text-foreground/90 font-medium bg-secondary/30 rounded-r-lg p-2">
                            "철학이 당신을 위해 일하게 하세요.<br />
                            그동안 당신은 삶의 더 소중한 가치에 집중하세요."
                        </blockquote>
                        <p className="text-sm leading-relaxed text-foreground/80">
                            우리는 유행이나 요행을 쫓지 않습니다.<br />
                            시장의 소음에서 벗어나, 시간이 흐를수록 더 견고해지는 <strong>단단한 자산과 우아한 여유</strong>를 설계합니다.
                        </p>
                    </div>

                    {/* Core Values */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Gem className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Core Values</h3>
                        </div>

                        <div className="grid gap-3">
                            <div className="flex gap-3 items-start p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    <Anchor className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">Essence (본질)</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-snug">요행(Luck)을 버리고 기업의 본질(Fundamental)에 집중합니다.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    <Timer className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">Efficiency (효율)</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-snug">원칙이 일하게 하여 당신의 시간을 법니다.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">Ease (편안함)</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-snug">시스템이 주는 안정 위에서 누리는 우아한 투자 여유를 지향합니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Slogan */}
                    <div className="pt-6 text-center pb-2">
                        <p className="text-sm font-serif italic text-muted-foreground text-center w-full">
                            " 원칙은 단단하게, 당신은 자유롭게. "
                        </p>
                        <div className="mt-4 flex justify-center">
                            <DialogClose asChild>
                                <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                                    The Lazy Rich와 함께하기 ✨
                                </Button>
                            </DialogClose>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

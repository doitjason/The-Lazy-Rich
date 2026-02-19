"use client";

import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Club, Sparkles, Heart, Leaf, Anchor, Footprints } from "lucide-react";
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
                            <Club className="w-8 h-8 text-white fill-white/20" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm font-serif">Trifoli</h2>
                        <p className="text-emerald-100 text-xs font-medium tracking-wide mt-1 uppercase opacity-90">Luck is rare, Value is everywhere.</p>
                    </div>
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto w-full">
                    {/* Brand Story */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Club className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service Story</h3>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/80">
                            투자 시장은 거대한 클로버 들판과 같습니다.<br />
                            대부분의 사람들은 눈에 불을 켜고 1% 확률의 <strong>'네잎클로버(행운/Luck)'</strong>를 찾으려 혈안이 되어 있습니다.
                            그 '행운'을 찾기 위해 수많은 <strong>'세잎클로버(행복/Happiness)'</strong>들을 짓밟고 다닙니다.
                        </p>
                        <blockquote className="pl-4 border-l-2 border-emerald-500 py-1 text-sm italic text-foreground/90 font-medium bg-secondary/30 rounded-r-lg p-2">
                            "왜 보이지 않는 행운에 당신의 인생을 거나요?<br />
                            당신 발밑에 언제나 당신과 함께하는 99%의 확실한 행복은 보이지 않나요?"
                        </blockquote>
                        <p className="text-sm leading-relaxed text-foreground/80">
                            <strong>트리폴리(Trifoli)</strong>는 행운을 쫓지 않습니다.
                            지루해 보일지 몰라도, 비바람에도 꺾이지 않고 언제나 들판을 가득 채우는 <strong>세잎클로버(건전한 기업, 배당, 성장)</strong>의 생명력에 집중합니다.
                        </p>
                    </div>

                    {/* Core Values */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Leaf className="w-4 h-4 text-emerald-500" />
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
                                    <Footprints className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">Ordinary (일상)</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-snug">특별한 정보가 아닌, 상식적인 투자로 비범한 결과를 만듭니다.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    <Heart className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">Happiness (행복)</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-snug">투자는 불안한 도박이 아니라, 내 삶을 지켜주는 행복이어야 합니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Slogan */}
                    <div className="pt-6 text-center pb-2">
                        <p className="text-sm font-serif italic text-muted-foreground text-center w-full">
                            " 행운을 쫓지 마세요. 행복을 심으세요. "
                        </p>
                        <div className="mt-4 flex justify-center">
                            <DialogClose asChild>
                                <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                                    Trifoli와 함께하기 ♣️
                                </Button>
                            </DialogClose>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

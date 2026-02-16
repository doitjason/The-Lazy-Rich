"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KostolanyEggProps {
    currentPhase: "A1" | "A2" | "A3" | "B1" | "B2" | "B3" | "Neutral";
}

const phases = [
    { id: "A1", label: "저점 형성 (A1)", desc: "거래량 적음, 비관론 팽배", action: "매수 시작", pos: "bottom-left" },
    { id: "A2", label: "상승 기류 (A2)", desc: "거래량 증가, 주가 상승", action: "보유/추매", pos: "mid-left" },
    { id: "A3", label: "과열 광기 (A3)", desc: "낙관론 지배, 거래량 폭증", action: "순차적 매도", pos: "top" },
    { id: "B1", label: "고점 신호 (B1)", desc: "거래량 감소, 하락 시작", action: "전량 매도", pos: "top-right" },
    { id: "B2", label: "하락 추세 (B2)", desc: "거래량 증가, 주가 하락", action: "관망/현금화", pos: "mid-right" },
    { id: "B3", label: "패닉 투매 (B3)", desc: "패닉 매도, 거래량 폭증", action: "매수 준비", pos: "bottom" },
];

export function KostolanyEgg({ currentPhase }: KostolanyEggProps) {
    return (
        <div className="relative w-full max-w-[400px] mx-auto aspect-[4/5] flex items-center justify-center p-8 bg-slate-400/10 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-50 dark:opacity-30" />

            {/* The Egg SVG */}
            <svg viewBox="0 0 200 250" className="w-full h-full relative z-10 drop-shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                {/* Defs for gradients */}
                <defs>
                    <radialGradient id="eggGradient" cx="50%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                    </radialGradient>
                </defs>

                {/* Egg Shape */}
                <path
                    d="M100,20 C140,20 180,80 180,150 C180,210 145,240 100,240 C55,240 20,210 20,150 C20,80 60,20 100,20 Z"
                    fill="url(#eggGradient)"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-foreground/10 transition-all duration-700"
                />

                {/* Phase Segments & Highlights */}
                <g className="opacity-40">
                    <line x1="25" y1="180" x2="175" y2="180" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className="text-foreground/20" />
                    <line x1="40" y1="90" x2="160" y2="90" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className="text-foreground/20" />
                </g>

                {/* Current Phase Indicator Glow */}
                {currentPhase !== "Neutral" && (
                    <motion.path
                        layoutId="indicator"
                        d={getPhasePath(currentPhase)}
                        fill="currentColor"
                        className={cn(
                            "transition-colors duration-500 filter blur-[15px] opacity-20 dark:opacity-30",
                            currentPhase.startsWith("A") ? "text-emerald-500" : "text-rose-500"
                        )}
                    />
                )}

                {/* Current Phase Icon/Text in SVG */}
                {currentPhase !== "Neutral" && (
                    <motion.g
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <circle cx={getPhaseCenter(currentPhase).x} cy={getPhaseCenter(currentPhase).y} r="14" className={cn(
                            "filter drop-shadow-lg",
                            currentPhase.startsWith("A") ? "fill-emerald-500" : "fill-rose-500"
                        )} />
                        <text
                            x={getPhaseCenter(currentPhase).x}
                            y={getPhaseCenter(currentPhase).y + 5}
                            className="text-[12px] font-black fill-white text-center"
                            textAnchor="middle"
                        >
                            {currentPhase}
                        </text>
                    </motion.g>
                )}
            </svg>

            {/* Floating Labels around the egg */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                {phases.map((p) => (
                    <div
                        key={p.id}
                        className={cn(
                            "absolute transition-all duration-500 flex flex-col gap-0.5",
                            getPositionClasses(p.pos),
                            currentPhase === p.id
                                ? "opacity-100 scale-110 drop-shadow-sm"
                                : "opacity-40 dark:opacity-30 scale-90"
                        )}
                    >
                        <span className={cn(
                            "text-sm font-black uppercase tracking-tighter",
                            p.id.startsWith("A") ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}>{p.label}</span>
                        <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">{p.desc}</span>
                        {currentPhase === p.id && (
                            <motion.span
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "text-xs font-bold px-2.5 py-1 rounded-full mt-1.5 w-fit shadow-sm",
                                    p.id.startsWith("A")
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                )}
                            >
                                ✨ {p.action}
                            </motion.span>
                        )}
                    </div>
                ))}
            </div>

            {/* Center Label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
                <span className="text-6xl font-black italic text-foreground">EGG</span>
            </div>
        </div>
    );
}

// Helpers for SVG positioning
function getPhasePath(phase: string) {
    if (phase === "A3") return "M80,30 C100,20 120,30 140,50 L100,90 Z";
    if (phase === "B1") return "M120,30 C140,40 160,60 175,90 L100,90 Z";
    if (phase === "A2") return "M30,120 C25,140 30,160 40,180 L100,150 Z";
    if (phase === "B2") return "M170,120 C175,140 170,160 160,180 L100,150 Z";
    if (phase === "A1") return "M40,190 C60,220 80,240 100,240 L100,180 Z";
    if (phase === "B3") return "M100,240 C120,240 140,220 160,190 L100,180 Z";
    return "";
}

function getPhaseCenter(phase: string) {
    const centers: Record<string, { x: number, y: number }> = {
        A3: { x: 100, y: 50 },
        B1: { x: 140, y: 70 },
        B2: { x: 160, y: 150 },
        B3: { x: 130, y: 210 },
        A1: { x: 70, y: 210 },
        A2: { x: 40, y: 150 },
    };
    return centers[phase] || { x: 100, y: 125 };
}

function getPositionClasses(pos: string) {
    if (pos === "top") return "top-8 left-1/2 -translate-x-1/2 text-center items-center";
    if (pos === "top-right") return "top-[20%] right-6 items-end text-right";
    if (pos === "mid-right") return "top-1/2 right-4 -translate-y-1/2 items-end text-right";
    if (pos === "bottom") return "bottom-8 left-1/2 -translate-x-1/2 text-center items-center";
    if (pos === "bottom-left") return "bottom-[20%] left-6 items-start text-left";
    if (pos === "mid-left") return "top-1/2 left-4 -translate-y-1/2 items-start text-left";
    return "";
}

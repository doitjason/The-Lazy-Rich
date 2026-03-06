"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KostolanyEggProps {
    currentPhase: "A1" | "A2" | "A3" | "B1" | "B2" | "B3" | "Neutral";
    interestRateTrend?: "Rising" | "Falling" | "Flat";
}

const phases = [
    { id: "A1", label: "A1 수정 국면", desc: "거래량 감소, 비관론 팽배", action: "매수 시작", pos: "bottom-left" },
    { id: "A2", label: "A2 동행 국면", desc: "거래량 증가, 주가 상승", action: "보유/추매", pos: "mid-left" },
    { id: "A3", label: "A3 과열 국면", desc: "낙관론 지배, 거래량 폭증", action: "순차 매도", pos: "top" },
    { id: "B1", label: "B1 수정 국면", desc: "거래량 감소, 하락 시작", action: "전량 매도", pos: "top-right" },
    { id: "B2", label: "B2 동행 국면", desc: "거래량 증가, 주가 하락", action: "관망/현금화", pos: "mid-right" },
    { id: "B3", label: "B3 과장 국면", desc: "패닉 매도, 거래량 폭증", action: "매수 준비", pos: "bottom" },
];

export function KostolanyEgg({ currentPhase, interestRateTrend }: KostolanyEggProps) {
    return (
        <div className="flex flex-col gap-4 w-full max-w-[400px] mx-auto">
            {/* 1. Macro Phase Egg */}
            <div className="relative w-full aspect-[4/5] flex items-center justify-center p-6 bg-slate-400/5 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-50 dark:opacity-30" />

                {/* The Egg SVG */}
                <svg viewBox="0 0 200 250" className="w-full h-full relative z-10 drop-shadow-[0_0_50px_rgba(99,102,241,0.15)]">
                    <defs>
                        <radialGradient id="eggOverlayGradient" cx="50%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </radialGradient>

                        {/* Comet trail glow - soft outer */}
                        <filter id="softGlow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Comet trail glow - tight inner */}
                        <filter id="tightGlow">
                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Arrow head glow - intense */}
                        <filter id="arrowGlow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Main Egg Body with Glass Reflection */}
                    <path
                        d="M100,20 C140,20 180,80 180,150 C180,210 145,240 100,240 C55,240 20,210 20,150 C20,80 60,20 100,20 Z"
                        fill="url(#eggOverlayGradient)"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-foreground/5 dark:text-white/10"
                    />

                    {/* Static Cycle Arrows */}
                    <g className="opacity-40">
                        {/* GREEN arrow path: B3 (bottom) → A3 (top), left side */}
                        <path
                            d="M100,225 C35,225 35,50 95,37"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray="4 6"
                        />
                        <path d="M92,32 L105,37 L92,42 Z" fill="#10b981" transform="rotate(-15, 95, 37)" />

                        {/* RED arrow path: A3 (top) → B3 (bottom), right side */}
                        <path
                            d="M105,37 C165,50 165,225 100,225"
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray="4 6"
                        />
                        <path d="M95,220 L108,225 L95,230 Z" fill="#f43f5e" transform="rotate(170, 100, 225)" />
                    </g>

                    {/* Phase Segments - Subtler */}
                    <g className="opacity-20">
                        <line x1="25" y1="180" x2="175" y2="180" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
                        <line x1="40" y1="90" x2="160" y2="90" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
                    </g>

                    {/* Current Phase Indicator Glow */}
                    {currentPhase !== "Neutral" && (
                        <motion.path
                            layoutId="indicator"
                            d={getPhasePath(currentPhase)}
                            fill="currentColor"
                            className={cn(
                                "transition-colors duration-500 filter blur-[20px] opacity-30 dark:opacity-40",
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
                            <circle
                                cx={getPhaseCenter(currentPhase).x}
                                cy={getPhaseCenter(currentPhase).y}
                                r="12"
                                className={cn(
                                    "filter drop-shadow-[0_0_8px_rgba(0,0,0,0.2)]",
                                    currentPhase.startsWith("A") ? "fill-emerald-500" : "fill-rose-500"
                                )}
                            />
                            <text
                                x={getPhaseCenter(currentPhase).x}
                                y={getPhaseCenter(currentPhase).y + 4}
                                className="text-[10px] font-black fill-white"
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
                            {currentPhase === p.id && (
                                <>
                                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap mt-0.5">{p.desc}</span>
                                    <motion.span
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "text-xs font-bold px-2 py-0.5 rounded-full mt-1 w-fit shadow-sm",
                                            p.id.startsWith("A")
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                        )}
                                    >
                                        ✨ {p.action}
                                    </motion.span>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Center Label */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
                    <span className="text-6xl font-black italic text-foreground">EGG</span>
                </div>
            </div>

            {/* 2. Real-time Data Panel */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Interest Rate Trend</span>
                    <div className="flex items-center gap-2">
                        {interestRateTrend === "Rising" && <span className="text-foreground font-extrabold text-[13px]">↗ Rising</span>}
                        {interestRateTrend === "Falling" && <span className="text-foreground font-extrabold text-[13px]">↘ Falling</span>}
                        {interestRateTrend === "Flat" && <span className="text-muted-foreground font-extrabold text-[13px]">→ Flat</span>}
                        {!interestRateTrend && <span className="text-muted-foreground text-xs">-</span>}
                    </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Market Phase</span>
                    <span className="font-extrabold text-foreground text-[13px]">
                        {phases.find(p => p.id === currentPhase)?.label || "Neutral"}
                    </span>
                </div>
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
        B1: { x: 145, y: 70 },
        B2: { x: 155, y: 150 },
        B3: { x: 130, y: 210 },
        A1: { x: 70, y: 210 },
        A2: { x: 50, y: 130 },
    };
    return centers[phase] || { x: 100, y: 125 };
}

function getPositionClasses(pos: string) {
    if (pos === "top") return "top-8 left-1/2 -translate-x-1/2 text-center items-center";
    if (pos === "top-right") return "top-[20%] right-4 items-end text-right";
    if (pos === "mid-right") return "top-[45%] right-2 -translate-y-1/2 items-end text-right";
    if (pos === "bottom") return "bottom-8 left-1/2 -translate-x-1/2 text-center items-center";
    if (pos === "bottom-left") return "bottom-[20%] left-4 items-start text-left";
    if (pos === "mid-left") return "top-[38%] left-2 -translate-y-1/2 items-start text-left";
    return "";
}

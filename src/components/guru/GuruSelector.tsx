"use client";

import { useState, useCallback } from "react";
import { GURU_PERSONAS, GuruPersona } from "@/lib/guru-personas";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { AlertTriangle, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuruSelectorProps {
    onSelect: (guru: GuruPersona) => void;
}

const SWIPE_THRESHOLD = 50;

export function GuruSelector({ onSelect }: GuruSelectorProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const personas = GURU_PERSONAS;
    const currentGuru = personas[currentIndex];

    const paginate = useCallback((newDirection: number) => {
        setDirection(newDirection);
        setCurrentIndex((prev) => {
            let next = prev + newDirection;
            if (next < 0) next = personas.length - 1;
            if (next >= personas.length) next = 0;
            return next;
        });
    }, [personas.length]);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -SWIPE_THRESHOLD) {
            paginate(1);
        } else if (info.offset.x > SWIPE_THRESHOLD) {
            paginate(-1);
        }
    };

    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                x: { type: "spring" as const, stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
            },
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -300 : 300,
            opacity: 0,
            scale: 0.9,
            transition: {
                x: { type: "spring" as const, stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
            },
        }),
    };

    // Color mapping for card glow effect
    const glowColors: Record<string, string> = {
        "bg-blue-600": "shadow-blue-500/30",
        "bg-purple-600": "shadow-purple-500/30",
        "bg-teal-600": "shadow-teal-500/30",
        "bg-red-600": "shadow-red-500/30",
        "bg-green-600": "shadow-green-500/30",
    };

    const bgGradients: Record<string, string> = {
        "bg-blue-600": "from-blue-600/20 via-blue-500/5 to-transparent",
        "bg-purple-600": "from-purple-600/20 via-purple-500/5 to-transparent",
        "bg-teal-600": "from-teal-600/20 via-teal-500/5 to-transparent",
        "bg-red-600": "from-red-600/20 via-red-500/5 to-transparent",
        "bg-green-600": "from-green-600/20 via-green-500/5 to-transparent",
    };

    return (
        <div className="space-y-4">
            {/* Disclaimer Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2 mx-10">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                    이 AI는 가상의 페르소나이며, 투자의 책임은 전적으로 본인에게 있습니다.
                </p>
            </div>

            {/* Carousel Container */}
            <div className="relative overflow-hidden px-2">
                {/* Navigation Arrows */}
                <button
                    onClick={() => paginate(-1)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-foreground/60 hover:bg-white/40 hover:text-foreground transition-all active:scale-90"
                    aria-label="이전 멘토"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                    onClick={() => paginate(1)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-foreground/60 hover:bg-white/40 hover:text-foreground transition-all active:scale-90"
                    aria-label="다음 멘토"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>

                {/* Swipeable Card */}
                <div className="flex items-center justify-center min-h-[320px] px-8">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentGuru.id}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.7}
                            onDragEnd={handleDragEnd}
                            className="w-full cursor-grab active:cursor-grabbing"
                        >
                            <div
                                className={`relative overflow-hidden rounded-2xl border border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-2xl shadow-2xl ${glowColors[currentGuru.color] || ""} p-6`}
                            >
                                {/* Background Gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${bgGradients[currentGuru.color] || ""} pointer-events-none`} />

                                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                    {/* Avatar */}
                                    <motion.div
                                        className={`h-20 w-20 rounded-full ${currentGuru.color} flex items-center justify-center text-white shadow-lg text-4xl`}
                                        initial={{ scale: 0.8, rotate: -10 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    >
                                        {currentGuru.avatarEmoji}
                                    </motion.div>

                                    {/* Name & Tag */}
                                    <div className="space-y-1.5">
                                        <h3 className="text-xl font-bold text-foreground">{currentGuru.name}</h3>
                                        <span className="inline-block px-4 py-1.5 rounded-full text-sm bg-primary/10 text-primary font-bold border border-primary/20">
                                            {currentGuru.tag}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
                                        {currentGuru.description}
                                    </p>

                                    {/* Intro Quote */}
                                    <div className="w-full bg-white/30 dark:bg-white/5 rounded-xl p-3 border border-white/20">
                                        <p className="text-xs text-foreground/80 italic leading-relaxed line-clamp-3">
                                            &ldquo;{currentGuru.introMessage}&rdquo;
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom Glow Line */}
                                <div className={`absolute inset-x-0 bottom-0 h-1 ${currentGuru.color} opacity-60`} />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2">
                {personas.map((guru, index) => (
                    <button
                        key={guru.id}
                        onClick={() => {
                            setDirection(index > currentIndex ? 1 : -1);
                            setCurrentIndex(index);
                        }}
                        className={`transition-all duration-300 rounded-full ${index === currentIndex
                            ? "w-6 h-2.5 bg-primary shadow-sm shadow-primary/30"
                            : "w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                            }`}
                        aria-label={guru.name}
                    />
                ))}
            </div>

            {/* Counter */}
            <p className="text-center text-xs text-muted-foreground">
                {currentIndex + 1} / {personas.length}
            </p>

            {/* CTA Button */}
            <div className="px-10">
                <Button
                    onClick={() => onSelect(currentGuru)}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-sky-600 hover:from-primary/90 hover:to-sky-600/90 shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98]"
                >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {currentGuru.name}와 대화 시작하기
                </Button>
            </div>
        </div>
    );
}

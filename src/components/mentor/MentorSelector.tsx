"use client";

import { useState, useCallback } from "react";
import { AI_MENTORS, AIMentor } from "@/lib/ai-mentors";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { AlertTriangle, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MentorSelectorProps {
    onSelect: (mentor: AIMentor) => void;
}

const SWIPE_THRESHOLD = 50;

export function MentorSelector({ onSelect }: MentorSelectorProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
 
    const mentors = AI_MENTORS;
    const currentMentor = mentors[currentIndex];
 
    const paginate = useCallback((newDirection: number) => {
        setDirection(newDirection);
        setCurrentIndex((prev) => {
            let next = prev + newDirection;
            if (next < 0) next = mentors.length - 1;
            if (next >= mentors.length) next = 0;
            return next;
        });
    }, [mentors.length]);

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
        <div className="flex flex-col space-y-4 pb-1">
            {/* Carousel Container */}
            <div className="relative overflow-hidden px-2">
                {/* Navigation Arrows */}
                <button
                    onClick={() => paginate(-1)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/30 flex items-center justify-center text-foreground/80 dark:text-foreground/60 hover:bg-white dark:hover:bg-white/40 hover:text-foreground transition-all active:scale-90 shadow-sm"
                    aria-label="이전 AI 투자 멘토"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                    onClick={() => paginate(1)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/30 flex items-center justify-center text-foreground/80 dark:text-foreground/60 hover:bg-white dark:hover:bg-white/40 hover:text-foreground transition-all active:scale-90 shadow-sm"
                    aria-label="다음 AI 투자 멘토"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>

                {/* Swipeable Card */}
                <div className="flex items-center justify-center min-h-[380px] px-8">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentMentor.id}
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
                                onClick={() => onSelect(currentMentor)}
                                className={`relative overflow-hidden rounded-2xl border border-black/5 dark:border-white/20 bg-white dark:bg-black/40 backdrop-blur-2xl shadow-xl dark:shadow-2xl ${glowColors[currentMentor.color] || ""} p-6 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group`}
                            >
                                {/* Background Gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${bgGradients[currentMentor.color] || ""} pointer-events-none`} />
 
                                <div className="relative z-10 flex flex-col items-center text-center space-y-5">
                                    {/* Avatar */}
                                    <motion.div
                                        className={`h-22 w-22 rounded-full ${currentMentor.color} flex items-center justify-center text-white shadow-2xl text-5xl relative`}
                                        initial={{ scale: 0.8, y: 10 }}
                                        animate={{
                                            scale: 1,
                                            y: [0, -8, 0],
                                        }}
                                        transition={{
                                            scale: { type: "spring", stiffness: 200, damping: 15 },
                                            y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                                        }}
                                    >
                                        <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse" />
                                        <span className="relative z-10">{currentMentor.avatarEmoji}</span>
                                    </motion.div>

                                    {/* Name & Tag */}
                                    <div className="space-y-1.5">
                                        <h3 className="text-xl font-bold text-foreground">{currentMentor.name}</h3>
                                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold border bg-primary/10 text-primary border-primary/20">
                                            {currentMentor.tag}
                                        </span>
                                    </div>
 
                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                                        {currentMentor.description}
                                    </p>
 
                                    {/* Intro Quote */}
                                    <div className="w-full bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl p-4 border border-black/5 dark:border-white/10 relative group">
                                        <div className="absolute -top-3 left-4 px-2 bg-white dark:bg-black text-[9px] font-bold text-muted-foreground uppercase tracking-widest border border-black/5 dark:border-white/10 rounded-full">
                                            Mentor Message
                                        </div>
                                        <p className="text-[13px] text-foreground/80 italic leading-relaxed line-clamp-4">
                                            &ldquo;{currentMentor.introMessage}&rdquo;
                                        </p>
                                    </div>
                                </div>

                                <div className={`absolute inset-x-0 bottom-0 h-1 ${currentMentor.color} opacity-60`} />

                                {/* Interactive Overlay Hint */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] dark:group-hover:bg-white/[0.02] transition-colors pointer-events-none" />
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md border border-black/10 dark:border-white/20 shadow-lg">
                                        <MessageCircle className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[11px] font-bold">대화 시작</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2">
                {mentors.map((mentor, index) => (
                    <button
                        key={mentor.id}
                        onClick={() => {
                            setDirection(index > currentIndex ? 1 : -1);
                            setCurrentIndex(index);
                        }}
                        className={`transition-all duration-300 rounded-full ${index === currentIndex
                            ? "w-6 h-2.5 bg-primary shadow-sm shadow-primary/30"
                            : "w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                            }`}
                        aria-label={mentor.name}
                    />
                ))}
            </div>

            {/* Counter */}
            <p className="text-center text-[10px] text-muted-foreground -mt-1">
                {currentIndex + 1} / {mentors.length}
            </p>

            {/* Disclaimer Banner restored for legal safety */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg py-2 px-3 flex items-center gap-2 mx-6">
                <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <p className="text-[9px] text-amber-700 dark:text-amber-400 leading-tight">
                    AI 투자 멘토는 가상의 캐릭터이며, 투자 권유가 아닙니다. 책임은 전적으로 본인에게 있습니다.
                </p>
            </div>
        </div >
    );
}

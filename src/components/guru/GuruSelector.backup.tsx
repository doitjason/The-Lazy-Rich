"use client";

import { Card } from "@/components/ui/card";
import { GURU_PERSONAS, GuruPersona } from "@/lib/guru-personas";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface GuruSelectorProps {
    onSelect: (guru: GuruPersona) => void;
}

export function GuruSelector({ onSelect }: GuruSelectorProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-6">
            {/* Disclaimer Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                    이 AI는 가상의 페르소나이며, 투자의 책임은 전적으로 본인에게 있습니다.
                </p>
            </div>




            <motion.div
                className="grid grid-cols-2 gap-3"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {GURU_PERSONAS.map((guru) => (
                    <motion.div key={guru.id} variants={item}>
                        <Card
                            className="group relative cursor-pointer overflow-hidden border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md transition-all hover:bg-white/80 hover:shadow-lg hover:-translate-y-1 active:scale-95"
                            onClick={() => onSelect(guru)}
                        >
                            <div className="p-3 flex flex-col items-center text-center space-y-2">
                                {/* Avatar with Emoji */}
                                <div className={`h-12 w-12 rounded-full ${guru.color} flex items-center justify-center text-white shadow-md text-2xl`}>
                                    {guru.avatarEmoji}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-xs leading-tight">{guru.name}</h3>
                                    <p className="text-[10px] text-muted-foreground">{guru.englishName}</p>
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] bg-primary/10 text-primary font-medium">
                                        {guru.tag}
                                    </span>
                                </div>
                                {/* Description */}
                                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    {guru.description}
                                </p>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}

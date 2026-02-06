"use client";

import { Card } from "@/components/ui/card";
import { GURU_PERSONAS, GuruPersona } from "@/lib/dummy-data";
import { motion } from "framer-motion";

interface GuruSelectorProps {
    onSelect: (guru: GuruPersona) => void;
}

export function GuruSelector({ onSelect }: GuruSelectorProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Select Your Guru</h2>
                <p className="text-muted-foreground">Choose a persona that aligns with your financial goals.</p>
            </div>

            <motion.div
                className="grid grid-cols-2 gap-4"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {GURU_PERSONAS.map((guru) => (
                    <motion.div key={guru.id} variants={item}>
                        <Card
                            className="group relative cursor-pointer overflow-hidden border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md transition-all hover:bg-white/80 hover:shadow-lg hover:-translate-y-1"
                            onClick={() => onSelect(guru)}
                        >
                            <div className="p-4 flex flex-col items-center text-center space-y-3">
                                <div className={`h-12 w-12 rounded-full ${guru.color} flex items-center justify-center text-white shadow-md`}>
                                    <span className="text-lg font-bold">{guru.avatarInitials}</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-sm">{guru.name}</h3>
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-medium">
                                        {guru.tag}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
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

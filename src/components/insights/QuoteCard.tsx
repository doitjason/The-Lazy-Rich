"use client";

import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export function QuoteCard() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Quote className="h-24 w-24 transform rotate-12" />
                </div>
                <CardContent className="p-8 text-center space-y-4 relative z-10">
                    <p className="text-xs font-medium text-primary tracking-widest uppercase">Thought of the Day</p>
                    <blockquote className="text-xl md:text-2xl font-serif italic leading-relaxed">
                        "The stock market is a device for transferring money from the impatient to the patient."
                    </blockquote>
                    <footer className="text-sm font-medium text-muted-foreground">
                        — Warren Buffett
                    </footer>
                </CardContent>
            </Card>
        </motion.div>
    );
}

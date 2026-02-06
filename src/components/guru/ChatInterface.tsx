"use client";

import { Send, User as UserIcon, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuruPersona } from "@/lib/dummy-data";
import { motion } from "framer-motion";

interface ChatInterfaceProps {
    guru: GuruPersona;
    onBack: () => void;
}

export function ChatInterface({ guru, onBack }: ChatInterfaceProps) {
    return (
        <motion.div
            className="flex flex-col h-[calc(100vh-180px)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4">
                <Button variant="ghost" size="xs" onClick={onBack} className="text-muted-foreground">
                    ←
                </Button>
                <div className={`h-10 w-10 rounded-full ${guru.color} flex items-center justify-center text-white shadow-sm`}>
                    <span className="font-bold">{guru.avatarInitials}</span>
                </div>
                <div>
                    <h3 className="font-semibold">{guru.name}</h3>
                    <p className="text-xs text-primary">{guru.tag}</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {/* AI Message - Intro */}
                <motion.div
                    className="flex gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border border-white/10 flex-shrink-0">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl rounded-tl-none p-3 px-4 max-w-[80%] text-sm shadow-sm">
                        <p>{guru.introMessage}</p>
                    </div>
                </motion.div>

                {/* User Message - Dummy Example */}
                <motion.div
                    className="flex gap-3 flex-row-reverse"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/10 flex-shrink-0">
                        <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-primary/90 text-primary-foreground backdrop-blur-md rounded-2xl rounded-tr-none p-3 px-4 max-w-[80%] text-sm shadow-sm">
                        <p>What should I do with my savings in this inflation?</p>
                    </div>
                </motion.div>

                {/* AI Response Placeholder - Thinking */}
                <motion.div
                    className="flex gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                >
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border border-white/10 flex-shrink-0">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl rounded-tl-none p-3 px-4 max-w-[80%] text-sm shadow-sm">
                        <div className="flex space-x-1 items-center h-5">
                            <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-0"></div>
                            <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-150"></div>
                            <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-300"></div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Input Area */}
            <div className="pt-4 mt-auto">
                <form className="relative flex items-center">
                    <Input
                        placeholder={`Ask ${guru.name} (API Day 9)...`}
                        className="pr-12 bg-white/50 dark:bg-black/20 border-white/20 backdrop-blur-md"
                    />
                    <Button
                        size="icon-sm"
                        className="absolute right-1 top-1 h-8 w-8 rounded-full"
                        type="submit"
                        onClick={(e) => e.preventDefault()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </motion.div>
    );
}

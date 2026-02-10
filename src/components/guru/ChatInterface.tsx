"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Send, ArrowLeft, Bot, User as UserIcon, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuruPersona, getIntroMessage, SupportedLanguage } from "@/lib/guru-personas";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface ChatInterfaceProps {
    guru: GuruPersona;
    onBack: () => void;
    userId?: string;
    sessionId?: string;
}

// Quick suggestion tags in multiple languages
const QUICK_SUGGESTIONS: { [key in SupportedLanguage]: string[] } = {
    ko: ["내 포트폴리오 분석해줘", "요즘 시황에 대해 의견을 들려줘"],
    en: ["Analyze my portfolio", "What's your take on the current market?"],
    vi: ["Phân tích danh mục của tôi", "Ý kiến của bạn về thị trường hiện tại?"],
};

export function ChatInterface({ guru, onBack, userId, sessionId }: ChatInterfaceProps) {
    const { currency } = useCurrency();

    // Determine language from currency setting
    const language: SupportedLanguage = useMemo(() => {
        if (currency === "USD") return "en";
        // Add VND -> vi mapping when VND currency is added
        return "ko"; // Default to Korean for KRW
    }, [currency]);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: "intro",
            role: "assistant",
            content: getIntroMessage(guru, language),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setStreamingContent("");

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].filter(m => m.id !== "intro").map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    personaId: guru.id,
                    sessionId,
                    userId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const data = line.slice(6);
                            if (data === "[DONE]") {
                                // Streaming complete
                                const assistantMessage: Message = {
                                    id: (Date.now() + 1).toString(),
                                    role: "assistant",
                                    content: fullContent,
                                };
                                setMessages((prev) => [...prev, assistantMessage]);
                                setStreamingContent("");
                            } else {
                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.content) {
                                        fullContent += parsed.content;
                                        setStreamingContent(fullContent);
                                    }
                                } catch {
                                    // Ignore parse errors
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };



    return (
        <motion.div
            className="flex flex-col h-[calc(100vh-180px)]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Disclaimer Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
                    이 AI는 가상의 페르소나이며, 투자 책임은 본인에게 있습니다.
                </p>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className={`h-10 w-10 rounded-full ${guru.color} flex items-center justify-center text-white shadow-sm text-xl`}>
                    {guru.avatarEmoji}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm">{guru.name}</h3>
                    <p className="text-xs text-primary">{guru.tag}</p>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <AnimatePresence mode="popLayout">
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === "user"
                                ? "bg-primary/20 border border-primary/10"
                                : "bg-white/20 border border-white/10"
                                }`}>
                                {message.role === "user" ? (
                                    <UserIcon className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                    <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                            </div>
                            <div
                                className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${message.role === "user"
                                    ? "bg-primary/90 text-primary-foreground rounded-tr-none"
                                    : "bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 rounded-tl-none"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Streaming Message */}
                {streamingContent && (
                    <motion.div
                        className="flex gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center border border-white/10 flex-shrink-0">
                            <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl rounded-tl-none p-3 max-w-[80%] text-sm shadow-sm">
                            <p className="whitespace-pre-wrap leading-relaxed">{streamingContent}</p>
                            <span className="inline-block w-1.5 h-4 bg-primary/50 ml-0.5 animate-pulse" />
                        </div>
                    </motion.div>
                )}

                {/* Loading Indicator */}
                {isLoading && !streamingContent && (
                    <motion.div
                        className="flex gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center border border-white/10 flex-shrink-0">
                            <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl rounded-tl-none p-3 text-sm shadow-sm">
                            <div className="flex space-x-1 items-center h-5">
                                <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="pt-3 mt-auto space-y-2">
                {/* Quick Suggestion Tags - Only show at start of conversation */}
                {messages.length === 1 && !isLoading && (
                    <motion.div
                        className="flex flex-wrap gap-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {QUICK_SUGGESTIONS[language].map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => {
                                    // Directly trigger message submission
                                    const userMessage: Message = {
                                        id: Date.now().toString(),
                                        role: "user",
                                        content: suggestion,
                                    };
                                    setMessages((prev) => [...prev, userMessage]);
                                    setIsLoading(true);

                                    // Trigger the API call
                                    fetch("/api/chat", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            messages: [{ role: "user", content: suggestion }],
                                            personaId: guru.id,
                                            sessionId,
                                            userId,
                                        }),
                                    }).then(async (response) => {
                                        if (!response.ok) throw new Error("Failed");
                                        const reader = response.body?.getReader();
                                        const decoder = new TextDecoder();
                                        let fullContent = "";

                                        if (reader) {
                                            while (true) {
                                                const { done, value } = await reader.read();
                                                if (done) break;
                                                const chunk = decoder.decode(value);
                                                const lines = chunk.split("\n");
                                                for (const line of lines) {
                                                    if (line.startsWith("data: ")) {
                                                        const data = line.slice(6);
                                                        if (data === "[DONE]") {
                                                            setMessages((prev) => [...prev, {
                                                                id: (Date.now() + 1).toString(),
                                                                role: "assistant",
                                                                content: fullContent,
                                                            }]);
                                                            setStreamingContent("");
                                                        } else {
                                                            try {
                                                                const parsed = JSON.parse(data);
                                                                if (parsed.content) {
                                                                    fullContent += parsed.content;
                                                                    setStreamingContent(fullContent);
                                                                }
                                                            } catch { }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }).catch(() => {
                                        setMessages((prev) => [...prev, {
                                            id: (Date.now() + 1).toString(),
                                            role: "assistant",
                                            content: "죄송합니다. 오류가 발생했습니다.",
                                        }]);
                                    }).finally(() => {
                                        setIsLoading(false);
                                    });
                                }}
                                className="px-3 py-1.5 text-xs rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors duration-200"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </motion.div>
                )}



                {/* Message Input */}
                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`${guru.name}에게 질문하세요...`}
                        className="pr-12 bg-white/50 dark:bg-black/20 border-white/20 backdrop-blur-md"
                        disabled={isLoading}
                    />
                    <Button
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                        type="submit"
                        disabled={!input.trim() || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>
        </motion.div>
    );
}

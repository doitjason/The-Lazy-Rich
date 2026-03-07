"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Send, ArrowLeft, Bot, User as UserIcon, Loader2, AlertTriangle, BarChart as ChartIcon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuruPersona, getIntroMessage, SupportedLanguage } from "@/lib/guru-personas";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChartRenderer, ChartData } from "./ChartRenderer";

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
    initialMessage?: string;
}

// Quick suggestion tags in multiple languages
import Link from "next/link";
import { PlusCircle, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const getQuickSuggestions = (guruId: string, language: SupportedLanguage): string[] => {
    const commonQuestion = language === "ko" ? "내 포트폴리오를 분석해주세요" : "Analyze my portfolio";

    if (language !== "ko") {
        return [commonQuestion, "What's your take on the current market?"];
    }

    switch (guruId) {
        case "sage":
            return [commonQuestion, "내재 가치 평가는 어떤 기준으로 하나요?", "기업의 경제적 해자는 어떻게 파악하나요?"];
        case "hero":
            return [commonQuestion, "일상 속에서 10배 주식(텐배거)을 찾는 비결은?", "PEG 비율로 성장주를 평가하는 방법이 궁금해요"];
        case "architect":
            return [commonQuestion, "현재 거시 경제는 사계절 중 어떤 계절인가요?", "올웨더 포트폴리오의 핵심 원칙은?"];
        case "father":
            return [commonQuestion, "인덱스 펀드에 장기 투자해야 하는 명확한 이유는?", "수도 없이 생기는 테마주 투자의 위험성은?"];
        default:
            return [commonQuestion, "요즘 시황에 대해 의견을 들려줘"];
    }
};

export function ChatInterface({ guru, onBack, userId, sessionId, initialMessage }: ChatInterfaceProps) {
    const { currency } = useCurrency();
    const { signInWithGoogle } = useAuth();

    // Determine language from currency setting
    const language: SupportedLanguage = useMemo(() => {
        // Force Korean as default regardless of currency for now
        // if (currency === "USD") return "en"; 
        return "ko";
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

    // History loading state
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const fetchedSessionId = useRef<string | null>(null);

    // Fetch existing messages if sessionId exists
    useEffect(() => {
        if (!sessionId || isHistoryLoading || fetchedSessionId.current === sessionId) return;

        const fetchMessages = async () => {
            setIsHistoryLoading(true);
            try {
                console.log(`[ChatHistory] Fetching for session: ${sessionId}`);
                const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.messages && data.messages.length > 0) {
                        console.log(`[ChatHistory] Found ${data.messages.length} messages`);
                        const formattedMessages: Message[] = data.messages.map((m: any) => ({
                            id: m.id,
                            role: m.role,
                            content: m.content,
                        }));
                        setMessages(formattedMessages);
                        // Use instant scroll for historical messages
                        setTimeout(() => {
                            messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
                        }, 100);
                    } else {
                        console.log("[ChatHistory] No previous messages found");
                    }
                }
            } catch (error) {
                console.error("[ChatHistory] Failed to fetch messages:", error);
            } finally {
                setIsHistoryLoading(false);
                fetchedSessionId.current = sessionId;
            }
        };
        fetchMessages();
    }, [sessionId, isHistoryLoading]);

    const hasSentInitialRef = useRef(false);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: content.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setStreamingContent("");

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage]
                        .filter(m => m.id !== "intro")
                        .slice(-20)
                        .map(m => ({
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

    // Auto trigger initialMessage
    useEffect(() => {
        const isSessionReady = userId ? (!!sessionId && fetchedSessionId.current === sessionId) : true;

        if (
            initialMessage &&
            isSessionReady &&
            !isHistoryLoading &&
            !hasSentInitialRef.current
        ) {
            hasSentInitialRef.current = true;
            sendMessage(initialMessage);
        }
    }, [initialMessage, sessionId, userId, isHistoryLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = input;
        setInput("");
        await sendMessage(msg);
    };



    const handleReset = async () => {
        if (isLoading) return;
        if (confirm("⚠️ 모든 대화 기록을 영구적으로 삭제하시겠습니까?\n이 작업은 취소할 수 없으며, 기존의 모든 조언과 대화 내용이 사라집니다.")) {
            setIsLoading(true);
            try {
                if (sessionId) {
                    await fetch(`/api/chat/messages?sessionId=${sessionId}`, {
                        method: 'DELETE',
                    });
                }

                setMessages([
                    {
                        id: "intro",
                        role: "assistant",
                        content: getIntroMessage(guru, language),
                    },
                ]);
                setStreamingContent("");
            } catch (error) {
                console.error("Failed to reset chat:", error);
                alert("대화 초기화 중 오류가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const isPreparing = !!(isHistoryLoading || (initialMessage && !hasSentInitialRef.current));

    return (
        <motion.div
            className="flex flex-col h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Minimal Legal Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg py-1.5 px-3 mb-3 flex items-center justify-center gap-1.5 opacity-90">
                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-tight font-medium text-center">
                    AI Mentor는 가상의 캐릭터이며 투자 권유가 아닙니다. 모든 투자 책임은 본인에게 있습니다.
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
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 px-2 text-[11px] text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all gap-1.5 font-medium"
                >
                    <RotateCcw className="h-3 w-3" />
                    대화 리셋하기
                </Button>
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
                                ? "bg-emerald-500/10 border border-emerald-500/20"
                                : "bg-white/20 border border-white/10"
                                }`}>
                                {message.role === "user" ? (
                                    <UserIcon className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                    <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                            </div>
                            <div
                                className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${message.role === "user"
                                    ? "bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-emerald-500/10 rounded-tr-none"
                                    : "bg-white dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 rounded-tl-none shadow-sm"
                                    }`}
                            >
                                {(() => {
                                    const parts = [];
                                    const regex = /\[CHART_DATA\]([\s\S]*?)\[\/CHART_DATA\]/g;
                                    let lastIndex = 0;
                                    let match;

                                    // Clone content to avoid mutation issues if any
                                    // Remove special action tags from visible text
                                    const content = message.content.replace(/\[ACTION:[A-Z_]+\]/g, "").trim();

                                    while ((match = regex.exec(content)) !== null) {
                                        if (match.index > lastIndex) {
                                            parts.push(<p key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed mb-2">{content.substring(lastIndex, match.index)}</p>);
                                        }

                                        try {
                                            // Handle potential single quotes or trailing commas from LLM
                                            let jsonStr = match[1];
                                            // Simple fix for single quotes on keys if present
                                            if (!jsonStr.includes('"') && jsonStr.includes("'")) {
                                                jsonStr = jsonStr.replace(/'/g, '"');
                                            }
                                            const chartJson = JSON.parse(jsonStr);
                                            parts.push(<ChartRenderer key={`chart-${match.index}`} chartData={chartJson} />);
                                        } catch (e) {
                                            console.warn("Retrying chart parse...", e);
                                        }

                                        lastIndex = regex.lastIndex;
                                    }

                                    if (lastIndex < content.length) {
                                        parts.push(<p key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">{content.substring(lastIndex)}</p>);
                                    }

                                    return parts.length > 0 ? parts : <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
                                })()}
                                {/* Action Button Renderer */}
                                {message.role === "assistant" && message.content.includes("[ACTION:CREATE_PORTFOLIO]") && (
                                    <div className="mt-3">
                                        <Link href="/portfolio">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50 transition-all font-bold gap-2"
                                            >
                                                <PlusCircle className="w-4 h-4" />
                                                내 포트폴리오 만들러 가기
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                                {message.role === "assistant" && message.content.includes("[ACTION:LOGIN]") && (
                                    <div className="mt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50 transition-all font-bold gap-2"
                                            onClick={async () => {
                                                await signInWithGoogle();
                                            }}
                                        >
                                            <LogIn className="w-4 h-4" />
                                            간편하게 시작하기 (로그인)
                                        </Button>
                                        <p className="mt-1.5 text-[10px] text-muted-foreground/60 leading-tight text-center px-2">
                                            안전한 로그인을 위해 보안 인증 서버(supabase.co)로 연결됩니다.<br />
                                            안심하고 계속하셔도 좋습니다.
                                        </p>
                                    </div>
                                )}
                                {message.role === "assistant" && message.content.includes("[ACTION:GO_TO_PROFILE]") && (
                                    <div className="mt-3">
                                        <Link href="/profile">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50 transition-all font-bold gap-2"
                                            >
                                                <LogIn className="w-4 h-4" />
                                                내 정보 탭으로 이동하기
                                            </Button>
                                        </Link>
                                    </div>
                                )}
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
                        <div className="bg-white dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 rounded-2xl rounded-tl-none p-3 max-w-[80%] text-sm shadow-sm">
                            {(() => {
                                // Simple check for streaming: if we have [CHART_DATA] but no closing tag, we might want to hide the raw JSON or show a "Generating chart..." indicator
                                // For now, we'll just render text, but if a full block exists, render it.
                                const parts = [];
                                const regex = /\[CHART_DATA\]([\s\S]*?)\[\/CHART_DATA\]/g;
                                let lastIndex = 0;
                                let match;

                                const content = streamingContent;

                                while ((match = regex.exec(content)) !== null) {
                                    if (match.index > lastIndex) {
                                        parts.push(<p key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed mb-2">{content.substring(lastIndex, match.index)}</p>);
                                    }

                                    try {
                                        const chartJson = JSON.parse(match[1]);
                                        parts.push(<ChartRenderer key={`chart-${match.index}`} chartData={chartJson} />);
                                    } catch (e) {
                                        // Incomplete JSON or error
                                    }

                                    lastIndex = regex.lastIndex;
                                }

                                if (lastIndex < content.length) {
                                    // Check if we are currently streaming a chart block (partial)
                                    const remaining = content.substring(lastIndex);
                                    if (remaining.includes("[CHART_DATA]")) {
                                        const [before] = remaining.split("[CHART_DATA]");
                                        parts.push(<p key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">{before}</p>);
                                        parts.push(
                                            <div key="chart-loading" className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg animate-pulse">
                                                <ChartIcon className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">차트 생성 중...</span>
                                            </div>
                                        );
                                    } else {
                                        parts.push(<p key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">{remaining}</p>);
                                    }
                                }

                                return parts;
                            })()}
                            <span className="inline-block w-1.5 h-4 bg-emerald-500/50 ml-0.5 animate-pulse" />
                        </div>
                    </motion.div>
                )}

                {/* Preparing Indicator */}
                {isPreparing && (
                    <motion.div
                        className="flex gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center border border-white/10 flex-shrink-0">
                            <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl rounded-tl-none p-3 text-sm shadow-sm flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                            <span className="text-muted-foreground text-xs font-medium">
                                {initialMessage ? "포트폴리오 분석 준비 중..." : "대화 기록을 불러오는 중..."}
                            </span>
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
                        <div className="bg-white dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 rounded-2xl rounded-tl-none p-3 text-sm shadow-sm">
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
                {/* Quick Suggestion Tags - Always visible unless busy */}
                {!(isLoading || isPreparing) && (
                    <motion.div
                        className="flex overflow-x-auto gap-2 pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [mask-image:linear-gradient(to_right,white_85%,transparent_100%)] pr-8"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {getQuickSuggestions(guru.id, language).map((suggestion) => (
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
                                            messages: [{ role: "user", content: suggestion }], // 첫 질문은 항상 이것만
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
                                className="whitespace-nowrap flex-shrink-0 snap-start px-3 py-1.5 text-xs rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-colors duration-200"
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
                        className="pr-12 bg-white dark:bg-black/20 border-black/10 dark:border-white/20 backdrop-blur-md focus:ring-emerald-500/50 shadow-sm"
                        disabled={isLoading || isPreparing}
                    />
                    <Button
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                        type="submit"
                        disabled={!input.trim() || isLoading || isPreparing}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>
        </motion.div >
    );
}

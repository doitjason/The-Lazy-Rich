"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Send, ArrowLeft, Bot, User as UserIcon, Loader2, AlertTriangle, BarChart as ChartIcon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIMentor, getIntroMessage, SupportedLanguage } from "@/lib/ai-mentors";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChartRenderer, ChartData } from "./ChartRenderer";
import { useRouter } from "next/navigation";
import { COLUMNS } from "@/data/columns";
import { RECOMMENDED_BOOKS } from "@/data/books";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface ChatInterfaceProps {
    mentor: AIMentor;
    onBack: () => void;
    userId?: string;
    sessionId?: string;
    initialHistory?: Message[];
    initialMessage?: string;
}

// Quick suggestion tags in multiple languages
import Link from "next/link";
import { PlusCircle, LogIn, Calculator, BookOpen, TrendingUp, PieChart, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SocialLoginButtons } from "../profile/SocialLoginButtons";

// ─── Action Tag Types ────────────────────────────────────────
interface ParsedAction {
    type: "calc-regret" | "calc-portfolio" | "calc-fire" | "column" | "book" | "market" | "portfolio-create" | "portfolio-metrics" | "login";
    ticker?: string;
    amount?: string;
    id?: string;
}

/** Parse all [ACTION:...] tags from a message string */
function parseActionTags(text: string): ParsedAction[] {
    const actions: ParsedAction[] = [];
    const actionRegex = /\[ACTION:(CALC:regret(?::([A-Za-z0-9.]+)(?::([0-9]+))?)?|CALC:portfolio|CALC:fire|COLUMN:([a-z0-9-]+)|BOOK:([a-z0-9-]+)|MARKET|PORTFOLIO:create|PORTFOLIO:metrics|LOGIN)\]/g;
    let m;
    while ((m = actionRegex.exec(text)) !== null) {
        const tag = m[1];
        if (tag.startsWith("CALC:regret")) {
            actions.push({ type: "calc-regret", ticker: m[2], amount: m[3] });
        } else if (tag === "CALC:portfolio") {
            actions.push({ type: "calc-portfolio" });
        } else if (tag === "CALC:fire") {
            actions.push({ type: "calc-fire" });
        } else if (tag.startsWith("COLUMN:")) {
            actions.push({ type: "column", id: m[4] });
        } else if (tag.startsWith("BOOK:")) {
            actions.push({ type: "book", id: m[5] });
        } else if (tag === "MARKET") {
            actions.push({ type: "market" });
        } else if (tag === "PORTFOLIO:create") {
            actions.push({ type: "portfolio-create" });
        } else if (tag === "PORTFOLIO:metrics") {
            actions.push({ type: "portfolio-metrics" });
        } else if (tag === "LOGIN") {
            actions.push({ type: "login" });
        }
    }
    return actions;
}

/** Strip all action tags from visible text */
const STRIP_ACTIONS_REGEX = /\[ACTION:[^\]]+\]/g;

const getQuickSuggestions = (mentorId: string, language: SupportedLanguage): string[] => {
    const commonQuestion = language === "ko" ? "내 포트폴리오를 분석해주세요" : "Analyze my portfolio";

    if (language !== "ko") {
        return [commonQuestion, "What's your take on the current market?"];
    }

    switch (mentorId) {
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

export function ChatInterface({ mentor, onBack, userId, sessionId, initialHistory, initialMessage }: ChatInterfaceProps) {
    const { currency } = useCurrency();
    const router = useRouter();

    // Determine language from currency setting
    const language: SupportedLanguage = useMemo(() => {
        // Force Korean as default regardless of currency for now
        // if (currency === "USD") return "en"; 
        return "ko";
    }, [currency]);

    const [messages, setMessages] = useState<Message[]>(initialHistory && initialHistory.length > 0 ? initialHistory : [
        {
            id: "intro",
            role: "assistant",
            content: getIntroMessage(mentor, language),
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
        // Optimization: If initialHistory was provided, skip the first fetch to avoid duplicate logic
        // and allow instant interaction.
        if (initialHistory !== undefined && fetchedSessionId.current === null) {
            console.log(`[ChatHistory] Using initialHistory for session: ${sessionId}`);
            fetchedSessionId.current = sessionId || null;
            return;
        }

        if (!sessionId || isHistoryLoading || fetchedSessionId.current === sessionId) return;

        const fetchMessages = async () => {
            // Check cache first
            const cacheKey = `chat_history_${sessionId}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log(`[ChatHistory] Loading from cache for session: ${sessionId}`);
                        setMessages(parsed);
                        fetchedSessionId.current = sessionId;
                        // Still fetch in background to ensure up-to-date data (SWR)
                    }
                } catch (e) {
                    sessionStorage.removeItem(cacheKey);
                }
            }

            setIsHistoryLoading(true);
            try {
                console.log(`[ChatHistory] Fetching from API for session: ${sessionId}`);
                const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.messages && data.messages.length > 0) {
                        console.log(`[ChatHistory] API found ${data.messages.length} messages`);
                        const formattedMessages: Message[] = data.messages.map((m: any) => ({
                            id: m.id,
                            role: m.role,
                            content: m.content,
                        }));
                        setMessages(formattedMessages);
                        // Update cache
                        sessionStorage.setItem(cacheKey, JSON.stringify(formattedMessages));
                        
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
    }, [sessionId, isHistoryLoading, initialHistory]);

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
                    mentorId: mentor.id,
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
                                    setMessages((prev) => {
                                        const newMessages = [...prev, assistantMessage];
                                        // Update cache if session exists
                                        if (sessionId) {
                                            sessionStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(newMessages));
                                        }
                                        return newMessages;
                                    });
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
        // Robust session readiness: 
        // 1. For guests (no userId), send immediately.
        // 2. For logged-in users, we MUST have a sessionId.
        // 3. We also wait for history to NOT be currently loading (isHistoryLoading === false)
        //    AND fetchedSessionId.current to match the current sessionId (to ensure history is ready/checked)
        
        const isUserSessionReady = !!userId ? (!!sessionId && fetchedSessionId.current === sessionId) : true;
        const isDataReady = !isHistoryLoading;

        if (
            initialMessage &&
            isUserSessionReady &&
            isDataReady &&
            !hasSentInitialRef.current
        ) {
            console.log(`[ChatInterface] Auto-triggering initial message: "${initialMessage}"`);
            hasSentInitialRef.current = true;
            sendMessage(initialMessage);
        }
    }, [initialMessage, sessionId, userId, isHistoryLoading, messages.length]);

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
                    // Clear cache
                    sessionStorage.removeItem(`chat_history_${sessionId}`);
                }

                setMessages([
                    {
                        id: "intro",
                        role: "assistant",
                        content: getIntroMessage(mentor, language),
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
                    AI 투자 멘토는 가상의 캐릭터이며 투자 권유가 아닙니다. 모든 투자 책임은 본인에게 있습니다.
                </p>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className={`h-10 w-10 rounded-full ${mentor.color} flex items-center justify-center text-white shadow-sm text-xl`}>
                    {mentor.avatarEmoji}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm">{mentor.name}</h3>
                    <p className="text-xs text-primary">{mentor.tag}</p>
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
                                    // Remove ALL action tags (including parameterized ones) from visible text
                                    const content = message.content.replace(STRIP_ACTIONS_REGEX, "").trim();

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
                                {/* ═══ Dynamic Action Card Renderer ═══ */}
                                {message.role === "assistant" && (() => {
                                    const actions = parseActionTags(message.content);
                                    if (actions.length === 0) return null;
                                    return (
                                        <div className="mt-3 flex flex-col gap-2">
                                            {actions.map((action, idx) => {
                                                switch (action.type) {
                                                    case "calc-regret": {
                                                        const ticker = action.ticker || "";
                                                        const amount = action.amount || "";
                                                        const params = new URLSearchParams();
                                                        params.set("tab", "regret");
                                                        if (ticker) params.set("ticker", ticker);
                                                        if (amount) params.set("amount", amount);
                                                        params.set("from", "guru");
                                                        return (
                                                            <button key={idx} onClick={() => router.push(`/calc?${params.toString()}`)} className="group w-full text-left p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-500/20 dark:border-amber-400/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                        <Calculator className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-300">⏳ 과거로 돌아간다면?{ticker ? ` (${ticker})` : ""}</p>
                                                                        <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 truncate">
                                                                            {ticker && amount ? `${ticker}에 ${Number(amount).toLocaleString()}원 투자했다면?` : "과거 수익률을 직접 확인해보세요"}
                                                                        </p>
                                                                    </div>
                                                                    <Sparkles className="h-3.5 w-3.5 text-amber-500/50 ml-auto flex-shrink-0 group-hover:text-amber-500 transition-colors" />
                                                                </div>
                                                            </button>
                                                        );
                                                    }
                                                    case "calc-portfolio":
                                                        return (
                                                            <button key={idx} onClick={() => router.push("/calc?tab=regret-v2&from=guru")} className="group w-full text-left p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/15 dark:to-indigo-500/15 border border-blue-500/20 dark:border-blue-400/20 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                        <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300">📊 포트폴리오 백테스트</p>
                                                                        <p className="text-[10px] text-blue-600/70 dark:text-blue-400/60">내 구성으로 과거 수익률을 검증해보세요</p>
                                                                    </div>
                                                                    <Sparkles className="h-3.5 w-3.5 text-blue-500/50 ml-auto flex-shrink-0 group-hover:text-blue-500 transition-colors" />
                                                                </div>
                                                            </button>
                                                        );
                                                    case "calc-fire":
                                                        return (
                                                            <button key={idx} onClick={() => router.push("/calc?tab=compound&from=guru")} className="group w-full text-left p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/15 dark:to-pink-500/15 border border-purple-500/20 dark:border-purple-400/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                        <Calculator className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-purple-700 dark:text-purple-300">🔥 경제적 자유 시뮬레이션</p>
                                                                        <p className="text-[10px] text-purple-600/70 dark:text-purple-400/60">복리의 힘으로 은퇴 플랜을 세워보세요</p>
                                                                    </div>
                                                                    <Sparkles className="h-3.5 w-3.5 text-purple-500/50 ml-auto flex-shrink-0 group-hover:text-purple-500 transition-colors" />
                                                                </div>
                                                            </button>
                                                        );
                                                    case "column": {
                                                        const col = COLUMNS.find(c => c.id === action.id);
                                                        return (
                                                            <button key={idx} onClick={() => router.push(`/columns/${action.id}?from=guru`)} className="group w-full text-left p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/15 dark:to-teal-500/15 border border-emerald-500/20 dark:border-emerald-400/20 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                        <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">📰 {col?.title || "칼럼 읽기"}</p>
                                                                        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 truncate">{col?.subtitle || "전문가 인사이트를 확인해보세요"}</p>
                                                                    </div>
                                                                    <Sparkles className="h-3.5 w-3.5 text-emerald-500/50 ml-auto flex-shrink-0 group-hover:text-emerald-500 transition-colors" />
                                                                </div>
                                                            </button>
                                                        );
                                                    }
                                                    case "book": {
                                                        const book = RECOMMENDED_BOOKS.find(b => b.id === action.id);
                                                        return (
                                                            <button key={idx} onClick={() => router.push(`/books/${action.id}?from=guru`)} className="group w-full text-left p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 dark:from-violet-500/15 dark:to-fuchsia-500/15 border border-violet-500/20 dark:border-violet-400/20 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                        <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-violet-700 dark:text-violet-300">📚 {book?.title || "추천 도서"}</p>
                                                                        <p className="text-[10px] text-violet-600/70 dark:text-violet-400/60 truncate">{book ? `${book.author} · ${book.tag}` : "투자 철학을 깊이 배워보세요"}</p>
                                                                    </div>
                                                                    <Sparkles className="h-3.5 w-3.5 text-violet-500/50 ml-auto flex-shrink-0 group-hover:text-violet-500 transition-colors" />
                                                                </div>
                                                            </button>
                                                        );
                                                    }
                                                    case "market":
                                                        return (
                                                            <button key={idx} onClick={() => router.push("/?tab=market&from=guru")} className="group w-full text-left p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-sky-500/10 dark:from-cyan-500/15 dark:to-sky-500/15 border border-cyan-500/20 dark:border-cyan-400/20 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                        <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">📈 현재 시장 상황 점검</p>
                                                                        <p className="text-[10px] text-cyan-600/70 dark:text-cyan-400/60">투자 심리와 주요 매크로 지표 확인</p>
                                                                    </div>
                                                                    <Sparkles className="h-3.5 w-3.5 text-cyan-500/50 ml-auto flex-shrink-0 group-hover:text-cyan-500 transition-colors" />
                                                                </div>
                                                            </button>
                                                        );
                                                    case "portfolio-create":
                                                        return (
                                                            <button key={idx} onClick={() => router.push("/portfolio")} className="group w-full text-left p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 border border-emerald-500/20 dark:border-emerald-400/20 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                        <PlusCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">✨ 내 포트폴리오 만들기</p>
                                                                        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60">종목을 등록하고 맞춤형 분석을 받아보세요</p>
                                                                    </div>
                                                                    <Sparkles className="h-3.5 w-3.5 text-emerald-500/50 ml-auto flex-shrink-0 group-hover:text-emerald-500 transition-colors" />
                                                                </div>
                                                            </button>
                                                        );
                                                    case "portfolio-metrics":
                                                        return (
                                                            <button key={idx} onClick={() => router.push("/portfolio?from=guru")} className="group w-full text-left p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-blue-500/10 dark:from-indigo-500/15 dark:to-blue-500/15 border border-indigo-500/20 dark:border-indigo-400/20 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                        <PieChart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">🔍 내 자산 정밀 지표 확인</p>
                                                                        <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/60">배당금 및 종목별 성과 기여도 분석</p>
                                                                    </div>
                                                                    <Sparkles className="h-3.5 w-3.5 text-indigo-500/50 ml-auto flex-shrink-0 group-hover:text-indigo-500 transition-colors" />
                                                                </div>
                                                            </button>
                                                        );
                                                    case "login":
                                                        return (
                                                            <div key={idx}>
                                                                                                                                 <SocialLoginButtons />
                                                                <p className="mt-1.5 text-[10px] text-muted-foreground/60 leading-tight text-center px-2">
                                                                    안전한 로그인을 위해 보안 인증 서버(supabase.co)로 연결됩니다.<br />
                                                                    안심하고 계속하셔도 좋습니다.
                                                                </p>
                                                            </div>
                                                        );
                                                    default:
                                                        return null;
                                                }
                                            })}
                                        </div>
                                    );
                                })()}

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
                                {initialMessage 
                                    ? (initialMessage.includes("내 포트폴리오") ? "포트폴리오 분석을 수행하고 있습니다..." : "AI 투자 멘토가 질문을 분석하고 있습니다...") 
                                    : "대화 기록을 불러오는 중..."}
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
                        {getQuickSuggestions(mentor.id, language).map((suggestion) => (
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
                                            mentorId: mentor.id,
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
                        placeholder={`${mentor.name}에게 질문하세요...`}
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

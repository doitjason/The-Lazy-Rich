"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { RECOMMENDED_BOOKS, Book } from "@/data/books";
import { AdSlot } from "@/components/insights/AdSlot";

// Cache key for sessionStorage
const BOOK_COVERS_CACHE_KEY = "bookCoversCache";
const BOOK_COVERS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

type BookCoverData = Record<string, { image?: string; author?: string } | null>;

function getBookCoversFromCache(): BookCoverData | null {
    try {
        const raw = sessionStorage.getItem(BOOK_COVERS_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() > parsed.expiry) {
            sessionStorage.removeItem(BOOK_COVERS_CACHE_KEY);
            return null;
        }
        return parsed.data;
    } catch {
        return null;
    }
}

function setBookCoversToCache(data: BookCoverData) {
    try {
        sessionStorage.setItem(BOOK_COVERS_CACHE_KEY, JSON.stringify({
            data,
            expiry: Date.now() + BOOK_COVERS_CACHE_TTL,
        }));
    } catch { /* sessionStorage full, ignore */ }
}

function BookCardSkeleton({ idx }: { idx: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.5 }}
            className="bg-white/80 dark:bg-[#12141a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-3xl p-4 flex gap-5 animate-pulse"
        >
            <div className="w-24 sm:w-28 flex-shrink-0 relative">
                <div className="aspect-[2/3] rounded-xl bg-gray-200 dark:bg-white/5 shadow-sm" />
            </div>
            <div className="flex flex-col justify-between flex-grow py-1.5">
                <div>
                    <div className="h-5 w-20 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full mb-3" />
                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-white/5 rounded-lg mb-2" />
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-white/5 rounded-lg mb-4" />
                    <div className="h-3 w-full bg-gray-100 dark:bg-white/[0.02] rounded-md" />
                </div>
                <div className="flex justify-end pt-2">
                    <div className="h-4 w-24 bg-gray-100 dark:bg-white/[0.02] rounded-md" />
                </div>
            </div>
        </motion.div>
    );
}

interface BookCardItemProps {
    book: Book;
    idx: number;
    coverData?: { image?: string; author?: string } | null;
}

function BookCardItem({ book, idx, coverData }: BookCardItemProps) {
    const coverImage = coverData?.image || book.imgUrl;
    const authorName = coverData?.author?.replace(/\|/g, ", ") || book.author;

    return (
        <Link href={`/books/${book.id}`} className="block">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-white/80 dark:bg-[#12141a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-3xl p-4 flex gap-5 relative overflow-hidden group cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1c24]/80 transition-all shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="w-24 sm:w-28 flex-shrink-0 relative z-10">
                    <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-xl bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 group-hover:border-emerald-500/30 group-hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)] transition-all duration-500 flex items-center justify-center">
                        {coverImage ? (
                            <>
                                <Image
                                    alt={book.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    src={coverImage}
                                    fill
                                    sizes="(max-width: 640px) 96px, 112px"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 pointer-events-none"></div>
                            </>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-100 dark:from-emerald-900/40 to-gray-200 dark:to-gray-900/80 flex items-center justify-center">
                                <span className="text-4xl">📖</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col justify-between flex-grow py-1.5 relative z-10">
                    <div>
                        <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-2 inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`}>
                            <span className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 mr-1.5 opacity-80 group-hover:animate-pulse" />
                            {book.tag}
                        </span>
                        <h2 className="text-base sm:text-lg font-black leading-tight line-clamp-2 text-gray-800 dark:text-white/90 mt-1 group-hover:text-black dark:group-hover:text-white transition-colors">
                            {book.title}
                        </h2>
                        <p className="text-[11px] sm:text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-1 font-bold">
                            {authorName}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-white/40 mt-1.5 font-medium leading-snug line-clamp-1">
                            {book.description.split(/(?<=\.)\s/)[0]}
                        </p>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <span className="text-xs font-black text-emerald-500 dark:text-emerald-400 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:translate-x-1">
                            에디터 리뷰 보기 <span className="text-[10px]">&rarr;</span>
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

export function RecommendedBooks() {
    const [filterLevel, setFilterLevel] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bookCovers, setBookCovers] = useState<BookCoverData>({});
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredBooks = RECOMMENDED_BOOKS.filter(book => filterLevel === "all" || book.level === filterLevel);

    const filterOptions = [
        { id: "all", label: "전체 도서", emoji: "📚" },
        { id: "beginner", label: "마인드 셋팅 (입문)", emoji: "🌱" },
        { id: "intermediate", label: "실전 가이드 (중급)", emoji: "🌲" },
        { id: "advanced", label: "거장의 철학 (심화)", emoji: "🌳" },
    ];

    const currentFilter = filterOptions.find((f) => f.id === filterLevel) || filterOptions[0];

    // Batch fetch all book covers once
    useEffect(() => {
        const cached = getBookCoversFromCache();

        // Check if all current books are in cache
        const missingQueries = RECOMMENDED_BOOKS
            .filter(b => b.naverQuery)
            .map(b => b.naverQuery!)
            .filter(q => !cached || !cached[q]);

        if (cached && missingQueries.length === 0) {
            setBookCovers(cached);
            setIsLoading(false);
            return;
        }

        // If all books already have hardcoded imgUrl, we don't strictly need to "load"
        const booksWithoutStaticUrl = RECOMMENDED_BOOKS.filter(b => !b.imgUrl && b.naverQuery);
        if (booksWithoutStaticUrl.length === 0 && cached) {
            setBookCovers(cached);
            setIsLoading(false);
            // Still fetch in background to refresh cache if needed
        }

        const queriesToFetch = cached ? missingQueries : RECOMMENDED_BOOKS.filter(b => b.naverQuery).map(b => b.naverQuery!);

        if (queriesToFetch.length > 0) {
            const queryIds = queriesToFetch.join(",");
            fetch(`/api/books/batch?queries=${encodeURIComponent(queryIds)}`)
                .then(res => res.ok ? res.json() : {})
                .then((newBatch: BookCoverData) => {
                    const mergedData = { ...(cached || {}), ...newBatch };
                    setBookCovers(mergedData);
                    setBookCoversToCache(mergedData);
                })
                .catch(err => console.error("Batch book fetch failed:", err))
                .finally(() => setIsLoading(false));
        } else {
            if (cached) setBookCovers(cached);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Filter Dropdown */}
            <div className="relative pb-4 pt-1 z-40" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[14px] sm:text-sm font-bold transition-all border shadow-sm active:scale-95 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)] hover:bg-emerald-500/20"
                >
                    <span className="text-base">{currentFilter.emoji}</span>
                    <span>{currentFilter.label}</span>
                    <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-[52px] left-0 w-[220px] bg-white/95 dark:bg-[#12141a]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1.5"
                        >
                            {filterOptions.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => {
                                        setFilterLevel(f.id as any);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors font-medium text-[14px] ${filterLevel === f.id
                                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-white/5"
                                        : "text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    <span className="text-base">{f.emoji}</span>
                                    <span>{f.label}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <BookCardSkeleton key={i} idx={i} />
                    ))
                ) : (
                    filteredBooks.map((book, idx) => (
                        <React.Fragment key={book.id}>
                            <BookCardItem book={book} idx={idx} coverData={book.naverQuery ? bookCovers[book.naverQuery] : null} />
                            
                            {/* 4번째 책마다 광고 삽입, 최대 3개까지 */}
                            {((idx + 1) % 4 === 0) && (Math.floor((idx + 1) / 4) <= 3) && (
                                <div className="w-full flex justify-center py-2">
                                    <div className="w-full overflow-hidden rounded-3xl bg-white/40 dark:bg-[#12141a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/5 shadow-sm transition-all relative h-[100px] flex items-center justify-center">
                                        <AdSlot placement="in-article" index={Math.floor((idx + 1) / 4) - 1} className="!rounded-3xl" />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))
                )}

                {!isLoading && filteredBooks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-white/40 border border-gray-200 dark:border-white/5 rounded-3xl bg-gray-50/50 dark:bg-white/[0.02]">
                        <span className="text-4xl mb-3">🔍</span>
                        <p className="text-sm font-medium">새로운 추천 도서가 곧 업데이트될 예정입니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

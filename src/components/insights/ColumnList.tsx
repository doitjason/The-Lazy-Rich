"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { COLUMNS, CATEGORY_OPTIONS, Column } from "@/data/columns";
import { AdSlot } from "./AdSlot";

// ─── Featured Card ────────────────────────────────────────
function FeaturedColumnCard({ column }: { column: Column }) {
    return (
        <Link href={`/insights/columns/${column.id}`} className="block">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-gradient-to-br dark:from-[#12141a]/80 dark:via-[#12141a]/60 dark:to-[#12141a]/80 backdrop-blur-xl group cursor-pointer shadow-sm dark:shadow-none"
            >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 dark:from-violet-500/10 via-transparent to-emerald-500/5 opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-[60px] translate-x-10 -translate-y-10 pointer-events-none" />

                <div className="relative z-10 p-5 sm:p-6">
                    {/* Featured badge */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                            <span className="text-[8px]">⭐</span> Featured
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${column.categoryBg} ${column.categoryColor} border border-current/20 inline-flex items-center gap-1`}>
                            <span className="text-xs">{column.thumbnailEmoji}</span> {column.categoryLabel}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg sm:text-xl font-black leading-tight text-gray-900 dark:text-white/95 mb-2 group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-2">
                        {column.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-[13px] text-gray-500 dark:text-white/50 leading-relaxed line-clamp-2 mb-4 font-medium">
                        {column.subtitle}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-white/30 font-medium">
                            <span>{column.author}</span>
                            <span>·</span>
                            <Clock className="w-3 h-3" />
                            <span>{column.readTime}분</span>
                            <span>·</span>
                            <span>{column.publishedAt}</span>
                        </div>
                        <span className="text-xs font-black text-emerald-500 dark:text-emerald-400 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            읽기 <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

// ─── Regular Column Card ──────────────────────────────────
function ColumnCard({ column, idx }: { column: Column; idx: number }) {
    return (
        <Link href={`/insights/columns/${column.id}`} className="block">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="bg-white/80 dark:bg-[#12141a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-3xl p-4 flex items-center gap-4 relative overflow-hidden group cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1c24]/80 transition-all shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.1)]"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                {/* Emoji thumbnail — square ratio */}
                <div className="flex-shrink-0 relative z-10">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${column.categoryBg} border border-gray-200 dark:border-white/5 flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-105 transition-transform duration-500`}>
                        {column.thumbnailEmoji}
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow relative z-10 min-w-0 min-h-[64px] sm:min-h-[72px]">
                    {/* Top row: category pill + meta */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest inline-flex items-center px-2 py-0.5 rounded-full ${column.categoryBg} ${column.categoryColor} border border-current/20 flex-shrink-0`}>
                            <span className="w-1 h-1 rounded-full bg-current mr-1 opacity-80" />
                            {column.categoryLabel}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-white/25 font-medium flex-shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{column.readTime}분</span>
                            <span>·</span>
                            <span>{column.publishedAt}</span>
                        </div>
                    </div>
                    {/* Title — single line, truncated */}
                    <h3 className="text-[13px] sm:text-[14px] font-bold leading-snug truncate text-gray-800 dark:text-white/90 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {column.title}
                    </h3>
                    {/* Bottom row: 읽어보기 - forced to bottom */}
                    <div className="flex justify-end mt-auto pt-1">
                        <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 flex items-center gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5 flex-shrink-0">
                            읽어보기 <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

// ─── Column List (exported) ───────────────────────────────
export function ColumnList() {
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const featuredColumn = COLUMNS.find((c) => c.featured);
    const regularColumns = COLUMNS.filter((c) => !c.featured);

    const filteredColumns =
        filterCategory === "all"
            ? regularColumns
            : regularColumns.filter((c) => c.category === filterCategory);

    // Show featured card only when viewing all
    const showFeatured = filterCategory === "all" && featuredColumn;

    const currentFilter = CATEGORY_OPTIONS.find((f) => f.id === filterCategory) || CATEGORY_OPTIONS[0];

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Insert ad slots at specific positions (after every 4th card)
    const AD_INTERVAL = 4;

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
                            className="absolute top-[52px] left-0 w-[220px] bg-white/95 dark:bg-[#12141a]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50"
                        >
                            {CATEGORY_OPTIONS.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => {
                                        setFilterCategory(f.id);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors font-medium text-[14px] ${filterCategory === f.id
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

            {/* Column Cards */}
            <div className="space-y-4">
                {/* Featured Card */}
                {showFeatured && <FeaturedColumnCard column={featuredColumn} />}

                {/* Regular Cards with Ad Slots */}
                {filteredColumns.map((column, idx) => (
                    <div key={column.id}>
                        <ColumnCard column={column} idx={idx} />
                        {/* Insert ad slot after every AD_INTERVAL cards */}
                        {(idx + 1) % AD_INTERVAL === 0 && idx < filteredColumns.length - 1 && (
                            <div className="mt-4">
                                <AdSlot placement="in-feed" />
                            </div>
                        )}
                    </div>
                ))}

                {filteredColumns.length === 0 && !showFeatured && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-white/40 border border-gray-200 dark:border-white/5 rounded-3xl bg-gray-50/50 dark:bg-white/[0.02]">
                        <span className="text-4xl mb-3">🔍</span>
                        <p className="text-sm font-medium">해당 카테고리의 칼럼이 준비 중입니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

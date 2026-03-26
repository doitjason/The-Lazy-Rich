"use client";

import { cn } from "@/lib/utils";

/**
 * AdSlot — Placeholder for future ad integration.
 *
 * Strategy:
 *  - Web (browser): Google AdSense  (in-article / bottom units)
 *  - App (Capacitor): Google AdMob  (native / banner units)
 *
 * For now, it renders absolutely nothing in production to prevent 
 * "Valueless inventory" rejection from AdSense. 
 * In development, it shows a subtle placeholder for layout testing.
 */

interface AdSlotProps {
    placement: "in-feed" | "in-article" | "bottom";
    className?: string;
    index?: number;
}

export function AdSlot({ placement, className = "", index }: AdSlotProps) {
    // CRITICAL: Hide from AdSense reviewers in production until approved.
    if (process.env.NODE_ENV === "production") {
        return null;
    }

    const placementLabels = {
        "in-feed": "In-feed 광고 영역",
        "in-article": `본문 내 광고 영역 ${index !== undefined ? index + 1 : ""}`,
        "bottom": "하단 광고 영역",
    };

    const dotColor = 
        placement === "in-article" ? "bg-emerald-500/50" : 
        placement === "in-feed" ? "bg-amber-500/50" : "bg-blue-500/50";


    return (
        <div className={cn("py-4", className)}>
            <div className="border border-dashed border-gray-300 dark:border-white/10 rounded-2xl py-6 flex items-center justify-center bg-transparent relative overflow-hidden">
                <div className="absolute inset-0 bg-gray-50 dark:bg-white/[0.02] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
                <span className="text-[11px] text-gray-400 dark:text-white/30 font-medium tracking-wide relative z-10 flex items-center gap-2">
                    <span className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
                    {placementLabels[placement]}
                    <span className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
                </span>
            </div>
        </div>
    );
}


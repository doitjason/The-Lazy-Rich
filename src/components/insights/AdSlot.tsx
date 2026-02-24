"use client";

/**
 * AdSlot — Placeholder for future ad integration.
 *
 * Strategy:
 *  - Web (browser): Google AdSense  (in-feed / in-article units)
 *  - App (Capacitor): Google AdMob  (native / banner units)
 *
 * The component detects the runtime environment and will render the
 * appropriate ad SDK once integrated. For now, it renders nothing in
 * production and a subtle placeholder in development mode.
 */

interface AdSlotProps {
    placement: "in-feed" | "in-article" | "bottom";
    className?: string;
}

export function AdSlot({ placement, className = "" }: AdSlotProps) {
    // In production, render nothing until ads are integrated
    if (process.env.NODE_ENV === "production") {
        return null;
    }

    // In development, show a visual placeholder so we can verify positioning
    const placementLabels = {
        "in-feed": "In-feed 광고 영역",
        "in-article": "본문 내 광고 영역",
        "bottom": "하단 광고 영역",
    };

    return (
        <div
            className={`border border-dashed border-white/10 rounded-2xl py-6 flex items-center justify-center ${className}`}
        >
            <span className="text-[11px] text-white/20 font-medium tracking-wide">
                📢 {placementLabels[placement]}
            </span>
        </div>
    );
}

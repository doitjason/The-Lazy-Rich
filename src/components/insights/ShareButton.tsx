"use client";

import { Share2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { trackMetaEvent, trackMetaCustomEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
    title: string;
    text: string;
    url: string;
    columnId: string;
}

export function ShareButton({ title, text, url, columnId }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const shareData = {
            title,
            text,
            url,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                // Meta Pixel 이벤트 발화 (P2 #10)
                trackMetaCustomEvent('Share', {
                    content_name: title,
                    content_type: 'column',
                    content_ids: [columnId],
                });
            } else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                
                // Meta Pixel 이벤트 발화 (P2 #10) - 복사도 공유의 일종으로 간주
                trackMetaCustomEvent('Share', {
                    content_name: title,
                    content_type: 'column',
                    content_ids: [columnId],
                    share_method: 'clipboard'
                });

                setTimeout(() => setCopied(false), 2000);
            }
        } catch (error) {
            console.error("Share failed:", error);
        }
    };

    return (
        <button
            onClick={handleShare}
            className={cn(
                "p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center",
                copied 
                    ? "bg-emerald-500 text-white" 
                    : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/10"
            )}
            aria-label="공유하기"
        >
            {copied ? (
                <Check className="w-5 h-5 animate-in zoom-in" />
            ) : (
                <Share2 className="w-5 h-5" />
            )}
        </button>
    );
}

"use client";

import { MoreHorizontal, ExternalLink } from "lucide-react";

export function NativeAdCard() {
    return (
        <div className="flex gap-4 py-5 border-b border-border/20 hover:bg-muted/30 transition-colors px-4 sm:px-5 cursor-pointer group/ad">
            {/* Avatar Column (Ad Logo) */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center font-bold text-muted-foreground ring-1 ring-border/50">
                    <span className="text-[10px]">AD</span>
                </div>
            </div>

            {/* Content Column */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-[15px] truncate text-foreground tracking-tight">스폰서 광고</span>
                        <span className="text-muted-foreground text-[13px] whitespace-nowrap">· Sponsored</span>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground p-1 -mr-1 rounded-full hover:bg-muted transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-1.5 mb-3 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words tracking-tight">
                    여기에 실제로 구글 애드센스 단위 코드가 삽입됩니다. 
                    유저 활동을 방해하지 않는 텍스트 기반 네이티브 광고가 출력되도록 AdSense 대시보드에서 디스플레이/네이티브 형식을 맞춰 연동합니다.
                </div>

                <div className="flex items-center gap-1.5 mt-1 -ml-1.5 opacity-60">
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground p-1.5 rounded-full">
                        <ExternalLink className="h-4 w-4" />
                        <span className="font-medium tracking-wide">알아보기</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

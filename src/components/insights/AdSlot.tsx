"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * AdSlot — Placeholder for Kakao AdFit / AdMob integration.
 *
 * Strategy:
 *  - Web (browser): Kakao AdFit (320x100, 300x250)
 *  - App (Capacitor): Google AdMob or AdFit App SDK
 *
 * It renders a fixed-size dummy block in development to visualize the ad space.
 * In production, it currently returns null until the real script is injected.
 */

interface AdSlotProps {
    placement: "in-feed" | "in-article" | "bottom" | "sticky-bottom" | "large-box";
    className?: string;
    index?: number;
}

export function AdSlot({ placement, className = "", index }: AdSlotProps) {
    const insRef = useRef<HTMLModElement>(null);

    // 카카오 애드핏 규격 및 ID 매핑
    let dimensions = "";
    let label = "";
    let adUnit = ""; 
    let adWidth = 0;
    let adHeight = 0;

    switch (placement) {
        case "in-feed":
        case "in-article":
            dimensions = "w-[320px] h-[100px]"; // 모바일 가로형
            label = "Kakao AdFit (320x100)";
            adUnit = "DAN-kOTelEMEPDP1qCHe"; // 발급된 320x100 광고 단위 아이디
            adWidth = 320;
            adHeight = 100;
            break;
        case "bottom":
            dimensions = "w-[300px] h-[250px]"; // PC/M 겸용 네모형
            label = "Kakao AdFit (300x250)";
            adUnit = "DAN-HzRosdX8sKoJM5o2";
            adWidth = 300;
            adHeight = 250;
            break;
        case "sticky-bottom":
            dimensions = "w-[320px] h-[50px]"; // 모바일 띠배너 (향후 계산기 하단 등에 쓰일 용도)
            label = "Kakao AdFit (320x50)";
            adWidth = 320;
            adHeight = 50;
            break;
        case "large-box":
            dimensions = "w-[300px] h-[250px]";
            label = "Kakao AdFit (300x250)";
            adUnit = "DAN-HzRosdX8sKoJM5o2";
            adWidth = 300;
            adHeight = 250;
            break;
    }

    const placementDescriptions = {
        "in-feed": "인피드 광고",
        "in-article": `본문 중간 광고 ${index !== undefined ? index + 1 : ""}`,
        "bottom": "본문 최하단 광고",
        "sticky-bottom": "하단 스티키 고정 광고",
        "large-box": "대형 박스 광고",
    };

    // 카카오 광고 스크립트 동적 주입 (실제 환경 및 발급된 ID가 있을 때)
    useEffect(() => {
        if (!adUnit) return;
        
        const insElement = insRef.current;
        if (insElement && insElement.children.length === 0) {
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.src = "//t1.daumcdn.net/kas/static/ba.min.js";
            script.async = true;
            insElement.appendChild(script);
        }
    }, [adUnit]);

    // 개발 모드이면서 아직 ID가 없는 규격(예: 300x250)은 더미 렌더링 유지
    if (process.env.NODE_ENV === "development" && !adUnit) {
        return (
            <div className={cn("flex justify-center w-full", className)}>
                {/* 고정된 사이즈를 갖는 실제 박스 */}
                <div 
                    className={cn(
                        "border-2 border-dashed border-emerald-500/40 dark:border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center bg-emerald-50/50 dark:bg-emerald-900/10 relative overflow-hidden",
                        dimensions
                    )}
                >
                    {/* 배경 패턴 장식 */}
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-[0.08] [background-size:12px_12px]" />
                    
                    {/* 텍스트 내용 */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5 p-2 text-center text-emerald-700 dark:text-emerald-400">
                        <span className="text-[12px] font-black tracking-wider uppercase bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                            {label}
                        </span>
                        <span className="text-[11px] font-medium opacity-80">
                            {placementDescriptions[placement]}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // 프로덕션인데 ID가 아직 없으면 공간 아예 숨김 처리
    if (!adUnit) return null;

    // 카카오 스크립트가 로드되어 렌더링 될 실제 영역
    return (
        <div className={cn("flex items-center justify-center w-full relative z-10 overflow-hidden", className)}>
            <ins 
                className="kakao_ad_area" 
                style={{ display: "none" }}
                data-ad-unit={adUnit}
                data-ad-width={adWidth}
                data-ad-height={adHeight}
                ref={insRef}
            />
        </div>
    );
}


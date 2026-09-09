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
    const safeIndex = index !== undefined ? index : 0;

    // 카카오 애드핏 320x100 고유 ID들 (총 7개)
    const IN_FEED_AD_UNITS = [
        "DAN-kOTelEMEPDP1qCHe", // Index 0 (칼럼 리스트 #1)
        "DAN-wpYTcEe8fjHqsskB", // Index 1 (칼럼 리스트 #2)
        "DAN-DUfbCwUCbe93OEq8", // Index 2 (추천 도서 #1)
        "DAN-AJ9zVTZuDky9LUZV", // Index 3 (추천 도서 #2)
        "DAN-7VYGE7BjSdeSlFfc", // Index 4 (인피드 여분 #3)
        "DAN-WbMPZiSrARY0K1y1", // Index 5 (인피드 여분 #4)
        "DAN-Urm2QboTYALHG9wI"  // Index 6 (스티키 배너)
    ];

    // 카카오 애드핏 300x250 고유 ID들
    const RECT_AD_UNITS = [
        "DAN-HzRosdX8sKoJM5o2", // 본문 하단 / 대형 박스 #1
        "DAN-HzRosdX8sKoJM5o2", // 본문 하단 / 대형 박스 #2 (나중에 추가 생성 시 교체)
    ];

    let dimensions = "w-[320px] h-[100px]";
    let adUnit = ""; 
    let adWidth = 320;
    let adHeight = 100;

    // 영역마다 고유한 아이디 범위를 '예약'하여 중복을 절대적으로 방지합니다.
    switch (placement) {
        case "in-feed":
            // 칼럼 목록: Index 0, 1번 사용 + 2번 호출 시 여분 4번 할당 (총 3개)
            if (safeIndex === 2) {
                adUnit = IN_FEED_AD_UNITS[4];
            } else {
                adUnit = IN_FEED_AD_UNITS[safeIndex % 2];
            }
            break;
        case "in-article":
            // 추천 도서/본문: Index 2, 3번 사용 + 2번 호출 시 여분 5번 할당 (총 3개)
            if (safeIndex === 2) {
                adUnit = IN_FEED_AD_UNITS[5];
            } else {
                adUnit = IN_FEED_AD_UNITS[(safeIndex % 2) + 2];
            }
            break;
        case "bottom":
        case "large-box":
            // 계산기 하급 혹은 개별 페이지 하단: 300x250 전용 ID 사용
            adUnit = RECT_AD_UNITS[safeIndex % RECT_AD_UNITS.length];
            dimensions = "w-[300px] h-[250px]";
            adWidth = 300;
            adHeight = 250;
            break;
        case "sticky-bottom":
            // 하단 스티키 배너: Index 6 할당
            adUnit = IN_FEED_AD_UNITS[6];
            dimensions = "w-[320px] h-[50px]";
            adHeight = 50;
            break;
        default:
            adUnit = IN_FEED_AD_UNITS[0];
    }

    // 카카오 광고 스크립트 동적 주입
    useEffect(() => {
        if (!adUnit || typeof window === 'undefined') return;
        
        const insElement = insRef.current;
        if (!insElement) return;

        const loadTimer = setTimeout(() => {
            // 기존 내용 초기화
            insElement.innerHTML = "";

            // 개별 슬롯 로드용 스크립트
            const script = document.createElement("script");
            script.type = "text/javascript";
            // 프로토콜 상대 경로(//...)를 쓰면 http 로 뜬 개발 서버에서
            // http:// 로 요청이 나가 CSP(https 만 허용)에 걸린다. https 로 고정한다.
            script.src = "https://t1.daumcdn.net/kas/static/ba.min.js";
            script.async = true;

            insElement.appendChild(script);
        }, 200);

        return () => {
            clearTimeout(loadTimer);
            if (insElement) insElement.innerHTML = "";
        };
    }, [adUnit, placement, safeIndex]);

    if (!adUnit) return null;

    return (
        <div 
            key={`${placement}-${safeIndex}`} 
            className={cn("flex items-center justify-center w-full relative z-10 overflow-hidden rounded-2xl", className)}
        >
            <ins 
                ref={insRef}
                className="kakao_ad_area" 
                data-ad-unit={adUnit} 
                data-ad-width={adWidth} 
                data-ad-height={adHeight}
            />
            
            {/* 네이티브 뱃지 (AD) */}
            <div className="absolute bottom-[4px] right-[10px] z-20 pointer-events-none">
                <span className="text-[8px] font-bold px-1.5 py-[1px] rounded bg-white/90 dark:bg-black/80 text-gray-400 dark:text-gray-500 uppercase tracking-widest backdrop-blur-md shadow-sm border border-black/5 dark:border-white/5">
                    AD
                </span>
            </div>
        </div>
    );
}


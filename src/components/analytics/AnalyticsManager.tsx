"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * AnalyticsManager — Centralized handling for GA4 and Meta Pixel.
 * 
 * Replace placeholders with your actual IDs:
 *  - GA4: G-XXXXXXXXXX
 *  - Meta Pixel: XXXXXXXXXXXXXXX
 */

export function AnalyticsManager() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const GA_TRACKING_ID = "G-56K7HQWJ8P";
    const META_PIXEL_ID = "3038083086378797";

    useEffect(() => {
        if (!pathname) return;

        // Track Page View for GA4
        if (typeof window.gtag === "function") {
            window.gtag("config", GA_TRACKING_ID, {
                page_path: pathname,
            });
        }

        // Track Page View for Meta Pixel
        if (typeof window.fbq === "function") {
            window.fbq("track", "PageView");
        }
    }, [pathname, searchParams]);

    return (
        <>
            {/* Google Analytics (GA4) */}
            <Script
                strategy="lazyOnload"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="lazyOnload"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${GA_TRACKING_ID}', {
                            page_path: window.location.pathname,
                        });
                    `,
                }}
            />

            {/* Meta Pixel */}
            <Script
                id="meta-pixel"
                strategy="lazyOnload"
                dangerouslySetInnerHTML={{
                    __html: `
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${META_PIXEL_ID}');
                        fbq('track', 'PageView');
                    `,
                }}
            />
        </>
    );
}

// Global window type definitions for TS
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
        fbq: (...args: any[]) => void;
    }
}

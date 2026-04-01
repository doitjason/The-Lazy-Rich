/**
 * Meta Pixel & GA4 Analytics Helper
 *
 * 표준 이벤트:  trackMetaEvent('EventName', params)   → fbq('track', ...)
 * 커스텀 이벤트: trackMetaCustomEvent('Name', params) → fbq('trackCustom', ...)
 */

/** Meta 표준 이벤트 발화 (P0, P1에 사용) */
export function trackMetaEvent(
    eventName: string,
    params?: Record<string, any>
) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[MetaPixel] Standard Event: ${eventName}`, params);
    }

    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("track", eventName, params);
    } else {
        console.warn(`[MetaPixel] fbq is not available for event: ${eventName}`);
    }
}

/** Meta 커스텀 이벤트 발화 (P2에 사용) */
export function trackMetaCustomEvent(
    eventName: string,
    params?: Record<string, any>
) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[MetaPixel] Custom Event: ${eventName}`, params);
    }

    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("trackCustom", eventName, params);
    } else {
        console.warn(`[MetaPixel] fbq is not available for custom event: ${eventName}`);
    }
}

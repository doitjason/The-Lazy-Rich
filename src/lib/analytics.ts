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
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("track", eventName, params);
    }
}

/** Meta 커스텀 이벤트 발화 (P2에 사용) */
export function trackMetaCustomEvent(
    eventName: string,
    params?: Record<string, any>
) {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("trackCustom", eventName, params);
    }
}

/**
 * In-Memory Rate Limiter (Zero-cost, no external dependencies)
 *
 * Uses a sliding window approach per key (typically IP address).
 * On Vercel serverless, each instance maintains its own map,
 * so this won't be globally synchronized — but it still blocks
 * the most obvious abuse patterns (rapid-fire from a single connection).
 */

interface RateLimitEntry {
    timestamps: number[];
}

class RateLimiter {
    private store: Map<string, RateLimitEntry> = new Map();
    private readonly windowMs: number;
    private readonly maxRequests: number;
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    constructor(windowMs: number, maxRequests: number) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;

        // Periodic cleanup to prevent memory leaks (every 5 minutes)
        if (typeof setInterval !== "undefined") {
            this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
            // Allow Node to exit even if this interval is active
            if (this.cleanupInterval && typeof this.cleanupInterval === "object" && "unref" in this.cleanupInterval) {
                this.cleanupInterval.unref();
            }
        }
    }

    /**
     * Check if a request is allowed for the given key.
     * Returns { allowed: true } or { allowed: false, retryAfterMs }.
     */
    check(key: string): { allowed: boolean; retryAfterMs?: number; remaining: number } {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry) {
            this.store.set(key, { timestamps: [now] });
            return { allowed: true, remaining: this.maxRequests - 1 };
        }

        // Remove timestamps outside the window
        entry.timestamps = entry.timestamps.filter(t => now - t < this.windowMs);

        if (entry.timestamps.length >= this.maxRequests) {
            const oldestInWindow = entry.timestamps[0];
            const retryAfterMs = this.windowMs - (now - oldestInWindow);
            return {
                allowed: false,
                retryAfterMs,
                remaining: 0,
            };
        }

        entry.timestamps.push(now);
        return {
            allowed: true,
            remaining: this.maxRequests - entry.timestamps.length,
        };
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            entry.timestamps = entry.timestamps.filter(t => now - t < this.windowMs);
            if (entry.timestamps.length === 0) {
                this.store.delete(key);
            }
        }
    }
}

// Pre-configured limiters for different API tiers
// These are singletons — one per serverless instance

/** Chat API: 10 requests per hour (unauthenticated) */
export const chatRateLimiter = new RateLimiter(60 * 60 * 1000, 10);

/** Chat API: 60 requests per hour (authenticated) */
export const chatAuthRateLimiter = new RateLimiter(60 * 60 * 1000, 60);

/** Insights API: 10 requests per hour */
export const insightsRateLimiter = new RateLimiter(60 * 60 * 1000, 10);

/** Stock/Market APIs: 60 requests per minute */
export const stockRateLimiter = new RateLimiter(60 * 1000, 60);

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(request: Request): string {
    const headers = new Headers(request.headers);
    return (
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        headers.get("cf-connecting-ip") ||
        "unknown"
    );
}

/**
 * Create a 429 Too Many Requests response.
 */
export function rateLimitResponse(retryAfterMs?: number) {
    const retryAfterSec = retryAfterMs ? Math.ceil(retryAfterMs / 1000) : 60;
    return new Response(
        JSON.stringify({
            error: "요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.",
        }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": String(retryAfterSec),
            },
        }
    );
}

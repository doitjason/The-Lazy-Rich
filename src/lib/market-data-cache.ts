/**
 * Market Data Cache
 * 서버 메모리 기반 TTL 캐시로 Yahoo Finance API 호출을 최소화합니다.
 * - 종목 데이터: 5분 TTL
 * - 시장 지표: 10분 TTL
 */

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

class MarketDataCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();

    // TTL in milliseconds
    static readonly STOCK_TTL = 60 * 60 * 1000;   // 1시간 (Prompt Caching 최적화)
    static readonly MARKET_TTL = 60 * 60 * 1000;  // 1시간 (Prompt Caching 최적화)

    /**
     * 캐시에서 데이터 조회 (만료 시 null 반환)
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * 캐시에 데이터 저장
     */
    set<T>(key: string, data: T, ttl: number): void {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl,
        });
    }

    /**
     * 특정 키 삭제
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * 만료된 항목 일괄 정리
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * 캐시 크기 반환
     */
    get size(): number {
        return this.cache.size;
    }
}

// 싱글톤 인스턴스 (서버 프로세스 수명 동안 유지)
export const marketCache = new MarketDataCache();
export { MarketDataCache };

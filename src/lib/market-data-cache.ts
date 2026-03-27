import { createClient } from "@supabase/supabase-js";

/**
 * Market Data Cache (Hybrid Memory + Supabase)
 * 서버 메모리 기반 TTL 캐시와 Supabase 영구 저장소를 함께 사용하여
 * Vercel Cold Start 시의 캐시 상실을 방지하고 Yahoo Finance API 호출을 효율화합니다.
 * - 지표 데이터: 1시간 TTL
 * - 과거/ATH 데이터: 30일 TTL
 */

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

// Supabase 클라이언트 초기화 (비용 방어를 위해 서버측 환경변수 사용)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

class MarketDataCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();

    // Default TTL in milliseconds
    static readonly STOCK_TTL = 60 * 60 * 1000;   // 1시간 (Prompt Caching 최적화)
    static readonly MARKET_TTL = 60 * 60 * 1000;  // 1시간 (Prompt Caching 최적화)
    static readonly LONG_TERM_TTL = 30 * 24 * 60 * 60 * 1000; // 30일 (ATH/정적 데이터용)

    /**
     * 캐시에서 데이터 조회 (비동기)
     */
    async get<T>(key: string): Promise<T | null> {
        // 1. 메모리 캐시 확인
        const entry = this.cache.get(key);
        if (entry) {
            if (Date.now() < entry.expiry) {
                return entry.data as T;
            }
            this.cache.delete(key);
        }

        // 2. Supabase 영구 캐시 확인 (Vercel Cold Start 대응)
        try {
            const { data, error } = await supabase
                .from("market_data_cache")
                .select("*")
                .eq("id", key)
                .single();

            if (data && !error) {
                const expiry = new Date(data.expiry).getTime();
                if (Date.now() < expiry) {
                    // 메모리에 다시 적재 후 반환
                    this.cache.set(key, { data: data.data, expiry: expiry });
                    return data.data as T;
                } else {
                    // 만료된 데이터 삭제 (백그라운드)
                    supabase.from("market_data_cache").delete().eq("id", key).then();
                }
            }
        } catch (e) {
            console.warn(`Cache lookup failure for ${key}:`, e);
        }

        return null;
    }

    /**
     * 캐시에 데이터 저장 (비동기)
     */
    async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
        const expiry = Date.now() + ttlMs;
        
        // 1. 메모리 저장
        this.cache.set(key, { data, expiry });

        // 2. Supabase 저장 (Upsert)
        try {
            await supabase.from("market_data_cache").upsert({
                id: key,
                data: data as any,
                expiry: new Date(expiry).toISOString(),
                created_at: new Date().toISOString()
            });
        } catch (e) {
            console.error(`Persistent cache set failure for ${key}:`, e);
        }
    }

    /**
     * 특정 키 삭제
     */
    async delete(key: string): Promise<void> {
        this.cache.delete(key);
        await supabase.from("market_data_cache").delete().eq("id", key);
    }
}

// 싱글톤 인스턴스
export const marketCache = new MarketDataCache();
export { MarketDataCache };

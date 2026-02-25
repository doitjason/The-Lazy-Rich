import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

// Create YahooFinance instance (required for v3)
const yahooFinance = new YahooFinance();

type SearchQuote = {
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchDisp?: string;
    typeDisp?: string;
    isYahooFinance?: boolean;
    quoteType?: string;
};

type SearchResults = {
    quotes?: SearchQuote[];
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 1) {
        return NextResponse.json({ results: [] });
    }

    try {
        console.log(`[Stock Search] Searching for: ${query}`);

        // 1. Check local Korean Stock Dictionary for Exact/Partial matches
        const rawQuery = query.toLowerCase().replace(/\s/g, '');
        const koDictionary: Record<string, string> = {
            "삼성전자": "005930", "삼성전자우": "005935",
            "sk하이닉스": "000660", "하이닉스": "000660",
            "lg에너지솔루션": "373220", "엔솔": "373220",
            "삼성바이오로직스": "207940", "삼바": "207940",
            "현대차": "005380", "현대자동차": "005380", "현대차우": "005385", "현대차2우b": "005387", "현대차3우b": "005389",
            "기아": "000270", "기아차": "000270",
            "셀트리온": "068270",
            "kb금융": "105560", "국민은행": "105560",
            "posco홀딩스": "005490", "포스코홀딩스": "005490", "포스코": "005490",
            "네이버": "035420", "naver": "035420",
            "신한지주": "055550", "신한은행": "055550",
            "현대모비스": "012330", "모비스": "012330",
            "lg화학": "051910", "lg화학우": "051915",
            "삼성물산": "028260", "삼성물산우b": "028265",
            "하나금융지주": "086790", "하나은행": "086790",
            "kt&g": "033780", "케이티앤지": "033780",
            "메리츠금융지주": "138040", "메리츠": "138040",
            "삼성생명": "032830",
            "카카오": "035720", "kakao": "035720",
            "hd현대중공업": "329180", "현대중공업": "329180",
            "한화에어로스페이스": "012450", "한화에어로": "012450",
            "lg전자": "066570", "lg전자우": "066575",
            "우리금융지주": "316140", "우리은행": "316140",
            "크래프톤": "259960",
            "에코프로비엠": "247540", "에코프로": "086520",
            "알테오젠": "196170",
            "엔씨소프트": "036570", "엔씨": "036570",
            "sk텔레콤": "017670", "skt": "017670",
            "한국전력": "015760", "한전": "015760",
            "고려아연": "010130",
            "hd한국조선해양": "009540", "한국조선해양": "009540",
            "삼성sds": "018260",
            "기업은행": "024110", "ibk기업은행": "024110",
            "두산에너빌리티": "034020", "두산중공업": "034020",
        };

        const localMatches = Object.entries(koDictionary)
            .filter(([name, _]) => name.includes(rawQuery) || rawQuery.includes(name))
            .map(([name, ticker]) => ({
                ticker: `${ticker}.KS`, // Keep .KS format for backend/API consistency
                name: (name.charAt(0).toUpperCase() + name.slice(1)).replace(/우$/, ' (우)'),
                exchange: "KSE",
                type: "Equity",
                isLocalMatch: true
            }));

        // Deduplicate local matches by ticker
        const uniqueLocalMatches = Array.from(new Map(localMatches.map(item => [item.ticker, item])).values());

        // 2. Fetch standard Yahoo Finance search results with a strict timeout
        // Yahoo Finance search can hang indefinitely on some non-ASCII queries (Node event loop freeze)
        let quotes: SearchQuote[] = [];
        const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(query);

        if (!hasKorean) {
            try {
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Yahoo Finance search timeout")), 1500)
                );

                const searchResults = await Promise.race([
                    yahooFinance.search(query, { quotesCount: 10, newsCount: 0 }) as Promise<SearchResults>,
                    timeoutPromise
                ]);

                console.log(`[Stock Search] Raw results:`, JSON.stringify(searchResults, null, 2));
                quotes = searchResults.quotes || [];
            } catch (yfError) {
                console.log(`[Stock Search] Yahoo Finance search failed or timed out for query '${query}':`, yfError instanceof Error ? yfError.message : yfError);
                // Non-fatal error, we still have local matches
            }
        } else {
            console.log(`[Stock Search] Bypassing Yahoo Finance search for query '${query}' (Korean text detected).`);
        }

        const yfResults = quotes
            .filter((q) => q.symbol && (q.quoteType === "EQUITY" || q.quoteType === "ETF" || !q.quoteType))
            .map((q) => ({
                ticker: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchDisp || "",
                type: q.quoteType || "Equity",
            }));

        // Remove any element from yfResults that was already caught by localMatches
        const localTickers = new Set(uniqueLocalMatches.map(m => m.ticker));
        const filteredYfResults = yfResults.filter(r => !localTickers.has(r.ticker!));

        const results = [...uniqueLocalMatches, ...filteredYfResults];

        console.log(`[Stock Search] Filtered results count: ${results.length}`);

        return NextResponse.json({ results });
    } catch (error: unknown) {
        console.error("[Stock Search] Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ results: [], error: message });
    }
}

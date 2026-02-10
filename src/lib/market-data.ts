/**
 * Persona-Specific Market Data Fetcher
 * 각 페르소나 성향에 맞는 시장 데이터를 Yahoo Finance에서 가져옵니다.
 * 캐싱 레이어를 통해 중복 API 호출을 방지합니다.
 */

import YahooFinance from "yahoo-finance2";
import { marketCache, MarketDataCache } from "./market-data-cache";

const yahooFinance = new YahooFinance();

// ─── 공통 타입 정의 ───

interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    name: string;
    // 추가 상세 데이터 (API 호출 없이 매핑만 추가)
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    fiftyDayAverage?: number;
    twoHundredDayAverage?: number;
}

interface SageData {
    quote: StockQuote;
    per: number | null;
    forwardPer: number | null;
    pbr: number | null;
    roe: number | null;
    dividendYield: number | null;
    debtToEquity: number | null;
    operatingMargins: number | null;
    profitMargins: number | null;
    currentRatio: number | null;
    bookValue: number | null;
    eps: number | null;
    freeCashflow: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
}

interface HeroData {
    quote: StockQuote;
    revenueGrowth: number | null;
    earningsGrowth: number | null;
    earningsQuarterlyGrowth: number | null;
    pegRatio: number | null;
    forwardPer: number | null;
    grossMargins: number | null;
    operatingCashflow: number | null;
    totalRevenue: number | null;
    revenuePerShare: number | null;
    targetMeanPrice: number | null;
    targetHighPrice: number | null;
    targetLowPrice: number | null;
    numberOfAnalysts: number | null;
}

interface MarketIndicator {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    // 상세 분석용
    high52?: number;
    low52?: number;
    ma50?: number;
    ma200?: number;
}

interface ArchitectData {
    indicators: MarketIndicator[];
}

interface SpeculatorData {
    quote: StockQuote;
    fiftyDayAverage: number | null;
    twoHundredDayAverage: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    volume: number | null;
    avgVolume10Day: number | null;
    avgVolume3Month: number | null;
    beta: number | null;
    // 계산된 지표
    maAlignment: string; // "정배열" | "역배열" | "혼조"
    volumeRatio: number | null; // 현재거래량 / 평균거래량
    distanceFrom52WeekHigh: number | null; // %
    distanceFromMA50: number | null; // %
    rsi14: number | null; // RSI(14) 직접 계산
}

interface FatherData {
    indicators: MarketIndicator[];
    etfData: {
        symbol: string;
        name: string;
        price: number;
        changePercent: number;
        dividendYield: number | null;
        expenseRatio: string; // 사전 정의값
    }[];
}

// ─── 종목 키워드 매핑 (간이 검색용) ───
const TICKER_MAP: Record<string, string> = {
    // 미국 대형 기술주 (M7)
    "애플": "AAPL", "앱플": "AAPL", "APPLE": "AAPL",
    "마이크로소프트": "MSFT", "마소": "MSFT", "MICROSOFT": "MSFT",
    "구글": "GOOGL", "알파벳": "GOOGL", "GOOGLE": "GOOGL",
    "아마존": "AMZN", "AMAZON": "AMZN",
    "테슬라": "TSLA", "TESLA": "TSLA",
    "엔비디아": "NVDA", "엔비": "NVDA", "NVIDIA": "NVDA",
    "메타": "META", "페이스북": "META", "META": "META",

    // 주요 반도체
    "TSMC": "TSM", "티에스엠씨": "TSM",
    "AMD": "AMD", "암드": "AMD",
    "인텔": "INTC", "INTEL": "INTC",
    "마이크론": "MU",
    "브로드컴": "AVGO",
    "퀄컴": "QCOM",

    // 코인
    "비트코인": "BTC-USD", "비코": "BTC-USD", "BITCOIN": "BTC-USD", "BTC": "BTC-USD",
    "이더리움": "ETH-USD", "이더": "ETH-USD", "ETHEREUM": "ETH-USD", "ETH": "ETH-USD",
    "솔라나": "SOL-USD", "SOLANA": "SOL-USD",
    "리플": "XRP-USD", "XRP": "XRP-USD",
    "도지코인": "DOGE-USD", "도지": "DOGE-USD",

    // 한국 주요 종목
    "삼성전자": "005930.KS", "삼전": "005930.KS",
    "SK하이닉스": "000660.KS", "하이닉스": "000660.KS",
    "현대차": "005380.KS",
    "기아": "000270.KS",
    "네이버": "035420.KS", "NAVER": "035420.KS",
    "카카오": "035720.KS", "KAKAO": "035720.KS",
    "POSCO홀딩스": "005490.KS", "포스코": "005490.KS",
    "LG에너지솔루션": "373220.KS", "엘지엔솔": "373220.KS",

    // 주요 ETF
    "SCHD": "SCHD", "슈드": "SCHD",
    "QQQ": "QQQ", "큐큐큐": "QQQ",
    "SPY": "SPY", "스파이": "SPY",
    "VOO": "VOO",
    "TQQQ": "TQQQ", "티큐": "TQQQ",
    "SOXL": "SOXL", "속슬": "SOXL",
    "JEPI": "JEPI", "제피": "JEPI",
};

export function extractTickersFromMessage(message: string): string[] {
    const found = new Set<string>();
    let processingMsg = message.toUpperCase(); // 처리용 복사본

    // 1. 매핑된 키워드 검색 (TICKER_MAP 우선)
    // 긴 키워드부터 매칭하여 'APPLE'이 'APP'보다 먼저 걸리게 함 (필요 시)
    const sortedKeys = Object.keys(TICKER_MAP).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
        if (processingMsg.includes(key.toUpperCase())) { // 대소문자 무시 검색
            found.add(TICKER_MAP[key]);
            // 매칭된 키워드는 제거하여 정규식 오탐지 방지 (예: APPLE -> AAPL 매핑 후 APPLE 티커 추출 방지)
            processingMsg = processingMsg.replaceAll(key.toUpperCase(), " ");
        }
    }

    // 2. 영어 티커 직접 검색 (2~5글자 알파벳)
    // 공백으로 감싸진 단어만 매칭하도록 개선
    const statusMatches = processingMsg.match(/\b[A-Z]{2,5}\b/g);
    if (statusMatches) {
        statusMatches.forEach(t => {
            // "THE", "AND" 같은 일반 단어 제외 (간단한 필터링)
            if (!["THE", "AND", "FOR", "BUY", "SELL", "HOW", "WHY", "WHO", "WHAT"].includes(t)) {
                found.add(t);
            }
        });
    }

    return Array.from(found);
}

// ─── 기본 Quote 가져오기 (캐싱 포함) ───

async function fetchQuote(symbol: string): Promise<StockQuote | null> {
    const cacheKey = `quote:${symbol}`;
    const cached = marketCache.get<StockQuote>(cacheKey);
    if (cached) return cached;

    try {
        const quote = await yahooFinance.quote(symbol) as Record<string, unknown>;
        if (!quote || !quote.regularMarketPrice) return null;

        const data: StockQuote = {
            symbol: (quote.symbol as string) || symbol,
            price: quote.regularMarketPrice as number,
            change: (quote.regularMarketChange as number) || 0,
            changePercent: (quote.regularMarketChangePercent as number) || 0,
            currency: (quote.currency as string) || "USD",
            name: (quote.shortName as string) || (quote.longName as string) || symbol,
            // 상세 데이터 매핑
            fiftyTwoWeekHigh: (quote.fiftyTwoWeekHigh as number) || undefined,
            fiftyTwoWeekLow: (quote.fiftyTwoWeekLow as number) || undefined,
            fiftyDayAverage: (quote.fiftyDayAverage as number) || undefined,
            twoHundredDayAverage: (quote.twoHundredDayAverage as number) || undefined,
        };

        marketCache.set(cacheKey, data, MarketDataCache.STOCK_TTL);
        return data;
    } catch (error) {
        console.error(`[MarketData] Failed to fetch quote for ${symbol}:`, error);
        return null;
    }
}

// ─── quoteSummary 가져오기 (캐싱 포함) ───

type SummaryModule = "defaultKeyStatistics" | "financialData" | "summaryDetail";

async function fetchSummary(
    symbol: string,
    modules: ("defaultKeyStatistics" | "financialData" | "summaryDetail")[]
): Promise<Record<string, unknown> | null> {
    const cacheKey = `summary:${symbol}:${modules.join(",")}`;
    const cached = marketCache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    try {
        const result = await yahooFinance.quoteSummary(symbol, {
            modules: modules as any,
        }) as Record<string, unknown>;

        // 유효성 검사: 요청한 모듈 중 하나라도 데이터가 있어야 캐싱
        // Yahoo는 실패 시 에러 대신 빈 객체를 줄 수 있음
        const hasData = modules.some(m => result && result[m]);

        if (hasData) {
            marketCache.set(cacheKey, result, MarketDataCache.STOCK_TTL);
        } else {
            console.warn(`[MarketData] Empty summary for ${symbol}, skipping cache.`);
        }
        return result;
    } catch (error) {
        console.error(`[MarketData] Failed to fetch summary for ${symbol}:`, error);
        return null;
    }
}

// ─── 한국 종목 심볼 변환 ───

function resolveKoreanTicker(ticker: string): string {
    const cleanTicker = ticker.trim();
    if (/^\d{6}$/.test(cleanTicker)) {
        return `${cleanTicker}.KS`; // KOSPI default, will fallback
    }
    return cleanTicker.toUpperCase();
}

// ─── RSI(14) 직접 계산 ───

async function calculateRSI(symbol: string, period: number = 14): Promise<number | null> {
    const cacheKey = `rsi:${symbol}:${period}`;
    const cached = marketCache.get<number>(cacheKey);
    if (cached !== null) return cached;

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (period * 3)); // 충분한 데이터 확보

        const historical = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: "1d",
        }) as { close: number }[];

        if (!historical || historical.length < period + 1) return null;

        // 최근 period+1개 데이터만 사용
        const closes = historical.slice(-(period + 1)).map((d) => d.close);

        let avgGain = 0;
        let avgLoss = 0;

        // 초기 평균 계산
        for (let i = 1; i <= period; i++) {
            const change = closes[i] - closes[i - 1];
            if (change > 0) avgGain += change;
            else avgLoss += Math.abs(change);
        }

        avgGain /= period;
        avgLoss /= period;

        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        const rsi = Math.round((100 - (100 / (1 + rs))) * 100) / 100;

        marketCache.set(cacheKey, rsi, MarketDataCache.STOCK_TTL);
        return rsi;
    } catch (error) {
        console.error(`[MarketData] RSI calculation failed for ${symbol}:`, error);
        return null;
    }
}

// ═══════════════════════════════════════════════════════
// 페르소나별 데이터 Fetch 함수
// ═══════════════════════════════════════════════════════

/**
 * 👴 오마하의 현인 (Sage) - 가치 투자
 * PER, PBR, ROE, 배당률, 부채비율, 이익률 등 내재가치 지표
 */
export async function fetchSageData(ticker: string): Promise<SageData | null> {
    const symbol = resolveKoreanTicker(ticker);
    const quote = await fetchQuote(symbol);
    if (!quote) return null;

    const summary = await fetchSummary(symbol, [
        "defaultKeyStatistics",
        "financialData",
        "summaryDetail",
    ]);

    const stats = (summary?.defaultKeyStatistics || {}) as Record<string, unknown>;
    const financial = (summary?.financialData || {}) as Record<string, unknown>;
    const detail = (summary?.summaryDetail || {}) as Record<string, unknown>;

    return {
        quote,
        per: (detail.trailingPE as number) ?? (stats.trailingPE as number) ?? null,
        forwardPer: (stats.forwardPE as number) ?? (detail.forwardPE as number) ?? null,
        pbr: (stats.priceToBook as number) ?? null,
        roe: (financial.returnOnEquity as number) ?? null,
        dividendYield: (detail.dividendYield as number) ?? null,
        debtToEquity: (financial.debtToEquity as number) ?? null,
        operatingMargins: (financial.operatingMargins as number) ?? null,
        profitMargins: (financial.profitMargins as number) ?? null,
        currentRatio: (financial.currentRatio as number) ?? null,
        bookValue: (stats.bookValue as number) ?? null,
        eps: (stats.trailingEps as number) ?? null,
        freeCashflow: (financial.freeCashflow as number) ?? null,
        fiftyTwoWeekHigh: (detail.fiftyTwoWeekHigh as number) ?? null,
        fiftyTwoWeekLow: (detail.fiftyTwoWeekLow as number) ?? null,
    };
}

/**
 * 🦸 월가의 영웅 (Hero) - 성장 투자
 * 매출성장률, PEG, 이익성장률, 목표가 등 성장 지표
 */
export async function fetchHeroData(ticker: string): Promise<HeroData | null> {
    const symbol = resolveKoreanTicker(ticker);
    const quote = await fetchQuote(symbol);
    if (!quote) return null;

    const summary = await fetchSummary(symbol, [
        "defaultKeyStatistics",
        "financialData",
    ]);

    const stats = (summary?.defaultKeyStatistics || {}) as Record<string, unknown>;
    const financial = (summary?.financialData || {}) as Record<string, unknown>;

    return {
        quote,
        revenueGrowth: (financial.revenueGrowth as number) ?? null,
        earningsGrowth: (financial.earningsGrowth as number) ?? null,
        earningsQuarterlyGrowth: (stats.earningsQuarterlyGrowth as number) ?? null,
        pegRatio: (stats.pegRatio as number) ?? null,
        forwardPer: (stats.forwardPE as number) ?? null,
        grossMargins: (financial.grossMargins as number) ?? null,
        operatingCashflow: (financial.operatingCashflow as number) ?? null,
        totalRevenue: (financial.totalRevenue as number) ?? null,
        revenuePerShare: (financial.revenuePerShare as number) ?? null,
        targetMeanPrice: (financial.targetMeanPrice as number) ?? null,
        targetHighPrice: (financial.targetHighPrice as number) ?? null,
        targetLowPrice: (financial.targetLowPrice as number) ?? null,
        numberOfAnalysts: (financial.numberOfAnalystOpinions as number) ?? null,
    };
}

/**
 * 🕴️ 사계절의 원칙가 (Architect) - 자산 배분
 * 시장 지표: 금리, VIX, 금, 원유, 달러, 주요 지수
 */
export async function fetchArchitectData(): Promise<ArchitectData> {
    const cacheKey = "architect:market-indicators";
    const cached = marketCache.get<ArchitectData>(cacheKey);
    if (cached) return cached;

    const symbols = [
        { symbol: "^GSPC", name: "S&P 500" },
        { symbol: "^IXIC", name: "나스닥" },
        { symbol: "^DJI", name: "다우존스" },
        { symbol: "^TNX", name: "미국 10년물 국채금리" },
        { symbol: "^VIX", name: "VIX (공포지수)" },
        { symbol: "GC=F", name: "금 (Gold)" },
        { symbol: "CL=F", name: "원유 (WTI)" },
        { symbol: "DX-Y.NYB", name: "달러 인덱스 (DXY)" },
    ];

    const indicators: MarketIndicator[] = [];

    for (const { symbol, name } of symbols) {
        const quote = await fetchQuote(symbol);
        if (quote) {
            indicators.push({
                symbol,
                name,
                price: quote.price,
                change: quote.change,
                changePercent: quote.changePercent,
            });
        }
    }

    const data: ArchitectData = { indicators };
    marketCache.set(cacheKey, data, MarketDataCache.MARKET_TTL);
    return data;
}

/**
 * 🕵️ 전설의 투기꾼 (Speculator) - 모멘텀 트레이딩
 * 이동평균선, 거래량, 52주 고저, 모멘텀 지표
 */
export async function fetchSpeculatorData(ticker: string): Promise<SpeculatorData | null> {
    const symbol = resolveKoreanTicker(ticker);

    const cacheKey = `speculator:${symbol}`;
    const cached = marketCache.get<SpeculatorData>(cacheKey);
    if (cached) return cached;

    try {
        const quote = await yahooFinance.quote(symbol) as Record<string, unknown>;
        if (!quote || !quote.regularMarketPrice) return null;

        const price = quote.regularMarketPrice as number;
        const fiftyDayAvg = (quote.fiftyDayAverage as number) ?? null;
        const twoHundredDayAvg = (quote.twoHundredDayAverage as number) ?? null;
        const high52 = (quote.fiftyTwoWeekHigh as number) ?? null;
        const volume = (quote.regularMarketVolume as number) ?? null;
        const avgVol10 = (quote.averageDailyVolume10Day as number) ?? null;
        const avgVol3M = (quote.averageDailyVolume3Month as number) ?? null;

        // 정배열 판단: 현재가 > 50일 MA > 200일 MA
        let maAlignment = "데이터 부족";
        if (fiftyDayAvg && twoHundredDayAvg) {
            if (price > fiftyDayAvg && fiftyDayAvg > twoHundredDayAvg) {
                maAlignment = "정배열 (강세)";
            } else if (price < fiftyDayAvg && fiftyDayAvg < twoHundredDayAvg) {
                maAlignment = "역배열 (약세)";
            } else {
                maAlignment = "혼조세";
            }
        }

        // RSI(14) 직접 계산
        const rsi14 = await calculateRSI(symbol);

        const data: SpeculatorData = {
            quote: {
                symbol: (quote.symbol as string) || symbol,
                price,
                change: (quote.regularMarketChange as number) || 0,
                changePercent: (quote.regularMarketChangePercent as number) || 0,
                currency: (quote.currency as string) || "USD",
                name: (quote.shortName as string) || symbol,
            },
            fiftyDayAverage: fiftyDayAvg,
            twoHundredDayAverage: twoHundredDayAvg,
            fiftyTwoWeekHigh: high52,
            fiftyTwoWeekLow: (quote.fiftyTwoWeekLow as number) ?? null,
            volume,
            avgVolume10Day: avgVol10,
            avgVolume3Month: avgVol3M,
            beta: (quote.beta as number) ?? null,
            maAlignment,
            volumeRatio: volume && avgVol10 ? Math.round((volume / avgVol10) * 100) / 100 : null,
            distanceFrom52WeekHigh: high52 ? Math.round(((price - high52) / high52) * 10000) / 100 : null,
            distanceFromMA50: fiftyDayAvg ? Math.round(((price - fiftyDayAvg) / fiftyDayAvg) * 10000) / 100 : null,
            rsi14,
        };

        marketCache.set(cacheKey, data, MarketDataCache.STOCK_TTL);
        return data;
    } catch (error) {
        console.error(`[MarketData] Speculator fetch failed for ${symbol}:`, error);
        return null;
    }
}

/**
 * 👴 인덱스의 아버지 (Father) - 패시브 투자
 * 시장 지수, 주요 ETF 정보, 운용 보수
 */
export async function fetchFatherData(): Promise<FatherData> {
    const cacheKey = "father:market-data";
    const cached = marketCache.get<FatherData>(cacheKey);
    if (cached) return cached;

    // 시장 지수
    const indexSymbols = [
        { symbol: "^GSPC", name: "S&P 500" },
        { symbol: "^IXIC", name: "나스닥" },
        { symbol: "^DJI", name: "다우존스" },
    ];

    const indicators: MarketIndicator[] = [];
    for (const { symbol, name } of indexSymbols) {
        const quote = await fetchQuote(symbol);
        if (quote) {
            indicators.push({
                symbol, name,
                price: quote.price,
                change: quote.change,
                changePercent: quote.changePercent,
            });
        }
    }

    // 주요 ETF (운용 보수는 사전 정의)
    const etfInfo = [
        { symbol: "SPY", expenseRatio: "0.09%" },
        { symbol: "VOO", expenseRatio: "0.03%" },
        { symbol: "QQQ", expenseRatio: "0.20%" },
        { symbol: "VTI", expenseRatio: "0.03%" },
        { symbol: "SCHD", expenseRatio: "0.06%" },
    ];

    const etfData = [];
    for (const { symbol, expenseRatio } of etfInfo) {
        const quote = await fetchQuote(symbol);
        if (quote) {
            // 배당 수익률은 summary에서
            const summary = await fetchSummary(symbol, ["summaryDetail"]);
            const detail = (summary?.summaryDetail || {}) as Record<string, unknown>;

            etfData.push({
                symbol,
                name: quote.name,
                price: quote.price,
                changePercent: quote.changePercent,
                dividendYield: (detail.yield as number) ?? (detail.dividendYield as number) ?? null,
                expenseRatio,
            });
        }
    }

    const data: FatherData = { indicators, etfData };
    marketCache.set(cacheKey, data, MarketDataCache.MARKET_TTL);
    return data;
}

// ═══════════════════════════════════════════════════════
// 시스템 프롬프트용 텍스트 변환 함수
// ═══════════════════════════════════════════════════════

function formatNum(n: number | null, suffix = ""): string {
    if (n === null || n === undefined) return "N/A";
    return `${n.toLocaleString()}${suffix}`;
}

function formatPercent(n: number | null): string {
    if (n === null || n === undefined) return "N/A";
    return `${(n * 100).toFixed(2)}%`;
}

function formatLargeNum(n: number | null): string {
    if (n === null || n === undefined) return "N/A";
    if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}조`;
    if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
    if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(1)}만`;
    return n.toLocaleString();
}

export function sageDataToPrompt(data: SageData): string {
    // 추가 지표 계산: 고점 대비 낙폭
    const dropFromHigh = data.fiftyTwoWeekHigh
        ? ((data.quote.price - data.fiftyTwoWeekHigh) / data.fiftyTwoWeekHigh) * 100
        : null;

    return `[📊 가치 투자 분석 데이터 - ${data.quote.name} (${data.quote.symbol})]
현재가: ${formatNum(data.quote.price)} ${data.quote.currency} (${data.quote.changePercent >= 0 ? "+" : ""}${data.quote.changePercent.toFixed(2)}%)
PER (현재): ${formatNum(data.per)}배 | PER (예상): ${formatNum(data.forwardPer)}배
PBR: ${formatNum(data.pbr)}배
ROE: ${formatPercent(data.roe)}
EPS: ${formatNum(data.eps)}
배당 수익률: ${formatPercent(data.dividendYield)}
부채비율 (D/E): ${formatNum(data.debtToEquity)}%
영업이익률: ${formatPercent(data.operatingMargins)}
순이익률: ${formatPercent(data.profitMargins)}
유동비율: ${formatNum(data.currentRatio)}
장부가치: ${formatNum(data.bookValue)}
잉여현금흐름: ${formatLargeNum(data.freeCashflow)}
52주 최고: ${formatNum(data.fiftyTwoWeekHigh)} (고점 대비 낙폭: ${dropFromHigh ? dropFromHigh.toFixed(2) + "%" : "N/A"})
52주 최저: ${formatNum(data.fiftyTwoWeekLow)}

위 데이터를 바탕으로 내재 가치, 안전 마진, 경제적 해자 관점에서 분석해주세요.
- 고점 대비 낙폭이 크고(-20% 이상) 펀더멘탈(ROE, 이익률)이 견고하다면 "안전마진" 구간일 수 있습니다.
- PER/PBR이 역사적 평균보다 낮은지 추론해보세요.`;
}

export function heroDataToPrompt(data: HeroData): string {
    const warning = (data.pegRatio === null && data.revenueGrowth === null)
        ? "\n⚠️ [주의] 현재 해당 종목의 상세 재무 데이터(성장률, PEG 등)를 일시적으로 가져올 수 없습니다. 보이는 가격과 추세 중심으로만 조언하세요."
        : "";

    const pegDisplay = data.pegRatio !== null
        ? formatNum(data.pegRatio)
        : (data.earningsGrowth !== null && data.earningsGrowth < 0) ? "N/A (이익 역성장으로 산출 불가)" : "N/A";

    return `[📊 성장 투자 분석 데이터 - ${data.quote.name} (${data.quote.symbol})]
현재가: ${formatNum(data.quote.price)} ${data.quote.currency} (${data.quote.changePercent >= 0 ? "+" : ""}${data.quote.changePercent.toFixed(2)}%)
매출 성장률 (YoY): ${formatPercent(data.revenueGrowth)}
이익 성장률 (YoY): ${formatPercent(data.earningsGrowth)}
분기 이익 성장률: ${formatPercent(data.earningsQuarterlyGrowth)}
PEG Ratio: ${pegDisplay} (성장주 저평가 기준: 1.0 미만 매우 좋음, 1.5 이하 양호)
Forward PER: ${formatNum(data.forwardPer)}배
매출총이익률: ${formatPercent(data.grossMargins)}
영업현금흐름: ${formatLargeNum(data.operatingCashflow)}
총 매출액: ${formatLargeNum(data.totalRevenue)}
주당 매출: ${formatNum(data.revenuePerShare)}
애널리스트 목표가: 평균 ${formatNum(data.targetMeanPrice)} (괴리율: ${data.targetMeanPrice ? ((data.targetMeanPrice - data.quote.price) / data.quote.price * 100).toFixed(2) + "%" : "N/A"})
목표가 최고: ${formatNum(data.targetHighPrice)} | 최저: ${formatNum(data.targetLowPrice)}
애널리스트 수: ${formatNum(data.numberOfAnalysts)}명${warning}

위 데이터를 바탕으로 성장 스토리가 건재한지 분석하세요. 
- PEG Ratio가 핵심입니다. 고성장(20%+)이면서 PEG가 낮다면 강력한 매수 신호일 수 있습니다.
- 목표가 괴리율이 높다면 상승 여력이 충분하다는 뜻입니다.`;
}

export function architectDataToPrompt(data: ArchitectData): string {
    const lines = data.indicators.map(
        (i) => `${i.name}: ${i.price.toLocaleString()} (${i.changePercent >= 0 ? "+" : ""}${i.changePercent.toFixed(2)}%)`
    );

    return `[📊 거시경제 & 자산 배분 데이터]
${lines.join("\n")}

위 데이터를 바탕으로 현재 시장의 사이클 위치를 판단하세요:
- VIX 20 이상이면 공포 구간, 30 이상이면 극단적 공포
- 10년물 금리 상승 → 채권 가격 하락, 성장주 압박
- 금/달러 강세 → 안전자산 선호 심리
- 원유 급등 → 인플레이션 우려
이 환경에서 포트폴리오 리밸런싱 방향을 제시해주세요.`;
}

export function speculatorDataToPrompt(data: SpeculatorData): string {
    // RSI 해석
    let rsiInterpretation = "";
    if (data.rsi14 !== null) {
        if (data.rsi14 >= 70) rsiInterpretation = " 🔴 (과매수 - 이익 실현 고려)";
        else if (data.rsi14 >= 60) rsiInterpretation = " 🟠 (강한 상승세)";
        else if (data.rsi14 <= 30) rsiInterpretation = " 🟢 (과매도 - 기술적 반등 기대)";
        else if (data.rsi14 <= 40) rsiInterpretation = " 🔵 (약세/조정)";
        else rsiInterpretation = " (중립)";
    }

    return `[📊 모멘텀 트레이딩 데이터 - ${data.quote.name} (${data.quote.symbol})]
현재가: ${formatNum(data.quote.price)} ${data.quote.currency} (${data.quote.changePercent >= 0 ? "+" : ""}${data.quote.changePercent.toFixed(2)}%)
이동평균선 정렬: ${data.maAlignment}
50일 이동평균: ${formatNum(data.fiftyDayAverage)} (괴리율: ${formatNum(data.distanceFromMA50)}%)
200일 이동평균: ${formatNum(data.twoHundredDayAverage)}
RSI(14): ${formatNum(data.rsi14)}${rsiInterpretation}
52주 최고: ${formatNum(data.fiftyTwoWeekHigh)} (고점 대비: ${formatNum(data.distanceFrom52WeekHigh)}%)
거래량 비율: ${formatNum(data.volumeRatio)}배 (평소 대비 ${data.volumeRatio && data.volumeRatio > 1 ? "급증 🔥" : "건조"})

위 데이터를 바탕으로 지금이 '진입할 때'인지 '빠져나올 때'인지 날카롭게 판단하세요:
- 50일 이평선 위에 있고(+괴리율) RSI가 70 미만이면 "상승 추세 유지"
- RSI 70 이상 + 거래량 폭발 = 단기 고점 징후 (매도 관점)
- 역배열 + 200일선 아래 = "떨어지는 칼날" (진입 금지)`;
}

export function fatherDataToPrompt(data: FatherData): string {
    const indexLines = data.indicators.map(
        (i) => `${i.name}: ${i.price.toLocaleString()} (${i.changePercent >= 0 ? "+" : ""}${i.changePercent.toFixed(2)}%)`
    );

    const etfLines = data.etfData.map(
        (e) => `${e.symbol} (${e.name}): $${e.price.toFixed(2)} | 보수: ${e.expenseRatio} | 배당: ${e.dividendYield ? (e.dividendYield * 100).toFixed(2) + "%" : "N/A"}`
    );

    return `[📊 시장 지수 & ETF 데이터]
시장 지수:
${indexLines.join("\n")}

주요 인덱스 ETF:
${etfLines.join("\n")}

위 데이터를 바탕으로 시장 전체 관점에서 조언하세요:
- 개별 종목의 단기 등락보다 시장 전체의 우상향 믿음을 강조하세요
- "지금 사야 하나요?" 질문에는 "타이밍을 맞추려 말고 꾸준히 모아가라(DCA)"고 조언하세요
- 보수(Expense Ratio)가 낮은 ETF가 장기적으로 얼마나 유리한지 설명해주세요`;
}

// ═══════════════════════════════════════════════════════
// 공통 시장 데이터 (모든 페르소나 공통)
// ═══════════════════════════════════════════════════════

interface HistoryMetrics {
    change1W: number | null;
    change1M: number | null;
    change3M: number | null;
    change6M: number | null;
    change1Y: number | null;
    changeYTD: number | null;
    dropFromHigh: number | null;
}

interface CommonMarketSnapshot {
    indicators: MarketIndicator[];
    yieldCurveSpread: number | null; // 10Y - 3M (장단기 금리차)
    sp500History: HistoryMetrics | null;
}

// S&P 500 과거 데이터 계산 (캐싱됨)
async function calculateHistoryMetrics(): Promise<HistoryMetrics | null> {
    try {
        const symbol = "^GSPC";
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 400); // 1년 이상 여유있게

        const historical = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: "1d",
        });

        if (!historical || historical.length < 250) return null;

        const closes = historical.map((h) => h.close);
        const dates = historical.map((h) => new Date(h.date)); // 날짜 확인용
        const currentPrice = closes[closes.length - 1];

        // 인덱스 도우미 (거래일 기준 역산)
        const getChange = (daysAgo: number) => {
            const idx = Math.max(0, closes.length - 1 - daysAgo);
            const prevPrice = closes[idx];
            return prevPrice ? ((currentPrice - prevPrice) / prevPrice) : null;
        };

        // YTD 계산
        const currentYear = new Date().getFullYear();
        const startOfYearIdx = dates.findIndex(d => d.getFullYear() === currentYear);
        const ytdPrice = startOfYearIdx >= 0 ? closes[startOfYearIdx] : closes[0];
        const changeYTD = ((currentPrice - ytdPrice) / ytdPrice);

        // 52주 고점 대비 하락률
        const maxPrice = Math.max(...closes.slice(-252)); // 최근 약 1년
        const dropFromHigh = ((currentPrice - maxPrice) / maxPrice);

        return {
            change1W: getChange(5),   // 약 1주 (5 거래일)
            change1M: getChange(21),  // 약 1개월
            change3M: getChange(63),  // 약 3개월
            change6M: getChange(126), // 약 6개월
            change1Y: getChange(252), // 약 1년
            changeYTD,
            dropFromHigh,
        };
    } catch (e) {
        console.error("Failed to calculate history metrics:", e);
        return null;
    }
}

async function fetchCommonMarketData(): Promise<CommonMarketSnapshot> {
    const cacheKey = "common:market-snapshot-v3";
    const cached = marketCache.get<CommonMarketSnapshot>(cacheKey);
    if (cached) return cached;

    const symbols = [
        // 주요 지수
        { symbol: "^GSPC", name: "S&P 500" },
        { symbol: "^IXIC", name: "나스닥" },
        { symbol: "^DJI", name: "다우존스" },
        { symbol: "^RUT", name: "러셀 2000 (중소형주)" },
        { symbol: "^SOX", name: "필라델피아 반도체 지수 (SOX)" },
        // 변동성
        { symbol: "^VIX", name: "VIX (공포지수)" },
        // 금리
        { symbol: "^TNX", name: "미국 10년물 국채금리" },
        { symbol: "^TYX", name: "미국 30년물 국채금리" },
        { symbol: "^IRX", name: "미국 3개월물 국채금리" },
        // 원자재 & 통화
        { symbol: "DX-Y.NYB", name: "달러 인덱스 (DXY)" },
        { symbol: "GC=F", name: "금 (Gold)" },
        { symbol: "CL=F", name: "원유 (WTI)" },
        // 디지털 자산
        { symbol: "BTC-USD", name: "비트코인 (BTC)" },
    ];

    const indicators: MarketIndicator[] = [];
    for (const { symbol, name } of symbols) {
        const quote = await fetchQuote(symbol);
        if (quote) {
            indicators.push({
                symbol, name,
                price: quote.price,
                change: quote.change,
                changePercent: quote.changePercent,
                high52: quote.fiftyTwoWeekHigh,
                low52: quote.fiftyTwoWeekLow,
                ma50: quote.fiftyDayAverage,
                ma200: quote.twoHundredDayAverage,
            });
        }
    }

    // 장단기 금리차 계산: 10년물 - 3개월물
    const tnx = indicators.find((i) => i.symbol === "^TNX");
    const irx = indicators.find((i) => i.symbol === "^IRX");
    const yieldCurveSpread = (tnx && irx)
        ? Math.round((tnx.price - irx.price) * 100) / 100
        : null;

    // S&P 500 히스토리컬 데이터 계산
    const sp500History = await calculateHistoryMetrics();

    const snapshot: CommonMarketSnapshot = { indicators, yieldCurveSpread, sp500History };

    if (indicators.length > 0) {
        marketCache.set(cacheKey, snapshot, MarketDataCache.MARKET_TTL);
    }
    return snapshot;
}

// ─── 페르소나별 시장 해석 렌즈 ───

function getPersonaMarketLens(personaId: string): string {
    const commonInstruction = `
🚨 [답변 태도: 명확하되 안전하게]
- "확인해보세요" 같은 회피형 답변 금지. 대신 "데이터상 ~한 구간으로 판단됩니다"라고 명확히 의견을 내세요.
- 단, "무조건 사세요/파세요" 같은 명령조는 금지. "매력적인 진입 시점입니다", "리스크 관리가 필요합니다" 처럼 전문적인 뉘앙스로 말하세요.
- 모든 판단의 근거는 반드시 위 데이터에서 찾아서 인용하세요.`;

    switch (personaId) {
        case "sage":
            return `
${commonInstruction}
🔍 [현인의 판단 기준]
- "지금 사야 하나요?" → 고점 대비 낙폭과 밸류에이션(PER/PBR)을 근거로 가치 평가를 내리세요.
- 데이터가 싸다면 "안전마진이 확보된 매력적인 구간"이라고 분명히 말하세요.
- 단정 짓지 말고 "확률적으로 잃지 않을 가능성이 높은 자리"라는 점을 강조하세요.`;

        case "hero":
            return `
${commonInstruction}
🔍 [영웅의 판단 기준]
- "지금 사야 하나요?" → 단순히 싸다고 권하지 말고, "상승 추세"와 "성장 스토리"가 살아있는지 판단하세요.
- 신고가 근처라면 "추세 추종 전략이 유효한 구간"이라고, 꺾였으면 "모멘텀 둔화로 인한 관망 필요"라고 진단하세요.
- "상승 여력이 충분해 보입니다" 또는 "성장성 대비 과열권입니다"라고 의견을 제시하세요.`;

        case "architect":
            return `
${commonInstruction}
🔍 [원칙가의 판단 기준]
- "지금 사야 하나요?" → 종목 자체보다 "포트폴리오 내 역할"을 기준으로 답변하세요.
- "현재 시장 상황에서는 주식 비중을 줄이고 안전자산을 늘리는 리밸런싱이 유리합니다" 처럼 구체적인 배분 전략을 제시하세요.
- 경기 사이클 신호(금리차 등)를 근거로 "방어적 태세" 또는 "적극적 투자"를 권고하세요.`;

        case "speculator":
            return `
${commonInstruction}
🔍 [투기꾼의 판단 기준]
- "지금 사야 하나요?" → 철저히 가격과 거래량, 추세(이평선)로만 판단하세요.
- 50일선 위+상승 추세라면 "매수 우위 구간(Buy Zone)"이라고, 역배열이면 "진입 금지(No Action)"라고 명명하세요.
- RSI 과열 시 "단기적 조정 가능성이 높으니 차익 실현을 고려하세요"라고 날카롭게 조언하세요.`;

        case "father":
            return `
${commonInstruction}
🔍 [아버지의 판단 기준]
- "지금 사야 하나요?" → "타이밍을 예측하려는 시도 자체가 무의미함"을 강조하세요.
- 기업 분석보다는 "자본주의와 시장의 우상향"을 근거로 "꾸준한 적립식 매수(DCA)가 최선의 전략"임을 설득하세요.
- 불안해하는 유저에게는 "지금의 하락은 장기적으로 싼 가격에 모을 기회"라고 안심시키세요.`;

        default:
            return commonInstruction;
    }
}

function commonMarketDataToPrompt(snapshot: CommonMarketSnapshot, personaId: string): string {
    const { indicators, yieldCurveSpread } = snapshot;
    if (indicators.length === 0) return "";

    // 카테고리별 정렬
    const indexSymbols = ["^GSPC", "^IXIC", "^DJI", "^RUT", "^SOX"];
    const rateSymbols = ["^TNX", "^TYX", "^IRX"];
    const commoditySymbols = ["DX-Y.NYB", "GC=F", "CL=F", "BTC-USD"];

    const formatLine = (i: MarketIndicator) => {
        let details = "";

        // 고점 대비 낙폭 (장기 관점)
        if (i.high52) {
            const drop = ((i.price - i.high52) / i.high52) * 100;
            if (drop < -10) details += ` | 고점대비 ${drop.toFixed(1)}%`;
        }

        // 이평선 괴리 (추세 관점)
        if (i.ma200) {
            const trend = i.price > i.ma200 ? "상승추세" : "하락추세";
            // 200일선과 5% 이상 차이나면 언급
            if (Math.abs((i.price - i.ma200) / i.ma200) > 0.05) {
                details += ` | ${trend}(200일선 위)`;
            }
        }

        return `  ${i.name}: ${i.price.toLocaleString()} (${i.changePercent >= 0 ? "+" : ""}${i.changePercent.toFixed(2)}%)${details}`;
    };

    const indexLines = indicators.filter((i) => indexSymbols.includes(i.symbol)).map(formatLine);
    const rateLines = indicators.filter((i) => rateSymbols.includes(i.symbol)).map(formatLine);
    const commodityLines = indicators.filter((i) => commoditySymbols.includes(i.symbol)).map(formatLine);

    // 해석 코멘트 생성
    const comments: string[] = [];

    // VIX 해석
    const vix = indicators.find((i) => i.symbol === "^VIX");
    if (vix) {
        if (vix.price >= 30) comments.push("⚠️ VIX 30+: 시장 극단적 공포");
        else if (vix.price >= 20) comments.push("⚠️ VIX 20+: 시장 불안 심리 감지");
        else if (vix.price <= 12) comments.push("✅ VIX 12 이하: 시장 안정/낙관");
    }

    // 장단기 금리차 해석
    if (yieldCurveSpread !== null) {
        if (yieldCurveSpread < 0) comments.push(`🔴 장단기 금리 역전 (${yieldCurveSpread}%p): 경기침체 경고 신호`);
        else if (yieldCurveSpread < 0.5) comments.push(`🟡 장단기 금리차 협소 (${yieldCurveSpread}%p): 경기 둔화 우려`);
        else comments.push(`🟢 장단기 금리차 정상 (${yieldCurveSpread}%p): 경기 확장 구간`);
    }

    // 달러 해석
    const dxy = indicators.find((i) => i.symbol === "DX-Y.NYB");
    if (dxy) {
        if (dxy.price >= 105) comments.push("💪 달러 강세 (DXY 105+)");
        else if (dxy.price <= 95) comments.push("📉 달러 약세 (DXY 95-)");
    }

    // 원유 해석
    const oil = indicators.find((i) => i.symbol === "CL=F");
    if (oil) {
        if (oil.price >= 90) comments.push("🛢️ 원유 $90+: 인플레이션 우려");
        else if (oil.price <= 50) comments.push("🛢️ 원유 $50 이하: 경기 둔화 신호");
    }

    const commentSection = comments.length > 0 ? `\n\n📌 팩트 기반 시장 요약:\n${comments.join("\n")}` : "";

    // 페르소나별 해석 렌즈
    const personaLens = getPersonaMarketLens(personaId);

    return `[📡 실시간 시장 현황]

주요 지수:
${indexLines.join("\n")}

금리:
${rateLines.join("\n")}
  장단기 금리차 (10Y-3M): ${yieldCurveSpread !== null ? `${yieldCurveSpread}%p` : "N/A"}

원자재·통화·디지털자산:
${commodityLines.join("\n")}
${commentSection}

${getPersonaHistoryString(snapshot.sp500History, personaId)}
${personaLens}

위 실시간 데이터를 당신의 투자 철학과 위 해석 렌즈에 따라 분석하고, 구체적 수치를 인용하며 답변하세요.`;
}

// 페르소나별 성향에 맞는 기간 수익률 문자열 생성
function getPersonaHistoryString(history: HistoryMetrics | null, personaId: string): string {
    if (!history) return "";
    const p = (n: number | null) => n !== null ? `${(n * 100).toFixed(2)}%` : "N/A";

    switch (personaId) {
        case "speculator": // 단기 추세
            return `📊 S&P 500 단기 추세: 1주(${p(history.change1W)}) | 1개월(${p(history.change1M)})`;
        case "hero": // 중기 모멘텀
            return `📊 S&P 500 성장 모멘텀: 3개월(${p(history.change3M)}) | 6개월(${p(history.change6M)}) | YTD(${p(history.changeYTD)})`;
        case "architect": // 사이클
            return `📊 시장 사이클 지표 (S&P 500): 1개월(${p(history.change1M)}) | 3개월(${p(history.change3M)}) | 1년(${p(history.change1Y)})`;
        case "sage": // 장기 가치 & 낙폭
            return `📊 S&P 500 장기 성과: YTD(${p(history.changeYTD)}) | 1년(${p(history.change1Y)}) | 고점대비 낙폭(${p(history.dropFromHigh)})`;
        case "father": // 장기 투자
            return `📊 시장 성과 (S&P 500): 올해 수익률 ${p(history.changeYTD)} (역사적 연평균 약 10% 내외)`;
        default:
            return "";
    }
}

// ═══════════════════════════════════════════════════════
// 통합 함수: 페르소나 ID + 유저 종목 → 프롬프트 텍스트
// ═══════════════════════════════════════════════════════

export async function getPersonaMarketContext(
    personaId: string,
    userTickers: string[]
): Promise<string> {
    try {
        // Step 1: 공통 시장 데이터 (모든 페르소나 공통) + 페르소나별 해석 렌즈
        const commonData = await fetchCommonMarketData();
        const commonPrompt = commonMarketDataToPrompt(commonData, personaId);

        // Step 2: 페르소나별 전문 데이터
        let specializedPrompt = "";

        switch (personaId) {
            case "sage": {
                if (userTickers.length > 0) {
                    const results = await Promise.all(
                        userTickers.slice(0, 5).map((t) => fetchSageData(t))
                    );
                    const valid = results.filter((r): r is SageData => r !== null);
                    if (valid.length > 0) {
                        specializedPrompt = valid.map(sageDataToPrompt).join("\n\n");
                    }
                }
                break;
            }

            case "hero": {
                if (userTickers.length > 0) {
                    const results = await Promise.all(
                        userTickers.slice(0, 5).map((t) => fetchHeroData(t))
                    );
                    const valid = results.filter((r): r is HeroData => r !== null);
                    if (valid.length > 0) {
                        specializedPrompt = valid.map(heroDataToPrompt).join("\n\n");
                    }
                }
                break;
            }

            case "architect": {
                const data = await fetchArchitectData();
                specializedPrompt = architectDataToPrompt(data);
                break;
            }

            case "speculator": {
                if (userTickers.length > 0) {
                    const results = await Promise.all(
                        userTickers.slice(0, 5).map((t) => fetchSpeculatorData(t))
                    );
                    const valid = results.filter((r): r is SpeculatorData => r !== null);
                    if (valid.length > 0) {
                        specializedPrompt = valid.map(speculatorDataToPrompt).join("\n\n");
                    }
                }
                break;
            }

            case "father": {
                const data = await fetchFatherData();
                specializedPrompt = fatherDataToPrompt(data);
                break;
            }
        }

        // Step 3: 공통 + 전문 합치기
        const parts = [commonPrompt, specializedPrompt].filter(Boolean);
        return parts.join("\n\n");
    } catch (error) {
        console.error(`[MarketData] Failed to get context for ${personaId}:`, error);
        return "";
    }
}

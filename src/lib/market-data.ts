/**
 * Persona-Specific Market Data Fetcher
 * 각 페르소나 성향에 맞는 시장 데이터를 Yahoo Finance에서 가져옵니다.
 * 캐싱 레이어를 통해 중복 API 호출을 방지합니다.
 */

import YahooFinance from "yahoo-finance2";
import { marketCache, MarketDataCache } from "./market-data-cache";
import { StockQuote, EnrichedPortfolioItem, CommonMarketData, MarketIndicator, SageData, HeroData, ArchitectData, SpeculatorData, FatherData, DividendCalendarData, BenchmarkHistoryData } from "./market-types";

const yahooFinance = new YahooFinance();

// ... (existing imports)
// ... (existing imports)

// ... (existing imports)

// ─── 공통 시장 데이터 (Common Context) ───

export async function fetchCommonMarketData(): Promise<CommonMarketData | null> {
    const cacheKey = "common:market-context";
    const cached = marketCache.get<CommonMarketData>(cacheKey);
    if (cached) return cached;

    try {
        // 1. 주요 지표 병렬 호출
        const symbols = [
            "^GSPC", "^IXIC", "^DJI", "^TNX", "^IRX", "^VIX", // Indices & Rates
            "DX-Y.NYB", "GC=F", "CL=F", "HG=F", // Macro
            "RSP", "HYG", "JPY=X", "TIP", "EMB", // Risk & Real Rates
            "IVW", "IVE", "SOXX", // Style
            "BTC-USD", "^RUT", // Crypto & Small Cap
            "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA" // M7
        ];
        const quotes = await Promise.all(symbols.map(s => fetchQuote(s)));

        const getQuote = (sym: string) => quotes.find(q => q?.symbol === sym);

        const snp500 = getQuote("^GSPC");
        const nasdaq = getQuote("^IXIC");
        const dow = getQuote("^DJI");
        const rut = getQuote("^RUT"); // Russell 2000
        const tnx = getQuote("^TNX"); // 10 Year
        const irx = getQuote("^IRX"); // 3 Month (Proxy for Short Term)
        const vix = getQuote("^VIX");
        const dxy = getQuote("DX-Y.NYB");
        const gold = getQuote("GC=F");
        const wti = getQuote("CL=F");
        const rsp = getQuote("RSP");
        const hyg = getQuote("HYG");
        const jpy = getQuote("JPY=X");
        const tip = getQuote("TIP"); // TIPS
        const emb = getQuote("EMB"); // Emerging Market

        const ivw = getQuote("IVW"); // Growth
        const ive = getQuote("IVE"); // Value
        const soxx = getQuote("SOXX"); // Semi
        const btc = getQuote("BTC-USD");
        const copper = getQuote("HG=F");

        // M7
        const aapl = getQuote("AAPL");
        const msft = getQuote("MSFT");
        const googl = getQuote("GOOGL");
        const amzn = getQuote("AMZN");
        const tsla = getQuote("TSLA");
        const meta = getQuote("META");
        const nvda = getQuote("NVDA");

        if (!snp500 || !vix || !tnx) return null; // 필수 데이터 누락 시

        // Yield Spread Calculation (10Y - 3M)
        let yieldSpread = null;
        if (tnx && irx) {
            yieldSpread = tnx.price - irx.price;
        }

        // 2. 공포/탐욕 지수 (Proxy Calculation)
        // VIX와 S&P500 모멘텀(RSI)을 기반으로 추정
        const snpRsi = await calculateRSI("^GSPC", 14) || 50;
        const vixValue = vix.price;

        // 간단한 알고리즘:
        // RSI가 높으면 Greed, 낮으면 Fear
        // VIX가 낮으면 Greed, 높으면 Fear
        // Score = (RSI Score + VIX Score) / 2

        let rsiScore = snpRsi; // 0~100
        let vixScore = 100 - (Math.min(vixValue, 50) * 2); // VIX 20 -> 60, VIX 30 -> 40, VIX 10 -> 80

        let sentimentScore = Math.round((rsiScore * 0.6) + (vixScore * 0.4)); // RSI 비중을 조금 더 높게

        let sentimentStatus: CommonMarketData["fearAndGreedIndex"]["status"] = "Neutral";
        if (sentimentScore >= 75) sentimentStatus = "Extreme Greed";
        else if (sentimentScore >= 60) sentimentStatus = "Greed";
        else if (sentimentScore <= 25) sentimentStatus = "Extreme Fear";
        else if (sentimentScore <= 40) sentimentStatus = "Fear";

        // 3. 섹터 로테이션 (주요 섹터 ETF 등락률 비교)
        // XLK(기술), XLV(헬스), XLF(금융), XLE(에너지), XLI(산업), XLP(필수소비), XLY(임의소비)
        const sectors = ["XLK", "XLV", "XLF", "XLE", "XLI", "XLP", "XLY"];
        const sectorQuotes = await Promise.all(sectors.map(s => fetchQuote(s)));

        const sectorPerformances = sectorQuotes
            .filter(q => q !== null)
            .map(q => ({ name: q!.symbol, change: q!.changePercent }))
            .sort((a, b) => b.change - a.change); // 내림차순 정렬

        const leaders = sectorPerformances.slice(0, 2).map(s => s.name);
        const laggards = sectorPerformances.slice(-2).map(s => s.name);

        const data: CommonMarketData = {
            indices: {
                snp500: { symbol: "^GSPC", name: "S&P 500", price: snp500.price, change: snp500.change, changePercent: snp500.changePercent },
                nasdaq: { symbol: "^IXIC", name: "Nasdaq", price: nasdaq?.price ?? 0, change: nasdaq?.change ?? 0, changePercent: nasdaq?.changePercent ?? 0 },
                dow: { symbol: "^DJI", name: "Dow Jones", price: dow?.price ?? 0, change: dow?.change ?? 0, changePercent: dow?.changePercent ?? 0 },
                russell2000: { symbol: "^RUT", name: "Russell 2000", price: rut?.price ?? 0, change: rut?.change ?? 0, changePercent: rut?.changePercent ?? 0 },
            },
            m7: {
                aapl: { symbol: "AAPL", name: "Apple", price: aapl?.price ?? 0, change: aapl?.change ?? 0, changePercent: aapl?.changePercent ?? 0 },
                msft: { symbol: "MSFT", name: "Microsoft", price: msft?.price ?? 0, change: msft?.change ?? 0, changePercent: msft?.changePercent ?? 0 },
                googl: { symbol: "GOOGL", name: "Alphabet", price: googl?.price ?? 0, change: googl?.change ?? 0, changePercent: googl?.changePercent ?? 0 },
                amzn: { symbol: "AMZN", name: "Amazon", price: amzn?.price ?? 0, change: amzn?.change ?? 0, changePercent: amzn?.changePercent ?? 0 },
                tsla: { symbol: "TSLA", name: "Tesla", price: tsla?.price ?? 0, change: tsla?.change ?? 0, changePercent: tsla?.changePercent ?? 0 },
                meta: { symbol: "META", name: "Meta", price: meta?.price ?? 0, change: meta?.change ?? 0, changePercent: meta?.changePercent ?? 0 },
                nvda: { symbol: "NVDA", name: "Nvidia", price: nvda?.price ?? 0, change: nvda?.change ?? 0, changePercent: nvda?.changePercent ?? 0 },
            },
            macro: {
                vix: vix.price,
                tenYearBondYield: tnx.price,
                dollarIndex: dxy?.price ?? 0,
                gold: gold?.price ?? 0,
                wti: wti?.price ?? 0,
                rspChangePercent: rsp?.changePercent ?? null,
                hygPrice: hyg?.price ?? null,
                jpyRate: jpy?.price ?? null,
                ivwChangePercent: ivw?.changePercent ?? null,
                iveChangePercent: ive?.changePercent ?? null,
                soxxChangePercent: soxx?.changePercent ?? null,
                btcPrice: btc?.price ?? null,
                btcChangePercent: btc?.changePercent ?? null,
                copperPrice: copper?.price ?? null,
                yieldSpread10Y2Y: yieldSpread,
                tipPrice: tip?.price ?? null,
                embPrice: emb?.price ?? null,
            },
            sectorRotation: {
                leaders,
                laggards
            },
            fearAndGreedIndex: {
                score: sentimentScore,
                status: sentimentStatus
            }
        };

        marketCache.set(cacheKey, data, MarketDataCache.MARKET_TTL);
        return data;

    } catch (error) {
        console.error("[MarketData] Failed to fetch common market data:", error);
        return null;
    }
}

export function commonDataToPrompt(data: CommonMarketData): string {
    return `[🌍 공통 시장 대시보드 (Real-time Market Dashboard)]
1. 📊 [시장 지수] 전체적 흐름
   - S&P 500: ${data.indices.snp500.price.toFixed(2)} (${formatChangePercent(data.indices.snp500.changePercent)})
   - 나스닥 (Tech): ${data.indices.nasdaq.price.toFixed(2)} (${formatChangePercent(data.indices.nasdaq.changePercent)})
   - 다우존스 (Blue Chip): ${data.indices.dow.price.toFixed(2)} (${formatChangePercent(data.indices.dow.changePercent)})
   - 러셀 2000 (Small Cap): ${data.indices.russell2000.price.toFixed(2)} (${formatChangePercent(data.indices.russell2000.changePercent)}) → ${data.indices.russell2000.changePercent > 0.5 ? "온기 확산 긍정적" : "대형주 쏠림 주의"}

2. 🌏 [거시 경제] 밸류에이션 환경
   - 10년물 국채금리: ${data.macro.tenYearBondYield.toFixed(2)}% (상승 시 주식 할인율 증가)
   - 달러 인덱스 (DXY): ${data.macro.dollarIndex.toFixed(2)} (기준 100)
   - 원유 (WTI): $${data.macro.wti.toFixed(2)} | 금: $${data.macro.gold.toFixed(2)}
   - [경기 침체 경고] 장단기 금리차(10Y-3M): ${data.macro.yieldSpread10Y2Y !== null ? data.macro.yieldSpread10Y2Y.toFixed(2) + "%p" : "N/A"} (${data.macro.yieldSpread10Y2Y !== null && data.macro.yieldSpread10Y2Y < 0 ? "🚨 역전됨 (1년 내 침체 확률 80% 이상)" : "정상 구간"})

3. ⚠️ [위험 신호 & 유동성] 스트레스 테스트
   - VIX (공포지수): ${data.macro.vix.toFixed(2)} (20 이하면 안정, 30 이상이면 공포)
   - 하이일드 채권 (HYG): ${formatNum(data.macro.hygPrice)} (기업 부도 위험 측정, 하락 시 위험)
   - 신흥국 채권 (EMB): ${formatNum(data.macro.embPrice)} (글로벌 약한 고리, 자금 이탈 여부)
   - 엔/달러 환율: ${data.macro.jpyRate !== null ? data.macro.jpyRate.toFixed(2) : "N/A"} (엔 캐리 청산 감시)

4. 🏥 [시장 건전성 & 로테이션] 질적 분석
   - S&P 500 동일가중 (RSP): ${formatChangePercent(data.macro.rspChangePercent)} (지수 대비 낮으면 대형주 쏠림 심화)
   - 스타일 전쟁: 성장주(IVW) ${formatChangePercent(data.macro.ivwChangePercent)} vs 가치주(IVE) ${formatChangePercent(data.macro.iveChangePercent)} → ${(data.macro.ivwChangePercent || 0) > (data.macro.iveChangePercent || 0) ? "성장주 우위 (Risk On)" : "가치주 우위 (Risk Off)"
        }
   - 반도체 (SOXX): ${formatChangePercent(data.macro.soxxChangePercent)} (AI/기술주 랠리의 선행 카나리아)

5. 🔮 [선행 지표 & 실물 경기] 미래 예측
   - 비트코인 (BTC): ${formatChangePercent(data.macro.btcChangePercent)} (가장 민감한 투기 심리/유동성 지표)
   - 구리 (Copper): ${data.macro.copperPrice ? formatNum(data.macro.copperPrice) : "N/A"} (실물 경기 제조업 수요 대변)
   - 물가연동채 (TIP): ${formatNum(data.macro.tipPrice)} (실질 금리 및 인플레 방어 수요)

6. 🏢 [M7 주도주] 시장 견인력
   - 🍎AAPL ${formatChangePercent(data.m7.aapl.changePercent)} | 🤖NVDA ${formatChangePercent(data.m7.nvda.changePercent)} | ☁️MSFT ${formatChangePercent(data.m7.msft.changePercent)}
   - 📦AMZN ${formatChangePercent(data.m7.amzn.changePercent)} | 🔍GOOGL ${formatChangePercent(data.m7.googl.changePercent)} | 📘META ${formatChangePercent(data.m7.meta.changePercent)} | 🚗TSLA ${formatChangePercent(data.m7.tsla.changePercent)}

[⭐️ 페르소나 행동 지침: 시황 분석 요청 시]
Q: "요즘 시황 어때?" 또는 "시장 상황 분석해줘" 라는 질문을 받으면,
반드시 **위 6개 카테고리의 데이터를 모두 종합하여** IB(투자은행) 리포트 수준의 깊이 있는 답변을 제공하세요.
- 단순 나열 금지. 지표 간의 **'연관성'**을 찾아내어 스토리텔링하세요.
  (예: "지수는 올랐지만(1번), 신흥국 채권과 구리가 빠지는 걸 보니(3번, 5번) 이는 건전하지 않은 유동성 랠리일 수 있습니다.")
- 장단기 금리차 역전 여부와 반도체(SOXX)의 방향성은 필수로 언급하세요.
- 비트코인 급등락이 있다면 시장 심리와 연결 지어 설명하세요.
`;
}

// [Interfaces moved to market-types.ts]

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
        console.error(`[MarketData] Failed to fetch quote for ${symbol}: `, error);
        return null;
    }
}

// ─── quoteSummary 가져오기 (캐싱 포함) ───

type SummaryModule = "defaultKeyStatistics" | "financialData" | "summaryDetail" | "netSharePurchaseActivity" | "earningsHistory" | "fundProfile" | "topHoldings" | "summaryProfile" | "calendarEvents";

async function fetchSummary(
    symbol: string,
    modules: SummaryModule[]
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
        console.error(`[MarketData] Failed to fetch summary for ${symbol}: `, error);
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
        console.error(`[MarketData] RSI calculation failed for ${symbol}: `, error);
        return null;
    }
}

// ─── ATR(14) & Bollinger Bands(20, 2) 계산 ───

async function calculateTechnicalIndicators(symbol: string): Promise<{ atr: number | null; bbUpper: number | null; bbLower: number | null }> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 60); // 60일치 데이터 (SMA20, ATR14 위해 여유있게)

        const historical = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: "1d",
        }) as { date: Date; open: number; high: number; low: number; close: number; volume: number }[];

        if (!historical || historical.length < 22) return { atr: null, bbUpper: null, bbLower: null };

        // --- ATR(14) Calculation ---
        let trSum = 0;
        // Need at least 15 days including prev close for initial TR
        const atrPeriod = 14;
        const atrData = historical.slice(-(atrPeriod + 1));

        // Simple TR average for approximation (Wilder's Smoothing is better but simple avg is okay for prompt)
        // Or calculate properly: TR = Max(H-L, |H-Cp|, |L-Cp|)
        let trs: number[] = [];
        for (let i = 1; i < atrData.length; i++) {
            const high = atrData[i].high;
            const low = atrData[i].low;
            const prevClose = atrData[i - 1].close;
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trs.push(tr);
        }
        const atr = trs.reduce((a, b) => a + b, 0) / trs.length;

        // --- Bollinger Bands(20, 2) Calculation ---
        const bbPeriod = 20;
        const bbStdDev = 2;
        const bbData = historical.slice(-bbPeriod).map(d => d.close);

        if (bbData.length < bbPeriod) return { atr, bbUpper: null, bbLower: null };

        const sma = bbData.reduce((a, b) => a + b, 0) / bbPeriod;
        const variance = bbData.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / bbPeriod;
        const stdDev = Math.sqrt(variance);

        const bbUpper = sma + (stdDev * bbStdDev);
        const bbLower = sma - (stdDev * bbStdDev);

        return { atr, bbUpper, bbLower };

    } catch (error) {
        console.error(`[MarketData] Technical indicators failed for ${symbol}: `, error);
        return { atr: null, bbUpper: null, bbLower: null };
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
        "netSharePurchaseActivity", // 내부자 거래
    ]);

    const stats = (summary?.defaultKeyStatistics || {}) as Record<string, unknown>;
    const financial = (summary?.financialData || {}) as Record<string, unknown>;
    const detail = (summary?.summaryDetail || {}) as Record<string, unknown>;
    const insider = (summary?.netSharePurchaseActivity || {}) as Record<string, unknown>;
    const netInsider = (insider?.netPercentInsiderShares as number) ?? (insider?.buyInfoShares as number) ?? 0;

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
        enterpriseToEbitda: (stats.enterpriseToEbitda as number) ?? null,
        netSharePurchaseActivity: netInsider,
        netInsiderBuy: netInsider,
        // Sage (Added)
        fcfYield: (financial.freeCashflow && detail.marketCap) ? (financial.freeCashflow as number) / (detail.marketCap as number) : null,
        roic: (financial.returnOnEquity as number) ?? null, // ROE as proxy for now, heavily correlated for high quality firms
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
        "earningsHistory", // 어닝 서프라이즈 확인용
        "summaryDetail" // Added for PriceToSales
    ]);

    const stats = (summary?.defaultKeyStatistics || {}) as Record<string, unknown>;
    const financial = (summary?.financialData || {}) as Record<string, unknown>;
    const earnings = (summary?.earningsHistory || {}) as { history?: any[] };
    const detail = (summary?.summaryDetail || {}) as Record<string, unknown>; // Added

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
        shortPercentOfFloat: (stats.shortPercentOfFloat as number) ?? null,
        shortRatio: (stats.shortRatio as number) ?? null,
        recommendationKey: (financial.recommendationKey as string) ?? null,
        earningsSurprise: (earnings.history && earnings.history[0]?.surprisePercent as number) ?? null, // 최근 분기 서프라이즈
        // Hero (Added)
        psr: (detail.priceToSalesTrailing12Months as number) ?? null,
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
        { symbol: "^IRX", name: "미국 3개월물 국채금리" },
        // Architect (Added)
        { symbol: "^MOVE", name: "채권 변동성 (MOVE)" },
        { symbol: "XLY", name: "경기민감주 (XLY)" },
        { symbol: "XLP", name: "필수소비재 (XLP)" },
        { symbol: "SPHB", name: "High Beta (SPHB)" },
        { symbol: "SPLV", name: "Low Volatility (SPLV)" },
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

    // 금리차 계산 (10Y - 3M approximation for 2Y if needed, or just use 3M as short term anchor)
    // User requested 10Y-2Y. Since 2Y (^TU, ZT=F) is hard to fetch reliably, we use 10Y-3M as a proxy for "Yield Curve".
    // We will label it as "Yield Spread (10Y-3M)" in the prompt if we use 3M.
    // However, to satisfy the interface field `yieldSpread10Y2Y`, we populate it here.
    const tnx = indicators.find(i => i.symbol === "^TNX");
    const termShort = indicators.find(i => i.symbol === "^IRX"); // Using 3M

    let yieldSpread = null;
    if (tnx && termShort) {
        yieldSpread = tnx.price - termShort.price;
    }

    const move = indicators.find(i => i.symbol === "^MOVE")?.price ?? null;
    const xly = indicators.find(i => i.symbol === "XLY")?.price ?? null;
    const xlp = indicators.find(i => i.symbol === "XLP")?.price ?? null;
    const sphb = indicators.find(i => i.symbol === "SPHB")?.price ?? null;
    const splv = indicators.find(i => i.symbol === "SPLV")?.price ?? null;

    const data: ArchitectData = {
        indicators,
        yieldSpread10Y2Y: yieldSpread,
        moveIndex: move,
        xlyPrice: xly,
        xlpPrice: xlp,
        sphbPrice: sphb,
        splvPrice: splv
    };
    marketCache.set(cacheKey, data, MarketDataCache.MARKET_TTL);
    return data;
}

// ─── MACD & Money Flow 계산 ───

async function calculateMACD(symbol: string): Promise<{ macd: number; signal: number; histogram: number; trend: "Bullish" | "Bearish" | "Neutral" } | null> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 200); // 넉넉히 26*2 + 9 + alpha

        const historical = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: "1d",
        }) as { close: number }[];

        if (!historical || historical.length < 35) return null;

        const closes = historical.map(d => d.close);

        // EMA Helper
        const calculateEMA = (data: number[], period: number) => {
            const k = 2 / (period + 1);
            let ema = data[0];
            const result = [ema];
            for (let i = 1; i < data.length; i++) {
                ema = (data[i] * k) + (ema * (1 - k));
                result.push(ema);
            }
            return result;
        };

        const ema12 = calculateEMA(closes, 12);
        const ema26 = calculateEMA(closes, 26);

        // MACD Line = EMA12 - EMA26
        // EMA26은 closes[25]부터 유효하므로 길이 맞춤
        const macdLine: number[] = [];
        for (let i = 0; i < closes.length; i++) {
            if (i < 25) macdLine.push(0); // padding
            else macdLine.push(ema12[i] - ema26[i]);
        }

        // Signal Line = MACD Line의 9일 EMA
        // MACD Line이 유효한 시점(25)부터 9일치 더 있어야 함 -> 33
        const validMacd = macdLine.slice(25);
        if (validMacd.length < 9) return null;

        const signalLine = calculateEMA(validMacd, 9);

        // 현재 값들
        const currentMACD = macdLine[macdLine.length - 1];
        const currentSignal = signalLine[signalLine.length - 1];
        const histogram = currentMACD - currentSignal;

        let trend: "Bullish" | "Bearish" | "Neutral" = "Neutral";
        if (histogram > 0 && histogram > (macdLine[macdLine.length - 2] - signalLine[signalLine.length - 2])) {
            trend = "Bullish"; // 히스토그램 양수 & 증가
        } else if (histogram < 0 && histogram < (macdLine[macdLine.length - 2] - signalLine[signalLine.length - 2])) {
            trend = "Bearish"; // 히스토그램 음수 & 감소
        }

        return {
            macd: currentMACD,
            signal: currentSignal,
            histogram,
            trend
        };

    } catch (e) {
        console.warn(`[MarketData] MACD failed for ${symbol}`, e);
        return null;
    }
}

/**
 * 🕵️ 전설의 투기꾼 (Speculator) - 모멘텀 트레이딩
 * 이동평균선, 거래량, 52주 고저, 모멘텀 지표 (MACD, RSI, BB, MFI, Stoch, OBV)
 */
async function calculateMFI(symbol: string, period: number = 14): Promise<number | null> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (period * 4));

        const historical = await yahooFinance.historical(symbol, {
            period1: startDate, period2: endDate, interval: "1d",
        }) as { high: number; low: number; close: number; volume: number }[];

        if (!historical || historical.length < period + 1) return null;

        const data = historical.slice(-(period + 1));
        let posFlow = 0;
        let negFlow = 0;

        for (let i = 1; i < data.length; i++) {
            const tp = (data[i].high + data[i].low + data[i].close) / 3;
            const prevTp = (data[i - 1].high + data[i - 1].low + data[i - 1].close) / 3;
            const flow = tp * data[i].volume;

            if (tp > prevTp) posFlow += flow;
            else if (tp < prevTp) negFlow += flow;
        }

        if (negFlow === 0) return 100;
        const mfr = posFlow / negFlow;
        return 100 - (100 / (1 + mfr));
    } catch (e) {
        return null;
    }
}

async function calculateStochastic(symbol: string, period: number = 14, kPeriod: number = 3, dPeriod: number = 3): Promise<{ k: number; d: number } | null> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (period + kPeriod + dPeriod + 30));

        const historical = await yahooFinance.historical(symbol, {
            period1: startDate, period2: endDate, interval: "1d",
        }) as { high: number; low: number; close: number }[];

        if (!historical || historical.length < period + kPeriod) return null;

        const closes = historical.map(d => d.close);
        const highs = historical.map(d => d.high);
        const lows = historical.map(d => d.low);

        const getK = (idx: number) => {
            // idx is the end index (exclusive in slice logic, but here inclusive for window)
            // We need window [idx - period + 1, idx]
            if (idx < period - 1) return 0;
            const windowCloses = closes.slice(idx - period + 1, idx + 1);
            const windowHighs = highs.slice(idx - period + 1, idx + 1);
            const windowLows = lows.slice(idx - period + 1, idx + 1);

            const currentClose = closes[idx];
            const lowestLow = Math.min(...windowLows);
            const highestHigh = Math.max(...windowHighs);

            if (highestHigh === lowestLow) return 50;
            return ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        };

        // Calculate K line
        const kLine: number[] = [];
        for (let i = 0; i < closes.length; i++) {
            kLine.push(getK(i));
        }

        // Smooth K (Fast %K -> Slow %K)
        const slowK = [];
        for (let i = 0; i < kLine.length; i++) {
            if (i < kPeriod - 1) { slowK.push(kLine[i]); continue; }
            const sum = kLine.slice(i - kPeriod + 1, i + 1).reduce((a, b) => a + b, 0);
            slowK.push(sum / kPeriod);
        }

        // Calculate D (SMA of Slow K)
        const slowD = [];
        for (let i = 0; i < slowK.length; i++) {
            if (i < dPeriod - 1) { slowD.push(slowK[i]); continue; }
            const sum = slowK.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b, 0);
            slowD.push(sum / dPeriod);
        }

        return {
            k: slowK[slowK.length - 1],
            d: slowD[slowD.length - 1]
        };

    } catch (e) {
        return null;
    }
}

async function calculateOBV(symbol: string): Promise<"Up" | "Down" | "Neutral"> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30); // Last 30 days trend

        const historical = await yahooFinance.historical(symbol, {
            period1: startDate, period2: endDate, interval: "1d",
        }) as { close: number; volume: number }[];

        if (!historical || historical.length < 10) return "Neutral";

        let obv = 0;
        const obvLine = [0];

        for (let i = 1; i < historical.length; i++) {
            const change = historical[i].close - historical[i - 1].close;
            if (change > 0) obv += historical[i].volume;
            else if (change < 0) obv -= historical[i].volume;
            obvLine.push(obv);
        }

        // Simple Linear Regression Slope for Trend
        const n = obvLine.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += obvLine[i];
            sumXY += i * obvLine[i];
            sumXX += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        if (slope > 0) return "Up";
        if (slope < 0) return "Down";
        return "Neutral";

    } catch (e) {
        return "Neutral";
    }
}

const YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

// Major ETF Sector Mapping for better concentration analysis
const ETF_SECTOR_MAP: Record<string, string> = {
    // Tech & Growth
    "QQQ": "IT / 기술", "TQQQ": "IT / 기술", "SQQQ": "IT / 기술", "QLD": "IT / 기술",
    "XLK": "IT / 기술", "VGT": "IT / 기술", "TECL": "IT / 기술", "TECS": "IT / 기술",

    // Semiconductor
    "SOXX": "반도체", "SOXL": "반도체", "SOXS": "반도체",
    "SMH": "반도체", "USD": "반도체", "NVDL": "반도체", "NVD": "반도체",

    // Market Indices & Global Equity
    "SPY": "S&P 500", "VOO": "S&P 500", "IVV": "S&P 500", "SPLG": "S&P 500",
    "VTI": "미국 전체 주식", "VEA": "선진국 주식", "VWO": "신흥국 주식",
    "DIA": "산업재", "IWM": "중소형주", "TNA": "중소형주",

    // Dividend & Income
    "SCHD": "고배당", "JEPI": "고배당", "JEPQ": "기술주 배당",
    "VIG": "배당성장", "DGRO": "배당성장", "VNQ": "부동산", "O": "부동산",

    // Bond & Fixed Income
    "TLT": "장기 국채", "TMF": "장기 국채", "TMV": "장기 국채",
    "EDV": "초장기 국채", "LTPZ": "물가연동채",
    "AGG": "종합 채권", "BND": "종합 채권", "SHy": "단기 채권",

    // Crypto
    "BITX": "암호화폐", "BITO": "암호화폐", "IBIT": "암호화폐", "COIN": "암호화폐", "MSTR": "암호화폐",

    // Commodities
    "GLD": "금", "IAU": "금", "SLV": "은", "USO": "원유", "PDBC": "원자재"
};

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

        // 정배열 판단
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

        const rsi14 = await calculateRSI(symbol);
        const { atr, bbUpper, bbLower } = await calculateTechnicalIndicators(symbol);
        const macd = await calculateMACD(symbol);

        // Speculator (Added) - Advanced Technicals
        const mfi = await calculateMFI(symbol);
        const stoch = await calculateStochastic(symbol);
        const obv = await calculateOBV(symbol);

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
            atr14: atr,
            bollingerUpper: bbUpper,
            bollingerLower: bbLower,
            macd,
            moneyFlow: null, // Deprecated field in prompt logic, keeping for type safety if needed or remove

            // Speculator (Added)
            moneyFlowIndex: mfi,
            stochasticK: stoch?.k ?? null,
            stochasticD: stoch?.d ?? null,
            obvTrend: obv
        };

        marketCache.set(cacheKey, data, MarketDataCache.STOCK_TTL);
        return data;
    } catch (error) {
        console.error(`[MarketData] Speculator fetch failed for ${symbol}: `, error);
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
            // 배당 수익률은 summary에서, 섹터/보유종목은 추가 모듈에서
            const summary = await fetchSummary(symbol, ["summaryDetail", "fundProfile", "topHoldings", "defaultKeyStatistics"]);
            const detail = (summary?.summaryDetail || {}) as Record<string, unknown>;
            const stats = (summary?.defaultKeyStatistics || {}) as Record<string, unknown>; // Added for beta
            const fund = (summary?.fundProfile || {}) as { sectorWeightings?: { sector: string; weight: number }[] };
            const holdings = (summary?.topHoldings || {}) as { holdings?: { symbol: string; holdingPercent: number }[] };

            // 상위 3개 섹터 포맷팅
            let topSectors = null;
            if (fund.sectorWeightings && fund.sectorWeightings.length > 0) {
                topSectors = fund.sectorWeightings
                    .sort((a, b) => b.weight - a.weight)
                    .slice(0, 3)
                    .map(s => `${s.sector} (${(s.weight * 100).toFixed(0)}%)`)
                    .join(", ");
            }

            // 상위 3개 종목 포맷팅
            let topHoldings = null;
            if (holdings.holdings && holdings.holdings.length > 0) {
                topHoldings = holdings.holdings
                    .slice(0, 3)
                    .map(h => `${h.symbol} (${(h.holdingPercent * 100).toFixed(0)}%)`)
                    .join(", ");
            }

            etfData.push({
                symbol,
                name: quote.name,
                price: quote.price,
                changePercent: quote.changePercent,
                dividendYield: (detail.yield as number) ?? (detail.dividendYield as number) ?? null,
                expenseRatio,
                topSectors,
                topHoldings,
                // Father (Added)
                beta: (detail.beta as number) ?? (stats.beta as number) ?? null,
                sharpeRatio: (detail.trailingAnnualDividendYield as number) ? ((detail.trailingAnnualDividendYield as number) / 0.15) : null, // Very rough proxy: Yield / Volatility assumption (0.15)
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

function formatChangePercent(n: number | null): string {
    if (n === null || n === undefined) return "N/A";
    return `${n.toFixed(2)}%`;
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

    const insiderText = data.netInsiderBuy
        ? `${formatNum(data.netInsiderBuy)}주 ${data.netInsiderBuy > 0 ? "순매수(긍정)" : "순매도(부정)"}`
        : "N/A";

    return `[📊 가치 투자 분석 데이터 - ${data.quote.name} (${data.quote.symbol})]
    현재가: ${formatNum(data.quote.price)} ${data.quote.currency} (${data.quote.changePercent >= 0 ? "+" : ""}${data.quote.changePercent.toFixed(2)}%)
    PER(현재): ${formatNum(data.per)}배 | PER(예상): ${formatNum(data.forwardPer)}배
    PBR: ${formatNum(data.pbr)}배
    ROE: ${formatPercent(data.roe)}
    EPS: ${formatNum(data.eps)}
    배당 수익률: ${formatPercent(data.dividendYield)}
    부채비율(D/E): ${formatNum(data.debtToEquity)}%
    영업이익률: ${formatPercent(data.operatingMargins)}
    순이익률: ${formatPercent(data.profitMargins)}
    유동비율: ${formatNum(data.currentRatio)}
    장부가치: ${formatNum(data.bookValue)}
    잉여현금흐름: ${formatLargeNum(data.freeCashflow)}
    EV/EBITDA: ${formatNum(data.enterpriseToEbitda)}배
    내부자 거래(순매수): ${insiderText}
    52주 최고: ${formatNum(data.fiftyTwoWeekHigh)} (고점 대비 낙폭: ${dropFromHigh ? dropFromHigh.toFixed(2) + "%" : "N/A"})
    52주 최저: ${formatNum(data.fiftyTwoWeekLow)}
    
    [핵심 지표 (Pro)]
    FCF Yield: ${formatPercent(data.fcfYield)} (국채금리보다 높으면 저평가)
    ROIC(Proxy): ${formatPercent(data.roic)} (높을수록 해자 강력)

    위 데이터를 바탕으로 내재 가치, 안전 마진, 경제적 해자 관점에서 분석해주세요.
    - 고점 대비 낙폭이 크고(-20% 이상) 펀더멘탈(ROE, 이익률)이 견고하다면 "안전마진" 구간일 수 있습니다.
    - FCF Yield가 4~5% 이상이면 매력적인 구간입니다.
    - 내부자 순매수량이 양수라면 경영진의 자신감으로 해석하세요.`;
}

export function heroDataToPrompt(data: HeroData): string {
    const warning = (data.pegRatio === null && data.revenueGrowth === null)
        ? "\n⚠️ [주의] 현재 해당 종목의 상세 재무 데이터(성장률, PEG 등)를 일시적으로 가져올 수 없습니다. 보이는 가격과 추세 중심으로만 조언하세요."
        : "";

    const pegDisplay = data.pegRatio !== null
        ? formatNum(data.pegRatio)
        : "N/A (최근 이익이 적자이거나 변동성이 커서 산출 불가)";

    return `[📊 성장 투자 분석 데이터 - ${data.quote.name} (${data.quote.symbol})]
    현재가: ${formatNum(data.quote.price)} ${data.quote.currency} (${data.quote.changePercent >= 0 ? "+" : ""}${data.quote.changePercent.toFixed(2)}%)
    매출 성장률(YoY): ${formatPercent(data.revenueGrowth)}
    이익 성장률(YoY): ${formatPercent(data.earningsGrowth)}
    분기 이익 성장률: ${formatPercent(data.earningsQuarterlyGrowth)}
    PEG Ratio: ${pegDisplay} (성장주 저평가 기준: 1.0 미만 매우 좋음, 1.5 이하 양호)
    PSR (매출배수): ${formatNum(data.psr)}배
    Forward PER: ${formatNum(data.forwardPer)}배
    매출총이익률: ${formatPercent(data.grossMargins)}
    영업현금흐름: ${formatLargeNum(data.operatingCashflow)}
    총 매출액: ${formatLargeNum(data.totalRevenue)}
    주당 매출: ${formatNum(data.revenuePerShare)}
    애널리스트 목표가: 평균 ${formatNum(data.targetMeanPrice)} (괴리율: ${data.targetMeanPrice ? ((data.targetMeanPrice - data.quote.price) / data.quote.price * 100).toFixed(2) + "%" : "N/A"})
    목표가 최고: ${formatNum(data.targetHighPrice)} | 최저: ${formatNum(data.targetLowPrice)}
    투자의견: ${data.recommendationKey ? data.recommendationKey.toUpperCase().replace("_", " ") : "N/A"}
    공매도 비율: ${formatPercent(data.shortPercentOfFloat)} (20% 이상이면 Short Squeeze 주의)
    공매도 상환 일수: ${formatNum(data.shortRatio)}일
    어닝 서프라이즈(최근): ${formatPercent(data.earningsSurprise)}
    애널리스트 수: ${formatNum(data.numberOfAnalysts)}명${warning}

    위 데이터를 바탕으로 성장 스토리가 건재한지 분석하세요. 
    - PEG Ratio가 핵심입니다. 고성장(20%+)이면서 PEG가 낮다면 강력한 매수 신호일 수 있습니다.
    - PSR이 동종 업계 대비 너무 높지 않은지 체크하세요.
    - 공매도 비율이 높고 상환 일수가 5일 이상이면 숏 스퀴즈 가능성을 강력하게 언급하세요.`;
}

export function architectDataToPrompt(data: ArchitectData): string {
    const lines = data.indicators.map(
        (i) => `${i.name}: ${i.price.toLocaleString()} (${i.changePercent >= 0 ? "+" : ""}${i.changePercent.toFixed(2)}%)`
    );

    const yieldSpreadInfo = data.yieldSpread10Y2Y !== null
        ? `장단기 금리차(10Y-3M Proxy): ${data.yieldSpread10Y2Y.toFixed(2)}%p (${data.yieldSpread10Y2Y < 0 ? "⚠️ 역전됨 (경기침체 경고)" : "정상"})`
        : "장단기 금리차: 데이터 확인 필요";

    // New Architect Indicators Formatting
    const moveInfo = data.moveIndex ? `채권 변동성(MOVE): ${data.moveIndex.toFixed(2)} (채권 시장의 공포지수)` : "MOVE: N/A";
    const xlyXlp = (data.xlyPrice && data.xlpPrice) ? `경기민감(XLY)/필수소비(XLP) 비율: ${(data.xlyPrice / data.xlpPrice).toFixed(2)} (${(data.xlyPrice / data.xlpPrice) > 1.5 ? "경기 확장 기대" : "경기 침체 우려"})` : "XLY/XLP: N/A";
    const sphbSplv = (data.sphbPrice && data.splvPrice) ? `High Beta(SPHB)/Low Vol(SPLV) 비율: ${(data.sphbPrice / data.splvPrice).toFixed(2)} (${(data.sphbPrice / data.splvPrice) > 1 ? "Risk On (공격적)" : "Risk Off (방어적)"})` : "Beta/Vol: N/A";

    return `[📊 거시경제 & 자산 배분 데이터 (Macro & Cycle)]
${lines.join("\n")}
${yieldSpreadInfo}

[심화 주기 판단 (Deep Cycle Analysis)]
${moveInfo}
${xlyXlp}
${sphbSplv}

위 데이터를 바탕으로 현재 시장의 사이클 위치를 판단하세요:
- MOVE 지수가 급등하면 주식 시장 폭락 전조일 수 있습니다.
- XLY/XLP 비율이 하락하면 '방어적 태세'를 권고하세요.
- SPHB/SPLV 비율이 낮다면 시장 참여자들이 겁을 먹고 있다는 뜻입니다.
이 환경에서 포트폴리오 리밸런싱(주식 비중 축소/확대) 방향을 명확히 제시해주세요.`;
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

    // 볼린저 밴드 위치
    let bbStatus = "";
    if (data.bollingerUpper && data.bollingerLower) {
        const price = data.quote.price;
        if (price >= data.bollingerUpper) bbStatus = "🚨 볼린저 밴드 상단 돌파 (과매수/강한 추세)";
        else if (price <= data.bollingerLower) bbStatus = "🟢 볼린저 밴드 하단 터치 (과매도/반등 가능성)";
        else bbStatus = "밴드 내 위치";
    }

    // MACD 해석
    let macdStatus = "N/A";
    if (data.macd) {
        macdStatus = `MACD: ${data.macd.macd.toFixed(2)} | Signal: ${data.macd.signal.toFixed(2)} | Hist: ${data.macd.histogram.toFixed(2)} (${data.macd.trend})`;
    }

    // New Indicators
    const mfiStatus = data.moneyFlowIndex ? `MFI(14): ${data.moneyFlowIndex.toFixed(2)} (${data.moneyFlowIndex > 80 ? "세력 과열(매도)" : data.moneyFlowIndex < 20 ? "세력 침체(매수)" : "중립"})` : "MFI: N/A";
    const stochStatus = (data.stochasticK && data.stochasticD) ? `Stochastic Slow(5,3,3): K ${data.stochasticK.toFixed(2)} / D ${data.stochasticD.toFixed(2)}` : "Stoch: N/A";
    const obvStatus = `OBV Trend: ${data.obvTrend} (주가와 다이버전스 체크)`;

    return `[📊 모멘텀 트레이딩 데이터 - ${data.quote.name} (${data.quote.symbol})]
현재가: ${formatNum(data.quote.price)} ${data.quote.currency} (${data.quote.changePercent >= 0 ? "+" : ""}${data.quote.changePercent.toFixed(2)}%)
이동평균선 정렬: ${data.maAlignment}
50일 이동평균: ${formatNum(data.fiftyDayAverage)} (괴리율: ${formatNum(data.distanceFromMA50)}%)
200일 이동평균: ${formatNum(data.twoHundredDayAverage)}
RSI(14): ${formatNum(data.rsi14)}${rsiInterpretation}
볼린저 밴드: ${data.bollingerUpper ? `상단 ${formatNum(data.bollingerUpper)} | 하단 ${formatNum(data.bollingerLower)}` : "N/A"} (${bbStatus})
MACD(12, 26, 9): ${macdStatus}
변동성(ATR): ${formatNum(data.atr14)}

[고급 수급 지표]
${mfiStatus}
${stochStatus}
${obvStatus}

거래량 비율: ${formatNum(data.volumeRatio)}배 (평소 대비 ${data.volumeRatio && data.volumeRatio > 1 ? "급증 🔥" : "건조"})

위 데이터를 바탕으로 지금이 '진입할 때'인지 '빠져나올 때'인지 날카롭게 판단하세요:
- MFI가 80 이상이면 '스마트 머니'가 빠져나갈 준비를 하는 것입니다.
- 주가는 오르는데 OBV Trend가 Down이면 '개미 꼬시기'일 수 있습니다.
- 스토캐스틱 골든크로스가 발생했는지 체크하세요.`;
}

export function fatherDataToPrompt(data: FatherData): string {
    const marketLines = data.indicators.map(
        (i) => `${i.name}: ${i.price.toLocaleString()} (${i.changePercent >= 0 ? "+" : ""}${i.changePercent.toFixed(2)}%)`
    );

    const etfLines = data.etfData.map((e) => {
        let info = `  - [${e.symbol}] ${e.name}: ${formatNum(e.price)} (${e.changePercent >= 0 ? "+" : ""}${e.changePercent.toFixed(2)}%)`;
        info += ` | 배당률: ${formatPercent(e.dividendYield)} | 보수: ${e.expenseRatio} `;
        if (e.topSectors) info += `\n    └ 섹터: ${e.topSectors} `;
        if (e.topHoldings) info += `\n    └ 종목: ${e.topHoldings} `;
        return info;
    });

    return `[📊 인덱스 & ETF 시장 데이터]
주요 지수:
${marketLines.join("\n")}

주요 ETF 분석:
${etfLines.join("\n")}

위 데이터를 바탕으로 시장 전체의 흐름을 읽고, 장기 적립식 투자의 중요성을 설득하세요.
- 개별 종목 등락에 일희일비하지 말고 "시장 전체를 사는" ETF 전략을 권장하세요.
- 섹터 비중을 언급하며 "기술주가 주도하는 장세입니다" 등의 코멘트를 추가하세요.`;
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

// ─── 차트용 과거 데이터 (30일) 가져오기 ───

export async function fetchPriceHistory(symbol: string): Promise<{ date: string; price: number }[]> {
    const cacheKey = `history: 30d:${symbol} `;
    const cached = marketCache.get<{ date: string; price: number }[]>(cacheKey);
    if (cached) return cached;

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 35); // 넉넉히 35일 전

        const result = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: "1d",
        });

        // 최근 30개만 추출 및 포맷팅 (YYYY-MM-DD)
        const data = result.slice(-30).map(item => ({
            date: item.date.toISOString().split("T")[0],
            price: item.close
        }));

        marketCache.set(cacheKey, data, MarketDataCache.STOCK_TTL);
        return data;
    } catch (e) {
        console.warn(`Failed to fetch history for ${symbol}`, e);
        return [];
    }
}

// [Deleted legacy fetchCommonMarketData]

// ─── 페르소나별 시장 해석 렌즈 ───

function getPersonaMarketLens(personaId: string): string {
    const commonInstruction = `
🚨[답변 태도: 명확하되 안전하게]
    - "확인해보세요" 같은 회피형 답변 금지.대신 "데이터상 ~한 구간으로 판단됩니다"라고 명확히 의견을 내세요.
- 단, "무조건 사세요/파세요" 같은 명령조는 금지. "매력적인 진입 시점입니다", "리스크 관리가 필요합니다" 처럼 전문적인 뉘앙스로 말하세요.
- 모든 판단의 근거는 반드시 위 데이터에서 찾아서 인용하세요.`;

    switch (personaId) {
        case "sage":
            return `
${commonInstruction}
🔍[현인의 판단 기준]
    - "지금 사야 하나요?" → 고점 대비 낙폭과 밸류에이션(PER / PBR)을 근거로 가치 평가를 내리세요.
- 데이터가 싸다면 "안전마진이 확보된 매력적인 구간"이라고 분명히 말하세요.
- 단정 짓지 말고 "확률적으로 잃지 않을 가능성이 높은 자리"라는 점을 강조하세요.`;

        case "hero":
            return `
${commonInstruction}
🔍[영웅의 판단 기준]
    - "지금 사야 하나요?" → 단순히 싸다고 권하지 말고, "상승 추세"와 "성장 스토리"가 살아있는지 판단하세요.
- 신고가 근처라면 "추세 추종 전략이 유효한 구간"이라고, 꺾였으면 "모멘텀 둔화로 인한 관망 필요"라고 진단하세요.
- "상승 여력이 충분해 보입니다" 또는 "성장성 대비 과열권입니다"라고 의견을 제시하세요.`;

        case "architect":
            return `
${commonInstruction}
🔍[원칙가의 판단 기준]
    - "지금 사야 하나요?" → 종목 자체보다 "포트폴리오 내 역할"을 기준으로 답변하세요.
- "현재 시장 상황에서는 주식 비중을 줄이고 안전자산을 늘리는 리밸런싱이 유리합니다" 처럼 구체적인 배분 전략을 제시하세요.
- 경기 사이클 신호(금리차 등)를 근거로 "방어적 태세" 또는 "적극적 투자"를 권고하세요.`;

        case "speculator":
            return `
${commonInstruction}
🔍[투기꾼의 판단 기준]
    - "지금 사야 하나요?" → 철저히 가격과 거래량, 추세(이평선)로만 판단하세요.
- 50일선 위 + 상승 추세라면 "매수 우위 구간(Buy Zone)"이라고, 역배열이면 "진입 금지(No Action)"라고 명명하세요.
- RSI 과열 시 "단기적 조정 가능성이 높으니 차익 실현을 고려하세요"라고 날카롭게 조언하세요.`;

        case "father":
            return `
${commonInstruction}
🔍[아버지의 판단 기준]
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

    // 카테고리별 정렬 & 추가
    const indexSymbols = ["^GSPC", "^IXIC", "^DJI", "^RUT", "^SOX"];
    const sectorSymbols = ["XLK", "XLE", "XLF"]; // 기술, 에너지, 금융 (시장 주도 섹터 파악)
    const rateSymbols = ["^TNX", "^TYX", "^IRX"];
    const commoditySymbols = ["DX-Y.NYB", "GC=F", "HG=F", "CL=F", "BTC-USD"]; // 구리(HG=F) 추가

    const formatLine = (i: MarketIndicator) => {
        let details = "";

        // 고점 대비 낙폭 (장기 관점)
        if (i.high52) {
            const drop = ((i.price - i.high52) / i.high52) * 100;
            if (drop < -10) details += ` | 고점대비 ${drop.toFixed(1)}% `;
        }

        // 이평선 괴리 (추세 관점)
        if (i.ma200) {
            const trend = i.price > i.ma200 ? "상승추세" : "하락추세";
            if (Math.abs((i.price - i.ma200) / i.ma200) > 0.05) {
                details += ` | ${trend} `;
            }
        }

        // VIX 특수 처리
        if (i.symbol === "^VIX") {
            return `  🚨 ${i.name}: ${i.price.toLocaleString()} (${i.price >= 20 ? "불안" : "안정"})`;
        }

        return `  ${i.name}: ${i.price.toLocaleString()} (${i.changePercent >= 0 ? "+" : ""}${i.changePercent.toFixed(2)}%)${details} `;
    };

    const indexLines = indicators.filter((i) => indexSymbols.includes(i.symbol)).map(formatLine);
    const sectorLines = indicators.filter((i) => sectorSymbols.includes(i.symbol)).map(formatLine);
    const rateLines = indicators.filter((i) => rateSymbols.includes(i.symbol)).map(formatLine);
    const commodityLines = indicators.filter((i) => commoditySymbols.includes(i.symbol)).map(formatLine);

    // 해석 코멘트 생성
    const comments: string[] = [];

    // VIX 해석
    const vix = indicators.find((i) => i.symbol === "^VIX");
    if (vix) {
        if (vix.price >= 30) comments.push("🔴 VIX 30+: 시장 극단적 공포");
        else if (vix.price >= 20) comments.push("🟠 VIX 20+: 시장 불안 심리 감지");
        else if (vix.price <= 12) comments.push("🟢 VIX 12 이하: 시장 안정/낙관");
    }

    // Put/Call Ratio (VIX로 간접 유추 또는 추후 추가)

    // 장단기 금리차 해석
    if (yieldCurveSpread !== null) {
        if (yieldCurveSpread < 0) comments.push(`🔴 장단기 금리 역전(${yieldCurveSpread} % p): 경기침체 경고 신호`);
        else if (yieldCurveSpread < 0.5) comments.push(`🟡 장단기 금리차 협소(${yieldCurveSpread} % p): 경기 둔화 우려`);
        else comments.push(`🟢 장단기 금리차 정상(${yieldCurveSpread} % p): 경기 확장 구간`);
    }

    // 달러 해석
    const dxy = indicators.find((i) => i.symbol === "DX-Y.NYB");
    if (dxy) {
        if (dxy.price >= 105) comments.push("💪 달러 강세 (DXY 105+): 위험자산 부담");
        else if (dxy.price <= 95) comments.push("📉 달러 약세 (DXY 95-): 유동성 호재");
    }

    // 원유 해석
    const oil = indicators.find((i) => i.symbol === "CL=F");
    if (oil) {
        if (oil.price >= 90) comments.push("🔥 유가 급등 ($90+): 인플레 재점화 우려");
    }

    // 비트코인 해석 (유동성 지표)
    const btc = indicators.find((i) => i.symbol === "BTC-USD");
    if (btc && btc.changePercent > 5) comments.push("🚀 비트코인 급등: 위험자산 선호 심리 회복 중");

    const commentSection = comments.length > 0 ? `\n\n📌 팩트 기반 시장 요약: \n${comments.join("\n")} ` : "";

    // 페르소나별 해석 렌즈
    const personaLens = getPersonaMarketLens(personaId);

    return `[📡 실시간 시장 현황]

주요 지수:
${indexLines.join("\n")}

섹터 동향:
${sectorLines.join("\n")}

금리:
${rateLines.join("\n")}
  장단기 금리차(10Y - 3M): ${yieldCurveSpread !== null ? `${yieldCurveSpread}%p` : "N/A"}

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
    const p = (n: number | null) => n !== null ? `${(n * 100).toFixed(2)}% ` : "N/A";

    switch (personaId) {
        case "speculator": // 단기 추세
            return `📊 S & P 500 단기 추세: 1주(${p(history.change1W)}) | 1개월(${p(history.change1M)})`;
        case "hero": // 중기 모멘텀
            return `📊 S & P 500 성장 모멘텀: 3개월(${p(history.change3M)}) | 6개월(${p(history.change6M)}) | YTD(${p(history.changeYTD)})`;
        case "architect": // 사이클
            return `📊 시장 사이클 지표(S & P 500): 1개월(${p(history.change1M)}) | 3개월(${p(history.change3M)}) | 1년(${p(history.change1Y)})`;
        case "sage": // 장기 가치 & 낙폭
            return `📊 S & P 500 장기 성과: YTD(${p(history.changeYTD)}) | 1년(${p(history.change1Y)}) | 고점대비 낙폭(${p(history.dropFromHigh)})`;
        case "father": // 장기 투자
            return `📊 시장 성과(S & P 500): 올해 수익률 ${p(history.changeYTD)} (역사적 연평균 약 10 % 내외)`;
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
        // New common data formatter
        const commonPrompt = commonData ? commonDataToPrompt(commonData) : "";

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

        // Step 3: 차트 생성을 위한 과거 데이터 주입 (모든 페르소나 공통, 요청된 티커 대상)
        let chartContext = "";
        if (userTickers.length > 0) {
            const uniqueTickers = Array.from(new Set(userTickers.map(t => resolveKoreanTicker(t)))).slice(0, 3); // 최대 3개
            const historyData = await Promise.all(
                uniqueTickers.map(async (symbol) => {
                    const history = await fetchPriceHistory(symbol);
                    if (history.length === 0) return null;
                    // 토큰 절약을 위해 데이터 압축 (날짜는 생략하고 값만 나열하거나, 간략화)
                    // 여기서는 JSON 문자열로 제공하여 AI가 바로 파싱해서 차트를 그리게 유도
                    return `"${symbol}": ${JSON.stringify(history)} `;
                })
            );

            const validHistory = historyData.filter(Boolean);
            if (validHistory.length > 0) {
                chartContext = `
[📈 차트 생성용 과거 데이터(30일)]
AI는 아래 데이터를 사용하여 선 그래프(Line Chart)를 그려야 합니다.
{
  ${validHistory.join(",\n  ")}
}
`;
            }
        }

        // Step 4: 공통 + 전문 + 차트데이터 합치기
        const parts = [commonPrompt, specializedPrompt, chartContext].filter(Boolean);
        return parts.join("\n\n");
    } catch (error) {
        console.error(`[MarketData] Failed to get context for ${personaId}: `, error);
        return "";
    }
}

// ═══════════════════════════════════════════════════════
// 포트폴리오 대시보드용 데이터 (Sparklines, Sector, Dividend)
// ═══════════════════════════════════════════════════════

export async function fetchEnrichedPortfolio(tickers: string[]): Promise<Record<string, EnrichedPortfolioItem>> {
    const results: Record<string, EnrichedPortfolioItem> = {};
    const uniqueTickers = Array.from(new Set(tickers)).filter(t => t);

    await Promise.all(
        uniqueTickers.map(async (ticker) => {
            try {
                const queryTicker = resolveKoreanTicker(ticker);
                const quote = await fetchQuote(queryTicker);
                if (!quote) return;

                let sector = undefined;
                let dividendYield = undefined;
                let beta = undefined;

                try {
                    const summary = await fetchSummary(queryTicker, ["summaryProfile", "summaryDetail", "defaultKeyStatistics", "fundProfile"]);
                    if (summary) {
                        const profile = summary.summaryProfile as any;
                        const detail = summary.summaryDetail as any;
                        const stats = summary.defaultKeyStatistics as any;
                        const fund = summary.fundProfile as any;


                        // Priority: Manual Map -> Profile Sector -> Fund Category -> Unknown
                        const etfSector = ETF_SECTOR_MAP[ticker.toUpperCase()] || ETF_SECTOR_MAP[queryTicker.toUpperCase().replace(".KS", "")];
                        sector = etfSector ?? profile?.sector ?? fund?.categoryName ?? "Unknown";

                        // Priority: dividendYield (Stock) -> yield (Bond/ETF) -> trailingAnnualDividendYield -> fundProfile.yield
                        dividendYield = detail?.dividendYield
                            ?? detail?.yield
                            ?? detail?.trailingAnnualDividendYield
                            ?? fund?.yield
                            ?? stats?.yield;

                        beta = stats?.beta ?? detail?.beta ?? fund?.beta3Year; // ETF beta fallback
                        console.log(`[MarketData Debug] ${ticker}: Sector=${sector}, DividendYield=${dividendYield}, Beta=${beta}`);
                    }
                } catch (e) {
                    console.warn(`Failed to fetch summary for ${ticker}`, e);
                }

                // Sparkline history (30 days) - Optional, can be removed if not used
                const sparkline: { date: string; price: number }[] = [];
                // Removed sparkline fetch to save bandwidth as per previous request to remove sparklines from UI

                results[ticker] = {
                    ...quote,
                    sector,
                    dividendYield,
                    beta,
                    sparkline,
                };
            } catch (e) {
                console.error(`Failed to enrich data for ${ticker}`, e);
            }
        })
    );

    return results;
}

// ═══════════════════════════════════════════════════════
// 배당 캘린더 데이터 (Dividend Calendar)
// ═══════════════════════════════════════════════════════

export async function fetchDividendCalendar(tickers: string[]): Promise<DividendCalendarData> {
    const events: DividendCalendarData = [];
    const uniqueTickers = Array.from(new Set(tickers)).filter(t => t);

    // Get dates for range - Extend to 2 years to catch seasonality for YoY projection
    const now = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(now.getFullYear() - 2);

    // Cache key
    const cacheKey = `dividends:${uniqueTickers.sort().join(",")}`;
    const cached = marketCache.get<DividendCalendarData>(cacheKey);
    if (cached) return cached;

    // Helper to format date
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    await Promise.all(
        uniqueTickers.map(async (ticker) => {
            try {
                const queryTicker = resolveKoreanTicker(ticker);

                // Fetch quote to get currency
                const quote = await fetchQuote(queryTicker);
                const currency = quote?.currency || "USD";

                // 1. Past Dividends (Historical) - Fetch last 2 years
                try {
                    const history = await yahooFinance.historical(queryTicker, {
                        period1: twoYearsAgo,
                        period2: new Date(),
                        interval: "1d",
                        events: 'dividends'
                    });

                    history.forEach((e: any) => {
                        if (e.dividends) {
                            events.push({
                                ticker: ticker,
                                date: formatDate(new Date(e.date)),
                                amount: e.dividends,
                                currency: currency, // Add currency
                                exDate: formatDate(new Date(e.date))
                            });
                        }
                    });
                } catch (e) {
                    // Historical fetch might fail for some
                }

                // 2. Future/Next Dividend (Calendar Events)
                try {
                    const summary = await fetchSummary(queryTicker, ["calendarEvents", "summaryDetail"]);
                    if (summary && summary.calendarEvents) {
                        const cal = summary.calendarEvents as any;
                        if (cal.exDividendDate) {
                            const exDate = new Date(cal.exDividendDate);
                            const dateStr = formatDate(exDate);
                            const payDate = cal.dividendDate ? new Date(cal.dividendDate) : undefined;
                            const payDateStr = payDate ? formatDate(payDate) : undefined;

                            // Check duplicate by date
                            const exists = events.some(e => e.ticker === ticker && e.date === dateStr);

                            if (!exists && exDate > new Date()) {
                                let amount = 0;
                                // Estimate amount from last known dividend with Seasonality check
                                // Try to find dividend from 1 year ago (+/- 45 days)
                                const oneYearPrior = new Date(exDate);
                                oneYearPrior.setFullYear(oneYearPrior.getFullYear() - 1);

                                const comparableEvent = events.find(e => {
                                    if (e.ticker !== ticker) return false;
                                    const d = new Date(e.date);
                                    const diffTime = Math.abs(d.getTime() - oneYearPrior.getTime());
                                    const diffDays = diffTime / (1000 * 60 * 60 * 24);
                                    return diffDays < 45;
                                });

                                if (comparableEvent) {
                                    amount = comparableEvent.amount;
                                } else {
                                    // Fallback to most recent
                                    const lastDiv = events.filter(e => e.ticker === ticker).sort((a, b) => b.date.localeCompare(a.date))[0];
                                    if (lastDiv) amount = lastDiv.amount;
                                }

                                if (amount > 0) {
                                    events.push({
                                        ticker: ticker,
                                        date: dateStr,
                                        amount: amount,
                                        currency: currency, // Add currency
                                        exDate: dateStr,
                                        paymentDate: payDateStr,
                                        isEstimated: true // Calendar event is still technically an estimate until confirmed declared? No, usually confirmed. But let's keep consistency.
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {
                    // Calendar fetch fail
                }

                // 3. Project Future Dividends (Estimate based on history)
                try {
                    const tickerEvents = events.filter(e => e.ticker === ticker);
                    // Use a simple string comparison for date check
                    const todayStr = new Date().toISOString().split('T')[0];
                    const hasFuture = tickerEvents.some(e => e.date > todayStr);

                    if (!hasFuture && tickerEvents.length >= 2) {
                        // Sort descending by date
                        const sorted = [...tickerEvents].sort((a, b) => b.date.localeCompare(a.date));
                        const lastEvent = sorted[0];
                        const prevEvent = sorted[1];

                        const lastDate = new Date(lastEvent.date);
                        const prevDate = new Date(prevEvent.date);
                        const diffTime = Math.abs(lastDate.getTime() - prevDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        // Detect Frequency with tolerance
                        let freqDays = 0;
                        if (diffDays >= 25 && diffDays <= 35) freqDays = 30; // Monthly
                        else if (diffDays >= 85 && diffDays <= 95) freqDays = 90; // Quarterly
                        else if (diffDays >= 175 && diffDays <= 185) freqDays = 180; // Semi-Annual
                        else if (diffDays >= 350 && diffDays <= 370) freqDays = 365; // Annual

                        if (freqDays > 0) {
                            let nextDate = new Date(lastDate);
                            // Project forward for 12 months
                            for (let i = 0; i < 12; i++) {
                                nextDate.setDate(nextDate.getDate() + freqDays);
                                const nextDateStr = nextDate.toISOString().split('T')[0];

                                // Only add if it's in the future and doesn't exist
                                if (nextDateStr > todayStr) {
                                    const exists = events.some(e => e.ticker === ticker && e.date === nextDateStr);
                                    if (!exists) {
                                        // YoY Seasonality Logic
                                        let projectedAmount = lastEvent.amount; // Default

                                        const oneYearPrior = new Date(nextDate);
                                        oneYearPrior.setFullYear(oneYearPrior.getFullYear() - 1);

                                        const comparableEvent = events.find(e => {
                                            if (e.ticker !== ticker) return false;
                                            const d = new Date(e.date);
                                            const diffTime = Math.abs(d.getTime() - oneYearPrior.getTime());
                                            const diffDays = diffTime / (1000 * 60 * 60 * 24);
                                            return diffDays < 45; // Broad window to catch the quarter/month
                                        });

                                        if (comparableEvent) {
                                            projectedAmount = comparableEvent.amount;
                                        }

                                        events.push({
                                            ticker: ticker,
                                            date: nextDateStr,
                                            amount: projectedAmount,
                                            currency: lastEvent.currency || currency,
                                            exDate: nextDateStr, // Use same date for exDate estimation
                                            isEstimated: true
                                        });
                                    }
                                }
                                // Stop if projected too far (e.g. > 1 year from now)
                                const oneYearFromNow = new Date();
                                oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                                if (nextDate > oneYearFromNow) break;
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to project dividends for ${ticker}`, e);
                }

            } catch (error) {
                console.warn(`Failed dividend fetch for ${ticker}`, error);
            }
        })
    );

    events.sort((a, b) => b.date.localeCompare(a.date));
    marketCache.set(cacheKey, events, 24 * 60 * 60);
    return events;
}

// ─── 유저 벤치마크 히스토리 (백테스팅) ───

export async function fetchBenchmarkHistory(
    holdings: { ticker: string; quantity: number }[],
    range: "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD"
): Promise<BenchmarkHistoryData | any[]> {
    const endDate = new Date();
    const startDate = new Date();
    switch (range) {
        case "1W": startDate.setDate(endDate.getDate() - 7); break;
        case "1M": startDate.setMonth(endDate.getMonth() - 1); break;
        case "3M": startDate.setMonth(endDate.getMonth() - 3); break;
        case "6M": startDate.setMonth(endDate.getMonth() - 6); break;
        case "1Y": startDate.setFullYear(endDate.getFullYear() - 1); break;
        // YTD starts from previous year end. Fetch from Dec 1 to be absolutely safe against timezone/holiday gaps.
        case "YTD":
            startDate.setFullYear(endDate.getFullYear() - 1);
            startDate.setMonth(11, 1);
            break;
    }

    // Exclude Exchange Rate volatility (Use Fixed Rate for pure price return)
    const tickers = [...holdings.map(h => h.ticker), "SPY"];
    const uniqueTickers = Array.from(new Set(tickers));

    const historyPromises = uniqueTickers.map(async (t) => {
        const symbol = resolveKoreanTicker(t);
        try {
            const result = await yahooFinance.historical(symbol, {
                period1: startDate,
                period2: endDate,
                interval: "1d"
            });
            return { symbol: t, data: result as { date: Date; close: number }[] };
        } catch (e) {
            console.error(`Failed to fetch history for ${t}`, e);
            return { symbol: t, data: [] };
        }
    });

    const histories = await Promise.all(historyPromises);
    const historyMap = new Map<string, Map<string, number>>();

    histories.forEach(({ symbol, data }) => {
        const dateMap = new Map<string, number>();
        data.forEach((row: any) => {
            const dateStr = row.date.toISOString().split('T')[0];
            // Use standard 'close' to match Google Finance price return
            dateMap.set(dateStr, row.close);
        });
        historyMap.set(symbol, dateMap);
    });

    const spyData = histories.find(h => h.symbol === "SPY")?.data || [];
    const validDates = spyData.map((d) => d.date.toISOString().split('T')[0]).sort();

    const result: { date: string; portfolio: number; benchmark: number }[] = [];
    let basePortfolioValue = 0;
    let baseBenchmarkValue = 0;

    // Use Fixed Exchange Rate to remove FX volatility 
    const FIXED_KRW_RATE = 1400;
    const lastPrices = new Map<string, number>();

    // Determine Chart Range & Base Date
    let chartDates = validDates;
    let baseDate: string | null = null;

    if (range === "YTD") {
        const currentYearStr = new Date().getFullYear().toString();
        // String comparison is safer than Date object for Year filtering to avoid Timezone issues
        const lastYearDates = validDates.filter(d => !d.startsWith(currentYearStr));

        // Base is last trading day of previous year
        if (lastYearDates.length > 0) {
            baseDate = lastYearDates[lastYearDates.length - 1];
            // Chart shows only this year
            chartDates = validDates.filter(d => d.startsWith(currentYearStr));
        }
    }

    // Set to track which tickers have valid base data
    const validTickersForBase = new Set<string>();

    // Pre-calculate Base Values
    if (baseDate || chartDates.length > 0) {
        const targetBaseDate = baseDate || chartDates[0];

        const spyBase = historyMap.get("SPY")?.get(targetBaseDate);
        if (spyBase) {
            baseBenchmarkValue = spyBase * FIXED_KRW_RATE;

            // Calculate Portfolio Base Value
            basePortfolioValue = 0;
            for (const h of holdings) {
                const price = historyMap.get(h.ticker)?.get(targetBaseDate);
                if (price) {
                    const symbol = resolveKoreanTicker(h.ticker);
                    const isKrwAsset = symbol.endsWith(".KS");
                    const p = isKrwAsset ? price : (price * FIXED_KRW_RATE);
                    basePortfolioValue += p * h.quantity;
                    validTickersForBase.add(h.ticker);
                }
            }
        }
    }

    if (basePortfolioValue === 0 || baseBenchmarkValue === 0) return []; // Fail safe

    const chartData: { date: string; portfolio: number; benchmark: number }[] = [];
    const lastPricesForHoldings = new Map<string, number>();

    for (const date of chartDates) {
        // SPY (Apply fixed rate)
        const spyPriceUsd = historyMap.get("SPY")?.get(date);
        if (!spyPriceUsd) continue;
        const spyPriceKrw = spyPriceUsd * FIXED_KRW_RATE;

        let currentPortfolioValue = 0;
        let isPortfolioValid = true;

        for (const h of holdings) {
            // Only include tickers that were present in the base calculation (Apple-to-Apple comparison)
            if (!validTickersForBase.has(h.ticker)) continue;

            let price = historyMap.get(h.ticker)?.get(date);

            // Fill Forward
            if (price) {
                lastPricesForHoldings.set(h.ticker, price);
            } else {
                price = lastPricesForHoldings.get(h.ticker);
            }

            if (!price) {
                // If a base ticker is missing current price even after fill-forward, invalidate this date
                isPortfolioValid = false;
                break;
            }

            // Currency Check
            const symbol = resolveKoreanTicker(h.ticker);
            const isKrwAsset = symbol.endsWith(".KS");

            // Apply Fixed Rate only to USD assets
            const priceInKrw = isKrwAsset ? price : (price * FIXED_KRW_RATE);
            currentPortfolioValue += priceInKrw * h.quantity;
        }

        if (!isPortfolioValid) continue;

        const portfolioReturn = ((currentPortfolioValue - basePortfolioValue) / basePortfolioValue) * 100;
        const benchmarkReturn = ((spyPriceKrw - baseBenchmarkValue) / baseBenchmarkValue) * 100;

        chartData.push({
            date,
            portfolio: portfolioReturn,
            benchmark: benchmarkReturn
        });
    }

    // New: Calculate individual performance for the period
    const holdingsPerformance = holdings
        .filter(h => validTickersForBase.has(h.ticker))
        .map(h => {
            const firstPrice = historyMap.get(h.ticker)?.get(baseDate || chartDates[0]) || 0;
            const lastPrice = lastPricesForHoldings.get(h.ticker) || 0;
            const tickerReturn = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
            return {
                ticker: h.ticker,
                firstPrice,
                lastPrice,
                return: tickerReturn
            };
        })
        .sort((a, b) => b.return - a.return); // Sort by return desc

    return {
        chartData,
        holdingsPerformance
    };
}

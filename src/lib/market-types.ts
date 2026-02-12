
export interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    name: string;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    fiftyDayAverage?: number;
    twoHundredDayAverage?: number;
}

export interface EnrichedPortfolioItem extends StockQuote {
    sector?: string;
    dividendYield?: number;
    sparkline: { date: string; price: number }[];
}

export interface MarketIndicator {
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

// 공통 시장 데이터 (모든 페르소나 공유)
export interface CommonMarketData {
    indices: {
        snp500: MarketIndicator;
        nasdaq: MarketIndicator;
        dow: MarketIndicator;
    };
    macro: {
        vix: number; // 공포 지수
        tenYearBondYield: number; // 10년물 국채 금리
        dollarIndex: number; // 달러 인덱스
        gold: number; // 금 가격
        wti: number; // 원유 가격
    };
    sectorRotation: {
        leaders: string[]; // 오늘 강세 섹터
        laggards: string[]; // 오늘 약세 섹터
    };
    fearAndGreedIndex: {
        score: number; // 0~100 (Proxy based on VIX & Momentum)
        status: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
    };
}

// ─── 페르소나별 데이터 인터페이스 ───

export interface SageData {
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
    // New Indicators
    enterpriseToEbitda: number | null;
    netSharePurchaseActivity: number | null; // 내부자 거래 (순매수)
    netInsiderBuy: number | null; // 내부자 순매수 (주식수) - Alias
}

export interface HeroData {
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
    // New Indicators
    shortPercentOfFloat: number | null; // 공매도 비율
    shortRatio: number | null; // 공매도 상환 일수 (Days to Cover)
    recommendationKey: string | null; // 매수 의견 (strong_buy, buy, hold, etc.)
    earningsSurprise: number | null; // 어닝 서프라이즈 (%)
}

export interface ArchitectData {
    indicators: MarketIndicator[];
    yieldSpread10Y2Y: number | null; // 장단기 금리차 (10Y - 2Y)
}

export interface SpeculatorData {
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
    atr14: number | null; // ATR(14) 변동성
    bollingerUpper: number | null; // 볼린저 밴드 상단
    bollingerLower: number | null; // 볼린저 밴드 하단
    macd: {
        macd: number;
        signal: number;
        histogram: number;
        trend: "Bullish" | "Bearish" | "Neutral";
    } | null;
    moneyFlow: number | null; // MFI (Money Flow Index) - Optional
}

export interface FatherData {
    indicators: MarketIndicator[];
    etfData: {
        symbol: string;
        name: string;
        price: number;
        changePercent: number;
        dividendYield: number | null;
        expenseRatio: string; // 사전 정의값
        topSectors: string | null; // 상위 섹터 (Top 3)
        topHoldings: string | null; // 상위 종목 (Top 3)
    }[];
}

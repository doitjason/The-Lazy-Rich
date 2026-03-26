
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
    beta?: number;
    sparkline: { date: string; price: number }[];
    // New Fundamental Fields
    per?: number | null;
    forwardPer?: number | null;
    roe?: number | null;
    pbr?: number | null;
    operatingMargins?: number | null;
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
        russell2000: MarketIndicator; // 러셀 2000 (중소형주)
    };
    m7: {
        aapl: MarketIndicator;
        msft: MarketIndicator;
        googl: MarketIndicator;
        amzn: MarketIndicator;
        tsla: MarketIndicator;
        meta: MarketIndicator;
        nvda: MarketIndicator;
    };
    macro: {
        vix: number; // 공포 지수
        vixChangePercent: number; // 전일 대비 변동률
        vixDistanceMA50: number | null; // 50일선 대비 이격도 (%)
        vixDistanceMA200: number | null; // 200일선 대비 이격도 (%)
        vixHigh52: number | null; // 52주 최고점
        tenYearBondYield: number; // 10년물 국채 금리
        tnxDistanceMA50: number | null; // 50일선 대비 이격도 (%)
        tnxDistanceMA200: number | null; // 200일선 대비 이격도 (%)
        tnxHigh52: number | null; // 52주 최고점
        realRate: number; // 실질 금리 (10Y - Inflation)
        expectedInflation: number; // 기대 인플레이션 (Proxy or Breakeven)
        threeMonthBondYield: number; // 3개월물 국채 금리
        dollarIndex: number; // 달러 인덱스
        gold: number; // 금 가격
        wti: number; // 원유 가격
        // New Indicators
        rspChangePercent: number | null; // S&P 500 Equal Weight (시장 건전성)
        hygPrice: number | null; // High Yield Corporate Bond (신용 위험)
        jpyRate: number | null; // JPY/USD Exchange Rate (글로벌 유동성)
        // New Indicators (Growth vs Value & Semi)
        ivwChangePercent: number | null; // S&P 500 Growth
        iveChangePercent: number | null; // S&P 500 Value
        soxxChangePercent: number | null; // PHLX Semiconductor
        // Final Indicators (Risk & Real Economy)
        btcPrice: number | null; // Bitcoin (위험자산 심리)
        btcChangePercent: number | null;
        copperPrice: number | null; // Copper (실물 경기)
        yieldSpread10Y3M: number | null; // 장단기 금리차 (10Y-3M)
        snp500DistanceMA200: number | null; // S&P 500 200일선 이격도 (%)
        hygDistanceMA200: number | null; // HYG 200일선 이격도 (%)
        tipPrice: number | null; // TIPS (실질 금리/인플레 방어)
        embPrice: number | null; // Emerging Market Bond (신흥국/글로벌 리스크)
        // Volume Data
        snp500Volume: number;
        snp500AvgVolume: number;
    };
    sectorRotation: {
        leaders: string[]; // 오늘 강세 섹터
        laggards: string[]; // 오늘 약세 섹터
    };
    marketCondition: { // New Field for Dashboard
        snp500Trend: "Bull" | "Bear" | "Neutral"; // Price vs 200MA
        yieldSpreadStatus: "Normal" | "Inverted" | "Flat"; // 10Y - 3M
        realRateStatus: "Positive" | "Negative" | "Neutral"; // 10Y - Inflation(2.5% fixed)
        vixStatus: "Stable" | "Volatile" | "Panic"; // VIX level
        creditSpreadStatus: "Stable" | "Warning" | "Stress"; // High Yield Spread status
        volumeTrend: "Accumulation" | "Distribution" | "Neutral"; // Volume trend
        kostolanyPhase: "A1" | "A2" | "A3" | "B1" | "B2" | "B3" | "Neutral"; // Kostolany's Egg phase
        interestRateTrend: "Rising" | "Falling" | "Flat"; // Interest Rate Trend (vs 50MA)
        summary: string; // AI Generated Advice
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
    // Sage (Added)
    fcfYield: number | null; // Free Cash Flow Yield
    roic: number | null; // Return on Invested Capital (Proxy: ROE + DEbt adjustment or just ROE/ROA focus)
    // Removed institutionalOwnership due to unavailability
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
    shortPercentOfFloat: number | null;
    shortRatio: number | null; // Days to Cover
    recommendationKey: string | null;
    earningsSurprise: number | null;

    // Hero (Added)
    psr: number | null; // Price to Sales Ratio
}

export interface ArchitectData {
    indicators: MarketIndicator[];
    yieldSpread10Y3M: number | null;

    // Architect (Added)
    moveIndex: number | null; // Bond Volatility
    xlyPrice: number | null; // Discretionary
    xlpPrice: number | null; // Staples
    sphbPrice: number | null; // High Beta
    splvPrice: number | null; // Low Volatility
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
    maAlignment: string; // 정배열, 역배열 등
    volumeRatio: number | null; // 10일 평균 대비 현재 거래량 비율
    distanceFrom52WeekHigh: number | null; // %
    distanceFromMA50: number | null; // %

    // Technical Indicators
    rsi14: number | null;
    atr14: number | null;
    bollingerUpper: number | null;
    bollingerLower: number | null;
    macd: {
        macd: number;
        signal: number;
        histogram: number;
        trend: "Bullish" | "Bearish" | "Neutral";
    } | null;

    // Speculator (Added)
    moneyFlowIndex: number | null; // MFI (Volume-weighted RSI)
    stochasticK: number | null; // Slow Stochastic %K
    stochasticD: number | null; // Slow Stochastic %D
    obvTrend: "Up" | "Down" | "Neutral"; // On Balance Volume Trend
    moneyFlow: number | null; // Deprecated but used in literal
}

export interface FatherData {
    indicators: MarketIndicator[];
    etfData: {
        symbol: string;
        name: string;
        price: number;
        changePercent: number;
        dividendYield: number | null;
        expenseRatio: string;
        topSectors: string | null;
        topHoldings: string | null;

        // Father (Added)
        beta: number | null;
        sharpeRatio: number | null; // (Return - RiskFree) / StdDev (Approx)
        ytdReturn: number | null;
    }[];
}


export interface DividendEvent {
    ticker: string;
    date: string; // ISO Date String (YYYY-MM-DD) - Payment Date or Ex-Date
    amount: number;
    currency?: string;
    exDate?: string;
    paymentDate?: string;
    isEstimated?: boolean;
}

export type DividendCalendarData = DividendEvent[];

export interface BenchmarkHistoryData {
    chartData: { date: string; portfolio: number; benchmark: number }[];
    holdingsPerformance: {
        ticker: string;
        firstPrice: number;
        lastPrice: number;
        return: number;
    }[];
}

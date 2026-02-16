const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function checkMarketIndicators() {
    console.log("🔍 Checking Market Indicators with Real-time Data...\n");

    const symbols = [
        "^GSPC", // S&P 500
        "^TNX",  // 10Y Yield
        "^IRX",  // 3M Yield
        "^VIX",  // Volatility
        "HYG"    // High Yield Bond
    ];

    try {
        const quotes = await Promise.all(symbols.map(s => yahooFinance.quote(s)));
        const getQuote = (sym) => quotes.find(q => q.symbol === sym);

        const snp500 = getQuote("^GSPC");
        const tnx = getQuote("^TNX");
        const irx = getQuote("^IRX");
        const vix = getQuote("^VIX");
        const hyg = getQuote("HYG");

        if (!snp500 || !tnx || !irx || !vix || !hyg) {
            console.error("❌ Failed to fetch some critical symbols.");
            console.log("Fetched:", quotes.map(q => q ? q.symbol : "null").join(", "));
            return;
        }

        console.log("📊 Raw Data:");
        console.log(`- S&P 500 Price: ${snp500.regularMarketPrice}`);
        console.log(`- S&P 500 200MA: ${snp500.twoHundredDayAverage || "N/A"}`);
        console.log(`- S&P 500 Volume: ${snp500.regularMarketVolume}`);
        console.log(`- S&P 500 Avg Vol (3M): ${snp500.averageDailyVolume3Month}`);
        console.log(`- 10Y Yield (^TNX): ${tnx.regularMarketPrice}`);
        console.log(`- 3M Yield (^IRX): ${irx.regularMarketPrice}`);
        console.log(`- VIX (^VIX): ${vix.regularMarketPrice}`);
        console.log(`- HYG Price: ${hyg.regularMarketPrice}, Change: ${hyg.regularMarketChangePercent}%`);

        console.log("\n📐 Logic Verification:");

        // 1. S&P 500 Trend
        const snpPrice = snp500.regularMarketPrice;
        const snp200MA = snp500.twoHundredDayAverage || (snpPrice * 0.95); // Fallback logic in correct code

        let snp500Trend = "Neutral";
        if (snpPrice > snp200MA * 1.05) snp500Trend = "Bull";
        else if (snpPrice < snp200MA * 0.95) snp500Trend = "Bear";

        console.log(`[Trend] Price(${snpPrice}) vs 200MA(${snp200MA}) -> ${snp500Trend}`);
        if (!snp500.twoHundredDayAverage) console.warn("  ⚠️ Warning: 200MA missing, using fallback (Price * 0.95)");

        // 2. Yield Spread
        const yieldSpread = tnx.regularMarketPrice - irx.regularMarketPrice;
        let yieldSpreadStatus = "Normal";
        if (yieldSpread < -0.1) yieldSpreadStatus = "Inverted";
        else if (yieldSpread < 0.2) yieldSpreadStatus = "Flat";

        console.log(`[Spread] 10Y(${tnx.regularMarketPrice}) - 3M(${irx.regularMarketPrice}) = ${yieldSpread.toFixed(3)} -> ${yieldSpreadStatus}`);

        // 3. Real Rate
        const inflationProxy = 2.5;
        const realRate = tnx.regularMarketPrice - inflationProxy;
        let realRateStatus = "Neutral";
        if (realRate > 2.0) realRateStatus = "Positive";
        else if (realRate < 0.5) realRateStatus = "Negative";

        console.log(`[Real Rate] 10Y(${tnx.regularMarketPrice}) - Inflation(${inflationProxy}) = ${realRate.toFixed(3)} -> ${realRateStatus}`);

        // 4. VIX
        const vixPrice = vix.regularMarketPrice;
        let vixStatus = "Stable";
        if (vixPrice > 30) vixStatus = "Panic";
        else if (vixPrice > 20) vixStatus = "Volatile";

        console.log(`[VIX] Value(${vixPrice}) -> ${vixStatus}`);

        // 5. Volume
        const snpVolume = snp500.regularMarketVolume || 0;
        const snpAvgVolume = snp500.averageDailyVolume3Month || snpVolume || 1;
        let volumeTrend = "Neutral";
        if (snpVolume > snpAvgVolume * 1.1) {
            volumeTrend = snp500.regularMarketChangePercent >= 0 ? "Accumulation" : "Distribution";
        }
        console.log(`[Volume] Current(${snpVolume}) vs Avg(${snpAvgVolume}) -> Ratio: ${(snpVolume / snpAvgVolume).toFixed(2)} -> ${volumeTrend}`);

        // 6. Credit Risk
        const hygChange = hyg.regularMarketChangePercent;
        let creditSpreadStatus = "Stable";
        if (hygChange < -1.5) creditSpreadStatus = "Stress";
        else if (hygChange < -0.7) creditSpreadStatus = "Warning";
        console.log(`[Credit] HYG Change(${hygChange}%) -> ${creditSpreadStatus}`);

        // 7. Kostolany Phase
        let kostolanyPhase = "Neutral";
        // Logic copy-paste from market-data.ts
        if (snp500Trend === "Bull") {
            if (realRateStatus === "Positive" || vixPrice < 14) {
                kostolanyPhase = "A3"; // 과장 국면
            } else if (realRateStatus === "Negative" || vixPrice < 20) {
                kostolanyPhase = "A2"; // 동행 국면
            } else {
                kostolanyPhase = "A1"; // 수정 국면
            }
        } else if (snp500Trend === "Bear") {
            if (vixStatus === "Panic") {
                kostolanyPhase = "B3"; // 과장 국면 (매수 시기)
            } else if (realRateStatus === "Positive" || vixPrice > 20) {
                kostolanyPhase = "B2"; // 동행 국면 (관망 시기)
            } else {
                kostolanyPhase = "B1"; // 수정 국면 (매도 시작)
            }
        }

        console.log(`\n🥚 Final Kostolany Phase: ${kostolanyPhase}`);

    } catch (e) {
        console.error("Error executing script:", e);
    }
}

checkMarketIndicators();

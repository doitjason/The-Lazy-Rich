const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function checkPeg(symbol) {
    try {
        console.log(`\n--- Checking ${symbol} ---`);
        const result = await yahooFinance.quoteSummary(symbol, {
            modules: ["defaultKeyStatistics", "financialData", "summaryDetail"]
        });

        // Print all keys of modules to see what's available
        console.log('defaultKeyStatistics fields:', Object.keys(result.defaultKeyStatistics || {}));
        console.log('financialData fields:', Object.keys(result.financialData || {}));
        console.log('summaryDetail fields:', Object.keys(result.summaryDetail || {}));

        const stats = result.defaultKeyStatistics || {};
        const financial = result.financialData || {};
        const detail = result.summaryDetail || {};

        console.log('PEG Ratio:', stats.pegRatio);
        console.log('Trailing P/E (stats):', stats.trailingPE);
        console.log('Forward P/E (stats):', stats.forwardPE);
        console.log('Trailing P/E (detail):', detail.trailingPE);
        console.log('Earnings Growth:', financial.earningsGrowth);
        console.log('Revenue Growth:', financial.revenueGrowth);

    } catch (error) {
        console.error(`Error for ${symbol}:`, error.message);
    }
}

async function run() {
    await checkPeg('AAPL');
    await checkPeg('005930.KS');
}

run();

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function checkEtfData(symbol) {
    try {
        console.log(`\n--- ETF: ${symbol} ---`);
        const result = await yahooFinance.quoteSummary(symbol, {
            modules: ["summaryDetail", "fundProfile", "topHoldings", "defaultKeyStatistics"]
        });
        console.log('Available Modules:', Object.keys(result));

        const fundProfile = result.fundProfile || {};
        console.log('Fund Profile Keys:', Object.keys(fundProfile));
        console.log('Sharpe Ratio (fundProfile):', fundProfile.sharpeRatio);

        const stats = result.defaultKeyStatistics || {};
        console.log('Stats Keys:', Object.keys(stats));

    } catch (e) {
        console.error(e.message);
    }
}

async function run() {
    await checkEtfData('SPY');
    await checkEtfData('SCHD');
}

run();

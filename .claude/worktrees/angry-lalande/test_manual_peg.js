const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function testManualPeg(symbol) {
    try {
        const result = await yahooFinance.quoteSummary(symbol, {
            modules: ["defaultKeyStatistics", "financialData", "summaryDetail"]
        });

        const stats = result.defaultKeyStatistics || {};
        const financial = result.financialData || {};
        const detail = result.summaryDetail || {};

        const rawPeg = stats.pegRatio;
        const forwardPE = stats.forwardPE;
        const earningsGrowth = financial.earningsGrowth;
        const dividendYield = detail.dividendYield;

        console.log(`\n--- Symbol: ${symbol} ---`);
        console.log('API PEG:', rawPeg);
        console.log('Forward PE:', forwardPE);
        console.log('Earnings Growth:', earningsGrowth);
        console.log('Dividend Yield:', dividendYield);

        let finalPeg = rawPeg ?? null;
        if (finalPeg === null && forwardPE !== null && earningsGrowth !== null && earningsGrowth > 0) {
            const totalGrowth = (earningsGrowth * 100) + ((dividendYield || 0) * 100);
            if (totalGrowth > 0) {
                finalPeg = forwardPE / totalGrowth;
            }
        }
        console.log('Final (Manual) PEG:', finalPeg);

    } catch (e) {
        console.error(e.message);
    }
}

async function run() {
    await testManualPeg('AAPL');
    await testManualPeg('005930.KS');
}

run();

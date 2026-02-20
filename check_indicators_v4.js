const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function checkIndicators(symbol) {
    try {
        console.log(`\n--- Symbol: ${symbol} ---`);
        const result = await yahooFinance.quoteSummary(symbol, {
            modules: ["defaultKeyStatistics", "financialData", "summaryDetail"]
        });

        const stats = result.defaultKeyStatistics || {};
        const financial = result.financialData || {};
        const detail = result.summaryDetail || {};

        console.log('FCF:', financial.freeCashflow);
        console.log('Market Cap:', detail.marketCap);
        console.log('ROE:', financial.returnOnEquity);
        console.log('Dividend Yield:', detail.dividendYield);
        console.log('Trailing Annual Dividend Yield:', detail.trailingAnnualDividendYield);

        const fcfYield = (financial.freeCashflow && detail.marketCap) ? financial.freeCashflow / detail.marketCap : null;
        console.log('Calculated FCF Yield:', fcfYield);

    } catch (e) {
        console.error(e.message);
    }
}

async function checkMacro() {
    const symbols = ["^MOVE", "^GSPC", "^TNX", "^IRX", "XLY", "XLP", "SPHB", "SPLV"];
    console.log('\n--- Macro Indicators ---');
    for (const sym of symbols) {
        try {
            const quote = await yahooFinance.quote(sym);
            console.log(`${sym}: ${quote?.regularMarketPrice || 'N/A'}`);
        } catch (e) {
            console.log(`${sym}: Error - ${e.message}`);
        }
    }
}

async function run() {
    await checkIndicators('AAPL');
    await checkIndicators('005930.KS');
    await checkMacro();
}

run();

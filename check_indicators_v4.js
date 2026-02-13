const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance(); // Instantiate!

async function checkIndicators() {
    const symbol = 'AAPL';
    console.log(`Checking data for ${symbol}...`);

    try {
        const summary = await yf.quoteSummary(symbol, {
            modules: [
                'financialData',
                'defaultKeyStatistics',
                'summaryDetail',
                'majorHoldersBreakdown'
            ]
        });

        console.log('\n--- Sage Indicators ---');
        console.log('FCF:', summary.financialData.freeCashflow);
        console.log('Market Cap:', summary.summaryDetail.marketCap);
        console.log('Institutional Ownership:', summary.majorHoldersBreakdown?.heldPercentInstitutions);

        // ROIC Proxies
        console.log('Return on Equity (ROE):', summary.financialData.returnOnEquity);
        console.log('Return on Assets (ROA):', summary.financialData.returnOnAssets);


        console.log('\n--- Hero Indicators ---');
        console.log('Price/Sales (Trailing):', summary.summaryDetail.priceToSalesTrailing12Months);
        console.log('PEG Ratio:', summary.defaultKeyStatistics.pegRatio);
        console.log('Short Ratio:', summary.defaultKeyStatistics.shortRatio);


        console.log('\n--- Architect Indicators ---');
        const tickers = ['^MOVE', 'XLY', 'XLP', 'SPHB', 'SPLV'];
        for (const t of tickers) {
            try {
                const q = await yf.quote(t);
                if (q) console.log(`${t}: Found, Price = ${q.regularMarketPrice}`);
                else console.log(`${t}: Not Found (null returned)`);
            } catch (e) {
                console.log(`${t}: Error (${e.message})`);
            }
        }


        console.log('\n--- Father Indicators ---');
        console.log('Beta:', summary.defaultKeyStatistics.beta);

    } catch (e) {
        console.error('Main Error:', e);
    }
}

checkIndicators();

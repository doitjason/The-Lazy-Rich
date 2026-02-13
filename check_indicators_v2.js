const yf_pkg = require('yahoo-finance2');
const yf = yf_pkg.default;

async function checkIndicators() {
    try {
        const symbol = 'AAPL';
        console.log(`Checking data for ${symbol}...`);

        const summary = await yf.quoteSummary(symbol, { modules: ["financialData", "defaultKeyStatistics", "summaryDetail", "majorHoldersBreakdown"] });

        console.log('\n--- Sage Indicators ---');
        console.log('FCF:', summary.financialData.freeCashflow);
        console.log('Market Cap:', summary.summaryDetail.marketCap);
        console.log('Institutional Ownership:', summary.majorHoldersBreakdown?.heldPercentInstitutions);
        // ROIC Calculation requires access to other modules which might not be readily available in quoteSummary without specific module names like 'incomeStatementHistory' etc.
        // However, basic ratios like ROE are available.
        console.log('ROE:', summary.financialData.returnOnEquity);


        console.log('\n--- Hero Indicators ---');
        console.log('PriceToSalesTrailing12Months:', summary.summaryDetail.priceToSalesTrailing12Months);
        console.log('PEG Ratio:', summary.defaultKeyStatistics.pegRatio);
        console.log('Short Ratio:', summary.defaultKeyStatistics.shortRatio);
        // PSR requires calculation: Price / (Revenue / Shares) if not directly available.
        // But summaryDetail usually has PriceToSales.

        console.log('\n--- Architect Indicators ---');
        // Check ticker existence
        const tickers = ['^MOVE', 'XLY', 'XLP', 'SPHB', 'SPLV'];
        for (const t of tickers) {
            try {
                const q = await yf.quote(t);
                console.log(`${t}: Found, Price = ${q.regularMarketPrice}`);
            } catch (e) {
                console.log(`${t}: Not Found or Error (${e.message})`);
            }
        }

        console.log('\n--- Father Indicators ---');
        console.log('Beta:', summary.defaultKeyStatistics.beta);

    } catch (e) {
        console.error('Error:', e);
    }
}

checkIndicators();

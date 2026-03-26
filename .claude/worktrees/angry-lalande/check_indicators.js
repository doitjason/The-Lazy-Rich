const yf_pkg = require('yahoo-finance2');
const yf = yf_pkg.default;

async function checkIndicators() {
    try {
        const symbol = 'AAPL';
        console.log(`Checking data for ${symbol}...`);

        const summary = await yf.quoteSummary(symbol, {
            modules: [
                'financialData',
                'defaultKeyStatistics',
                'summaryDetail',
                'majorHoldersBreakdown',
                'earnings',       // For more detailed earnings if needed
                'balanceSheetHistory', // For ROIC calculation data
                'incomeStatementHistory', // For ROIC calculation data
                'cashflowStatementHistory' // For FCF
            ]
        });

        // 1. Sage
        console.log('\n--- Sage Indicators ---');
        console.log('FCF:', summary.financialData.freeCashflow);
        console.log('Market Cap:', summary.summaryDetail.marketCap);
        console.log('Institutional Ownership:', summary.majorHoldersBreakdown?.heldPercentInstitutions);

        // ROIC Calculation Data Check
        // ROIC = NOPAT / Invested Capital
        // NOPAT = EBIT * (1 - Tax Rate)
        // Invested Capital = Total Equity + Total Debt - Cash & Equivalents
        const income = summary.incomeStatementHistory?.incomeStatementHistory?.[0];
        const balance = summary.balanceSheetHistory?.balanceSheetStatements?.[0];

        if (income && balance) {
            console.log('EBIT:', income.ebit);
            console.log('Tax Provision:', income.taxProvision);
            console.log('Pretax Income:', income.incomeBeforeTax); // Tax Rate ~= taxProvision / incomeBeforeTax
            console.log('Total Equity:', balance.totalStockholderEquity);
            console.log('Total Debt:', balance.shortLongTermDebt + balance.longTermDebt); // Rough approx
            console.log('Cash:', balance.cash);
        } else {
            console.log('Financial statements for ROIC missing in quoteSummary.');
        }


        // 2. Hero
        console.log('\n--- Hero Indicators ---');
        console.log('PriceToSalesTrailing12Months:', summary.summaryDetail.priceToSalesTrailing12Months);
        console.log('PEG Ratio:', summary.defaultKeyStatistics.pegRatio);
        console.log('Short Ratio:', summary.defaultKeyStatistics.shortRatio);


        // 3. Speculator (Technical Indicators) - requires historical data
        console.log('\n--- Speculator Indicators ---');
        console.log('Historical data required for MFI, Stochastic, OBV. Fetching 1 month...');
        const historical = await yf.historical(symbol, { period1: '2024-01-01', interval: '1d' }); // Just sample
        console.log(`Fetched ${historical.length} days of historical data.`);
        console.log('First day:', historical[0]);

        // 4. Architect (ETFs & Index)
        console.log('\n--- Architect Indicators ---');
        console.log('Checking Tickers existence (MOVE, XLY, XLP, SPHB, SPLV):');
        const tickers = ['^MOVE', 'XLY', 'XLP', 'SPHB', 'SPLV'];
        for (const t of tickers) {
            try {
                const q = await yf.quote(t);
                console.log(`${t}: Found, Price = ${q.regularMarketPrice}`);
            } catch (e) {
                console.log(`${t}: Not Found or Error (${e.message})`);
            }
        }


        // 5. Father
        console.log('\n--- Father Indicators ---');
        console.log('Beta:', summary.defaultKeyStatistics.beta || summary.summaryDetail.beta);
        // Sharpe Ratio requires historical calculation, already known feasible.

    } catch (e) {
        console.error('Error:', e);
    }
}

checkIndicators();

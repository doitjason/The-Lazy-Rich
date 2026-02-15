
const { fetchEnrichedPortfolio } = require('./src/lib/market-data');

async function test() {
    console.log("Fetching enriched portfolio...");
    const tickers = ["AAPL", "SCHD", "O", "TQQQ", "005930.KS"];
    try {
        const data = await fetchEnrichedPortfolio(tickers);
        console.log("Result:");
        Object.entries(data).forEach(([ticker, info]) => {
            console.log(`[${ticker}] Price: ${info.price}, DivYield: ${info.dividendYield}, Sector: ${info.sector}`);
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

test();

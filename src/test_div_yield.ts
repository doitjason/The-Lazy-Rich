
import { fetchEnrichedPortfolio } from './lib/market-data';

async function test() {
    console.log("=== START TEST ===");
    const tickers = ["AAPL", "SCHD", "O", "TQQQ", "005930.KS"];
    try {
        const data = await fetchEnrichedPortfolio(tickers);
        console.log("=== RESULT START ===");
        Object.entries(data).forEach(([ticker, info]) => {
            console.log(`[${ticker}] Price: ${info.price}, DivYield: ${info.dividendYield}, Sector: ${info.sector}`);
        });
        console.log("=== RESULT END ===");
    } catch (e) {
        console.error("Error:", e);
    }
}

test();

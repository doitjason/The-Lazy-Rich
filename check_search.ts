import YahooFinance from "yahoo-finance2";

async function run() {
    const r = await YahooFinance.search("삼성전자");
    console.log("SAMSUNG:", r.quotes.map(q => q.symbol).join(', '));
    const r2 = await YahooFinance.search("현대차");
    console.log("HYUNDAI:", r2.quotes.map(q => q.symbol).join(', '));
}

run();

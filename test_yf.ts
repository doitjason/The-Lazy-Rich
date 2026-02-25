import yahooFinance from 'yahoo-finance2';

async function test() {
    try {
        const r = await yahooFinance.search('카카오');
        console.log("kakao:", r.quotes.map(q => q.symbol).join(', '));
        const r2 = await yahooFinance.search('삼성전자');
        console.log("samsung:", r2.quotes.map(q => q.symbol).join(', '));
    } catch (e) {
        console.error(e);
    }
}
test();

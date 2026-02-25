const https = require('https');
https.get('https://m.stock.naver.com/front-api/v1/search/autoComplete?query=' + encodeURIComponent('삼성전자'), {
    headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log(d));
});

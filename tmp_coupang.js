const https = require('https');
https.get('https://partners.coupang.com', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Coupan loaded. Status:', res.statusCode));
}).on('error', err => console.error(err));

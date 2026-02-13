const pkg = require('yahoo-finance2');

console.log('pkg:', typeof pkg, Object.keys(pkg));
if (pkg.default) {
    console.log('pkg.default:', typeof pkg.default);
    if (typeof pkg.default === 'function') {
        try {
            const instance = new pkg.default();
            console.log('Success: new pkg.default() worked');
        } catch (e) {
            console.log('Failed: new pkg.default() ->', e.message);
        }
    } else {
        console.log('pkg.default keys:', Object.keys(pkg.default));
    }
}

console.log('Seeking YahooFinance constructor...');
// Use a recursive search for 'YahooFinance' or a class
function findConstructor(obj, depth = 0) {
    if (depth > 2) return;
    for (const key of Object.keys(obj)) {
        if (key === 'YahooFinance') console.log(`Found YahooFinance at depth ${depth} key ${key}`);
        if (typeof obj[key] === 'object' && obj[key] !== null) findConstructor(obj[key], depth + 1);
    }
}
findConstructor(pkg);

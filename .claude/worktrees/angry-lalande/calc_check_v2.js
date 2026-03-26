
function calc(initial, monthly, annualRate, years, inflationRate) {
    let total = initial;
    let currM = monthly;
    let r = annualRate / 100 / 12;
    for (let y = 1; y <= years; y++) {
        for (let m = 1; m <= 12; m++) {
            total = (total + currM) * (1 + r);
        }
        currM *= (1 + inflationRate / 100);
        if ([5, 10, 15, 20, 25, 30].includes(y)) {
            process.stdout.write(`Y${y}: ${Math.round(total / 10000)}만 `);
        }
    }
    process.stdout.write('\n');
}

console.log("C1 (1M, 10%, 25y, i3%):"); calc(0, 1000000, 10, 25, 3);
console.log("C2 (10M i, 1M m, 10%, 10y, i3%):"); calc(10000000, 1000000, 10, 10, 3);
console.log("C3_Low (10M i, 1M m, 3.6%, 20y, i3%):"); calc(10000000, 1000000, 3.6, 20, 3);
console.log("C3_Hi (10M i, 1M m, 10%, 20y, i3%):"); calc(10000000, 1000000, 10, 20, 3);
console.log("C4_5% (10M i, 0.5M m, 5%, 30y, i3%):"); calc(10000000, 500000, 5, 30, 3);
console.log("C4_10% (10M i, 0.5M m, 10%, 30y, i3%):"); calc(10000000, 500000, 10, 30, 3);
console.log("C14 (0.3M m, 10%, 30y, i3%):"); calc(0, 300000, 10, 30, 3);

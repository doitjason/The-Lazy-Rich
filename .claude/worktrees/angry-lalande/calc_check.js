
function calculateCompoundInterest(initial, monthly, rate, years, inflationRate = 0) {
    let currentBalance = initial;
    let totalInvested = initial;

    const nominalRate = rate / 100;
    const inflRate = inflationRate / 100;
    const realRate = (1 + nominalRate) / (1 + inflRate) - 1;
    const r = realRate / 12;

    for (let y = 1; y <= years; y++) {
        for (let m = 0; m < 12; m++) {
            currentBalance = (currentBalance + monthly) * (1 + r);
            totalInvested += monthly;
        }
    }

    const realValue = Math.round(currentBalance);
    const nominalAsset = Math.round(realValue * Math.pow(1 + inflRate, years));

    let totalInvestedNominal = initial;
    if (inflationRate === 0) {
        totalInvestedNominal += monthly * 12 * years;
    } else {
        totalInvestedNominal += monthly * 12 * (Math.pow(1 + inflRate, years) - 1) / (inflationRate / 100);
    }

    return {
        realValue,
        nominalAsset,
        totalInvestedNominal: Math.round(totalInvestedNominal)
    };
}

const cases = [
    { name: "Col 1 (10y)", initial: 0, monthly: 1000000, rate: 10, years: 10, inflation: 3 },
    { name: "Col 1 (25y)", initial: 0, monthly: 1000000, rate: 10, years: 25, inflation: 3 },
    { name: "Col 2 (10y)", initial: 10000000, monthly: 1000000, rate: 10, years: 10, inflation: 3 },
    { name: "Col 2 (20y)", initial: 10000000, monthly: 1000000, rate: 10, years: 20, inflation: 3 },
    { name: "Col 2 (30y)", initial: 10000000, monthly: 1000000, rate: 10, years: 30, inflation: 3 },
    { name: "Col 2 Savings (10y)", initial: 10000000, monthly: 1000000, rate: 3.5, years: 10, inflation: 3 },
    { name: "Col 2 Savings (20y)", initial: 10000000, monthly: 1000000, rate: 3.5, years: 20, inflation: 3 },
    { name: "Col 2 Savings (30y)", initial: 10000000, monthly: 1000000, rate: 3.5, years: 30, inflation: 3 },
    { name: "Col 4 (30y, 5%)", initial: 10000000, monthly: 500000, rate: 5, years: 30, inflation: 3 },
    { name: "Col 4 (30y, 10%)", initial: 10000000, monthly: 500000, rate: 10, years: 30, inflation: 3 },
    { name: "Col 14 (30y)", initial: 0, monthly: 300000, rate: 10, years: 30, inflation: 3 },
    { name: "Col 15 (20y)", initial: 0, monthly: 300000, rate: 10, years: 20, inflation: 3 }
];

const fs = require('fs');
let out = "";
cases.forEach(c => {
    const res = calculateCompoundInterest(c.initial, c.monthly, c.rate, c.years, c.inflation);
    out += `${c.name}: Nominal=${(res.nominalAsset / 100000000).toFixed(4)}억, Real=${(res.realValue / 100000000).toFixed(4)}억, InvestedNominal=${(res.totalInvestedNominal / 100000000).toFixed(4)}억\n`;
});
fs.writeFileSync('calc_results_final.txt', out, 'utf8');

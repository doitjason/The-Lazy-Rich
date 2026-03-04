export interface CompoundResult {
    year: number;
    totalInvested: number;
    interest: number;
    totalAmount: number;
}

/**
 * Calculates compound interest year by year for charting.
 * @param initial - Initial investment amount
 * @param monthly - Monthly contribution
 * @param rate - Annual interest rate (percentage, e.g., 7 for 7%)
 * @param years - Investment duration in years
 * @returns Array of CompoundResult for each year
 */
export function calculateCompoundInterest(
    initial: number,
    monthly: number,
    rate: number,
    years: number,
    inflationRate: number = 0
): CompoundResult[] {
    const results: CompoundResult[] = [];

    // 1. Extreme Input Protection to prevent White Screen of Death (WSOD)
    // Coerce invalid inputs to 0
    if (isNaN(initial) || !isFinite(initial)) initial = 0;
    if (isNaN(monthly) || !isFinite(monthly)) monthly = 0;
    if (isNaN(rate) || !isFinite(rate)) rate = 0;
    if (isNaN(years) || !isFinite(years)) years = 0;
    if (isNaN(inflationRate) || !isFinite(inflationRate)) inflationRate = 0;

    // Constrain years to prevent infinite/massive loops freezing the browser
    const safeYears = Math.max(0, Math.min(Math.floor(years), 100)); // Max 100 years

    // Prevent division by zero if inflation is -100%
    const safeInflation = inflationRate <= -100 ? -99.99 : inflationRate;

    let currentBalance = initial;
    let totalInvested = initial;

    // 2. Absolute Mathematical Precision
    // Calculate real interest rate
    // Real Rate = (1 + Nominal) / (1 + Inflation) - 1
    const nominalRate = rate / 100;
    const inflRate = safeInflation / 100;
    const realRate = (1 + nominalRate) / (1 + inflRate) - 1;

    // Precise Monthly rate: (1 + Annual_Rate)^(1/12) - 1 
    // This exactly yields the realRate over 12 months, rather than realRate / 12 which overshoots
    const r = Math.pow(1 + realRate, 1 / 12) - 1;

    // Year 0
    results.push({
        year: 0,
        totalInvested: initial,
        interest: 0,
        totalAmount: initial,
    });

    for (let y = 1; y <= safeYears; y++) {
        for (let m = 0; m < 12; m++) {
            currentBalance = (currentBalance + monthly) * (1 + r);
            totalInvested += monthly;
        }

        // Keep values finite to prevent rendering errors
        if (!isFinite(currentBalance)) currentBalance = Number.MAX_SAFE_INTEGER;
        if (!isFinite(totalInvested)) totalInvested = Number.MAX_SAFE_INTEGER;

        // Round to 2 decimal places - wait, Math.round is 0 decimals. Corrected to integers.
        const totalAmount = Math.round(currentBalance);
        const interest = Math.round(totalAmount - totalInvested);

        results.push({
            year: y,
            totalInvested: Math.round(totalInvested),
            interest: interest,
            totalAmount: totalAmount,
        });
    }

    return results;
}

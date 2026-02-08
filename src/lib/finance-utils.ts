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
    let currentBalance = initial;
    let totalInvested = initial;

    // Calculate real interest rate if inflation is present
    // Real Rate = (1 + Nominal) / (1 + Inflation) - 1
    const nominalRate = rate / 100;
    const inflRate = inflationRate / 100;
    const realRate = (1 + nominalRate) / (1 + inflRate) - 1;

    // Monthly rate
    const r = realRate / 12;

    // Year 0
    results.push({
        year: 0,
        totalInvested: initial,
        interest: 0,
        totalAmount: initial,
    });

    for (let y = 1; y <= years; y++) {
        for (let m = 0; m < 12; m++) {
            currentBalance = (currentBalance + monthly) * (1 + r);
            totalInvested += monthly;
        }

        // Round to 2 decimal places
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

/**
 * Calculate Compound Interest
 * Returns an array of yearly asset values.
 * 
 * @param principal Initial amount
 * @param annualRate Annual return rate (percentage, e.g., 7 for 7%)
 * @param years Number of years to simulate
 * @param monthlyContribution Monthly addition to the principal
 * @param currentAge Starting age
 */
export interface YearlyAsset {
    age: number;
    assets: number;
    invested: number; // Total principal invested
    interest: number; // Total interest earned
}

export function calculateCompoundInterest(
    principal: number,
    annualRate: number,
    years: number,
    monthlyContribution: number,
    currentAge: number = 30
): YearlyAsset[] {
    const data: YearlyAsset[] = [];
    let currentAssets = principal;
    let totalInvested = principal;
    const monthlyRate = annualRate / 100 / 12;

    for (let year = 0; year <= years; year++) {
        data.push({
            age: currentAge + year,
            assets: Math.round(currentAssets),
            invested: Math.round(totalInvested),
            interest: Math.round(currentAssets - totalInvested)
        });

        // Compound for 12 months
        for (let i = 0; i < 12; i++) {
            currentAssets = (currentAssets + monthlyContribution) * (1 + monthlyRate);
            totalInvested += monthlyContribution;
        }
    }
    return data;
}

/**
 * Calculate Forward Projection with Inflation
 * Returns an array of yearly values including nominal and real (inflation-adjusted) assets.
 */
export interface ForwardProjectionData {
    age: number;
    nominalAssets: number;
    realAssets: number;
    totalInvested: number;
    year: number;
}

export function calculateForwardProjection(
    principal: number,
    monthlyContribution: number,
    annualReturnRate: number,
    inflationRate: number,
    years: number,
    currentAge: number = 30
): ForwardProjectionData[] {
    const data: ForwardProjectionData[] = [];
    let currentNominalAssets = principal;
    let totalInvested = principal;

    // Monthly rates
    const monthlyReturnRate = annualReturnRate / 100 / 12;
    // Inflation calculation is usually annual, but let's apply monthly for consistency or just annual adjustment on real value.
    // Simpler: Apply nominal return monthly, then adjust for inflation at snapshot time.

    for (let year = 0; year <= years; year++) {
        // Calculate Real Assets: Nominal / (1 + inflation)^year
        const realAssets = currentNominalAssets / Math.pow(1 + inflationRate / 100, year);

        data.push({
            year,
            age: currentAge + year,
            nominalAssets: Math.round(currentNominalAssets),
            realAssets: Math.round(realAssets),
            totalInvested: Math.round(totalInvested)
        });

        // Compound NEXT year
        for (let i = 0; i < 12; i++) {
            currentNominalAssets = (currentNominalAssets + monthlyContribution) * (1 + monthlyReturnRate);
            totalInvested += monthlyContribution;
        }
    }

    return data;
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 */
export function calculateCAGR(startValue: number, endValue: number, years: number): number {
    if (startValue === 0 || years === 0) return 0;
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Calculate Inflation Adjusted Value
 * Returns the future value in today's purchasing power.
 */
export function calculateInflationAdjusted(value: number, inflationRate: number, years: number): number {
    return value / Math.pow(1 + inflationRate / 100, years);
}

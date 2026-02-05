import { useState } from 'react';
import { calculateForwardProjection, ForwardProjectionData } from '@/lib/finance';

interface FireCalculationParams {
    currentAssets: number;
    monthlySaving: number;
    investmentYears: number;
    annualReturnRate: number;
    inflationRate: number;
    currentAge?: number;
}

export interface FireCalculationResult {
    data: ForwardProjectionData[];
    finalNominalAssets: number;
    finalRealAssets: number;
    monthlyPassiveIncome: number; // Based on Real Assets (Purchasing Power)
    totalInvested: number;
}

export const useFireCalculation = () => {
    const calculate = ({
        currentAssets,
        monthlySaving,
        investmentYears,
        annualReturnRate,
        inflationRate,
        currentAge = 30
    }: FireCalculationParams): FireCalculationResult => {

        const data = calculateForwardProjection(
            currentAssets,
            monthlySaving,
            annualReturnRate,
            inflationRate,
            investmentYears,
            currentAge
        );

        const finalYearData = data[data.length - 1];
        const finalRealAssets = finalYearData.realAssets;
        const finalNominalAssets = finalYearData.nominalAssets;

        // 4% Rule: Annual Safe Withdrawal Rate = 4% of Real Assets
        // Monthly Passive Income = (Real Assets * 0.04) / 12
        // This represents the purchasing power of the monthly income.
        const monthlyPassiveIncome = Math.round((finalRealAssets * 0.04) / 12);

        return {
            data,
            finalNominalAssets,
            finalRealAssets,
            monthlyPassiveIncome,
            totalInvested: finalYearData.totalInvested
        };
    };

    return { calculate };
};

export type AssetType = 'STOCK' | 'CRYPTO' | 'CASH' | 'REAL_ESTATE';

export interface PortfolioItem {
    id: string;
    ticker?: string;
    name: string;
    type: AssetType;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
}

export interface PortfolioSimulationResult {
    totalValue: number;
    totalGain: number;
    totalGainRate: number;
}

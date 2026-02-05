import { useMutation } from '@tanstack/react-query';
import { fetchStockHistory } from '@/app/actions/stock';

export interface StockHistoryParams {
    ticker: string;
    startDate: string;
    amount: number;
}

export const useStockHistory = () => {
    return useMutation({
        mutationFn: async ({ ticker, startDate, amount }: StockHistoryParams) => {
            const result = await fetchStockHistory(ticker, startDate, amount);
            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        },
    });
};

import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export type PortfolioItem = {
    id: string;
    user_id: string;
    ticker: string;
    quantity: number;
    avg_price: number;
    created_at: string;
};

type PortfolioStore = {
    items: PortfolioItem[];
    loading: boolean;
    error: string | null;
    fetchPortfolio: (userId: string) => Promise<void>;
    addItem: (userId: string, ticker: string, quantity: number, avgPrice: number) => Promise<boolean>;
    updateItem: (id: string, quantity: number, avgPrice: number) => Promise<boolean>;
    deleteItem: (id: string) => Promise<boolean>;
};

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
    items: [],
    loading: false,
    error: null,

    fetchPortfolio: async (userId: string) => {
        set({ loading: true, error: null });

        const { data, error } = await supabase
            .from("portfolios")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            set({ loading: false, error: error.message });
            return;
        }

        set({ items: data as PortfolioItem[], loading: false });
    },

    addItem: async (userId: string, ticker: string, quantity: number, avgPrice: number) => {
        set({ loading: true, error: null });

        const { error } = await supabase
            .from("portfolios")
            .insert({
                user_id: userId,
                ticker: ticker.toUpperCase(),
                quantity,
                avg_price: avgPrice,
            });

        if (error) {
            set({ loading: false, error: error.message });
            return false;
        }

        // Refresh list after adding
        await get().fetchPortfolio(userId);
        return true;
    },

    updateItem: async (id: string, quantity: number, avgPrice: number) => {
        set({ loading: true, error: null });

        const { error } = await supabase
            .from("portfolios")
            .update({ quantity, avg_price: avgPrice })
            .eq("id", id);

        if (error) {
            set({ loading: false, error: error.message });
            return false;
        }

        // Update local state
        set((state) => ({
            items: state.items.map((item) =>
                item.id === id ? { ...item, quantity, avg_price: avgPrice } : item
            ),
            loading: false,
        }));

        return true;
    },

    deleteItem: async (id: string) => {
        set({ loading: true, error: null });

        const { error } = await supabase
            .from("portfolios")
            .delete()
            .eq("id", id);

        if (error) {
            set({ loading: false, error: error.message });
            return false;
        }

        // Remove from local state
        set((state) => ({
            items: state.items.filter((item) => item.id !== id),
            loading: false,
        }));

        return true;
    },
}));

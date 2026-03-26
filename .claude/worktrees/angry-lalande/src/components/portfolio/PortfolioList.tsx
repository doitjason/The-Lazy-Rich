"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Trash2, Edit2, Check, X, TrendingUp, RefreshCw, Sparkles, ArrowUpDown, SlidersHorizontal, ArrowDown, ArrowUp } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StockSearchInput } from "@/components/ui/StockSearchInput";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolioStore, PortfolioItem } from "@/store/usePortfolioStore";
import { useCurrency } from "@/contexts/CurrencyContext";

type PriceData = {
    [ticker: string]: {
        price: number;
        change?: number;
        changePercent?: number;
        loading?: boolean;
        error?: string;
    }
}

// Helper to detect currency symbol based on ticker
function getCurrencySymbol(ticker: string): string {
    // Korean stocks: .KS (KOSPI) or .KQ (KOSDAQ)
    if (ticker.endsWith('.KS') || ticker.endsWith('.KQ')) {
        return '₩';
    }
    // Japanese stocks: .T (Tokyo)
    if (ticker.endsWith('.T')) {
        return '¥';
    }
    // Default to USD
    return '$';
}

// Helper to detect currency code based on ticker
function getCurrencyCode(ticker: string): "KRW" | "JPY" | "USD" {
    if (ticker.endsWith('.KS') || ticker.endsWith('.KQ')) {
        return 'KRW';
    }
    if (ticker.endsWith('.T')) {
        return 'JPY';
    }
    return 'USD';
}

// Skeleton Loader Component
function SkeletonCard() {
    return (
        <div className="p-4 rounded-xl bg-white/30 dark:bg-white/5 border border-white/20 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-16 bg-gray-300/50 dark:bg-gray-600/50 rounded" />
                        <div className="h-4 w-12 bg-gray-300/30 dark:bg-gray-600/30 rounded" />
                    </div>
                    <div className="h-3 w-32 bg-gray-300/30 dark:bg-gray-600/30 rounded" />
                </div>
                <div className="text-right space-y-1">
                    <div className="h-5 w-20 bg-gray-300/50 dark:bg-gray-600/50 rounded ml-auto" />
                    <div className="h-3 w-14 bg-gray-300/30 dark:bg-gray-600/30 rounded ml-auto" />
                </div>
            </div>
        </div>
    );
}

// Empty State Component
function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 px-6 text-center"
        >
            <div className="relative inline-block mb-4">
                <div className="absolute inset-0 animate-ping opacity-20">
                    <Sparkles className="h-16 w-16 text-primary" />
                </div>
                <Sparkles className="h-16 w-16 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
                첫 번째 투자를 기록해보세요!
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                보유 종목을 추가하면 실시간 수익률과 자산 현황을 한눈에 확인할 수 있어요.
            </p>
            <Button
                onClick={onAdd}
                className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 shadow-lg shadow-primary/20"
            >
                <Plus className="h-4 w-4 mr-2" />
                자산 추가하기
            </Button>
        </motion.div>
    );
}

export function PortfolioList() {
    const { user } = useAuth();
    const { items, loading, error, fetchPortfolio, addItem, updateItem, deleteItem } = usePortfolioStore();

    // Real-time prices
    const [prices, setPrices] = useState<PriceData>({});
    const [pricesLoading, setPricesLoading] = useState(false);

    // Sorting state
    const [sortBy, setSortBy] = useState<string>("recent");

    const sortOptions = [
        { value: 'recent', label: '최근 추가순' },
        { value: 'value_desc', label: '총자산 많은순' },
        { value: 'value_asc', label: '총자산 적은순' },
        { value: 'pnl_desc', label: '수익률 높은순' },
        { value: 'pnl_asc', label: '수익률 낮은순' },
        { value: 'ticker_asc', label: '이름순 (A-Z)' },
    ];

    // Add new item form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTicker, setNewTicker] = useState("");
    const [newQuantity, setNewQuantity] = useState("");
    const [newAvgPrice, setNewAvgPrice] = useState("");

    // Edit item state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editQuantity, setEditQuantity] = useState("");
    const [editAvgPrice, setEditAvgPrice] = useState("");

    // Fetch real-time prices for all tickers
    const fetchPrices = useCallback(async () => {
        if (items.length === 0) return;

        setPricesLoading(true);
        const uniqueTickers = [...new Set(items.map(item => item.ticker))];

        const newPrices: PriceData = {};

        await Promise.all(
            uniqueTickers.map(async (ticker) => {
                try {
                    const res = await fetch(`/api/stock/price?ticker=${ticker}`);
                    const data = await res.json();

                    if (res.ok && data.price) {
                        newPrices[ticker] = { price: data.price, loading: false };
                    } else {
                        newPrices[ticker] = { price: 0, loading: false, error: data.error };
                    }
                } catch (e) {
                    newPrices[ticker] = { price: 0, loading: false, error: "Failed to fetch" };
                }
            })
        );

        setPrices(newPrices);
        setPricesLoading(false);
    }, [items]);

    useEffect(() => {
        if (user?.id) {
            fetchPortfolio(user.id);
        }
    }, [user?.id, fetchPortfolio]);

    useEffect(() => {
        if (items.length > 0) {
            fetchPrices();
        }
    }, [items, fetchPrices]);

    const handleAdd = async () => {
        if (!user?.id || !newTicker || !newQuantity || !newAvgPrice) return;

        const success = await addItem(
            user.id,
            newTicker,
            parseFloat(newQuantity),
            parseFloat(newAvgPrice)
        );

        if (success) {
            setNewTicker("");
            setNewQuantity("");
            setNewAvgPrice("");
            setShowAddForm(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editQuantity || !editAvgPrice) return;

        const success = await updateItem(id, parseFloat(editQuantity), parseFloat(editAvgPrice));
        if (success) {
            setEditingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        await deleteItem(id);
    };

    const startEditing = (item: PortfolioItem) => {
        setEditingId(item.id);
        setEditQuantity(item.quantity.toString());
        setEditAvgPrice(item.avg_price.toString());
    };

    // Calculate profit/loss
    const calcPnL = (item: PortfolioItem) => {
        const priceData = prices[item.ticker];
        if (!priceData || priceData.loading || priceData.error) {
            return { pnl: 0, pnlPercent: 0, currentValue: item.quantity * item.avg_price, hasData: false };
        }

        const currentPrice = priceData.price;
        const costBasis = item.quantity * item.avg_price;
        const currentValue = item.quantity * currentPrice;
        const pnl = currentValue - costBasis;
        const pnlPercent = ((currentPrice - item.avg_price) / item.avg_price) * 100;

        return { pnl, pnlPercent, currentValue, currentPrice, hasData: true };
    };

    // Calculate total portfolio value and P/L
    const totalStats = items.reduce(
        (acc, item) => {
            const { pnl, currentValue, hasData } = calcPnL(item);
            const costBasis = item.quantity * item.avg_price;
            return {
                totalValue: acc.totalValue + (hasData ? currentValue : costBasis),
                totalPnL: acc.totalPnL + (hasData ? pnl : 0),
                totalCost: acc.totalCost + costBasis,
            };
        },
        { totalValue: 0, totalPnL: 0, totalCost: 0 }
    );

    const totalPnLPercent = totalStats.totalCost > 0 ? (totalStats.totalPnL / totalStats.totalCost) * 100 : 0;
    const isTotalProfit = totalStats.totalPnL >= 0;

    // Apply sorting
    const sortedItems = useMemo(() => {
        const itemsWithDetails = items.map(item => ({
            ...item,
            details: calcPnL(item)
        }));

        return [...itemsWithDetails].sort((a, b) => {
            switch (sortBy) {
                case 'value_desc':
                    return b.details.currentValue - a.details.currentValue;
                case 'value_asc':
                    return a.details.currentValue - b.details.currentValue;
                case 'pnl_desc':
                    return b.details.pnlPercent - a.details.pnlPercent;
                case 'pnl_asc':
                    return a.details.pnlPercent - b.details.pnlPercent;
                case 'ticker_asc':
                    return a.ticker.localeCompare(b.ticker);
                case 'recent':
                default:
                    // Store fetches with created_at desc by default, but let's be explicit if needed
                    // For now 'recent' just returns the original order from store
                    return 0;
            }
        });
    }, [items, prices, sortBy, calcPnL]);


    if (!user) {
        return (
            <Card className="border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                <CardContent className="py-8 text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">로그인하면 포트폴리오를 관리할 수 있어요</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
        >

            <Card className="overflow-hidden border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-2xl shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/10">
                    <div>
                        <CardTitle className="text-lg font-semibold">내 보유 종목</CardTitle>
                        {items.length > 0 && (
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-xl font-bold">${totalStats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <span className={`text-sm font-medium ${isTotalProfit ? 'text-red-500' : 'text-blue-500'}`}>
                                    {isTotalProfit ? '+' : ''}${totalStats.totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    ({totalPnLPercent >= 0 ? '+' : ''}{(Math.floor(Math.abs(totalPnLPercent) * 100) / 100).toFixed(2)}%)
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-muted-foreground h-8 px-2 flex gap-1 items-center hover:bg-white/10"
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    <span className="text-xs font-medium">
                                        {sortOptions.find(o => o.value === sortBy)?.label || "정렬"}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-white/20">
                                <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                    {sortOptions.map((option) => (
                                        <DropdownMenuRadioItem
                                            key={option.value}
                                            value={option.value}
                                            className="text-xs cursor-pointer focus:bg-primary/20"
                                        >
                                            {option.label}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={fetchPrices}
                            disabled={pricesLoading}
                            className="text-muted-foreground h-8 w-8 p-0"
                        >
                            <RefreshCw className={`h-4 w-4 ${pricesLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="text-primary h-8"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            추가
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {/* Add Form */}
                    <AnimatePresence>
                        {showAddForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-teal-500/10 border border-primary/20 space-y-3"
                            >
                                {/* Stock Search Dropdown */}
                                <StockSearchInput
                                    value={newTicker}
                                    onChange={(ticker) => setNewTicker(ticker)}
                                    placeholder="종목 검색..."
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="number"
                                        placeholder="수량"
                                        value={newQuantity}
                                        onChange={(e) => setNewQuantity(e.target.value)}
                                        className="h-10 bg-white/50 dark:bg-black/30 border-white/20"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="평균단가 ($)"
                                        value={newAvgPrice}
                                        onChange={(e) => setNewAvgPrice(e.target.value)}
                                        className="h-10 bg-white/50 dark:bg-black/30 border-white/20"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleAdd}
                                        disabled={loading}
                                        className="flex-1 h-10 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90"
                                    >
                                        <Check className="h-4 w-4 mr-1" />
                                        저장
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShowAddForm(false)}
                                        className="h-10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error Message */}
                    {error && (
                        <p className="text-sm text-red-500 text-center py-2">{error}</p>
                    )}

                    {/* Skeleton Loading State */}
                    {loading && items.length === 0 && (
                        <div className="space-y-3">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && items.length === 0 && (
                        <EmptyState onAdd={() => setShowAddForm(true)} />
                    )}

                    {/* Portfolio Items - Glassmorphism Cards */}
                    <AnimatePresence>
                        {sortedItems.map((item, index) => {
                            const { pnl, pnlPercent, currentValue, currentPrice, hasData } = item.details;
                            // Korean stock market convention: red = profit, blue = loss
                            const isProfit = pnl >= 0;
                            const profitColor = isProfit ? 'text-red-500' : 'text-blue-500';
                            const profitBg = isProfit ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30';
                            // Dynamic currency symbol based on ticker
                            const currencySymbol = getCurrencySymbol(item.ticker);

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 shadow-sm hover:shadow-md hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-200"
                                >
                                    {editingId === item.id ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-primary min-w-[60px] text-lg">{item.ticker.replace(".KS", "")}</span>
                                                <Input
                                                    type="number"
                                                    value={editQuantity}
                                                    onChange={(e) => setEditQuantity(e.target.value)}
                                                    className="h-9 text-sm flex-1 bg-white/50 dark:bg-black/30"
                                                    placeholder="수량"
                                                />
                                                <Input
                                                    type="number"
                                                    value={editAvgPrice}
                                                    onChange={(e) => setEditAvgPrice(e.target.value)}
                                                    className="h-9 text-sm flex-1 bg-white/50 dark:bg-black/30"
                                                    placeholder="평균단가"
                                                />
                                            </div>
                                            <div className="flex gap-1 justify-end">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleUpdate(item.id)}
                                                    className="h-8 px-3 text-green-600 hover:bg-green-500/10"
                                                >
                                                    <Check className="h-4 w-4 mr-1" /> 저장
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingId(null)}
                                                    className="h-8 px-3"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg text-foreground">{item.ticker.replace(".KS", "")}</span>
                                                    {hasData && (
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${profitBg} ${profitColor}`}>
                                                            {isProfit ? '▲' : '▼'} {(Math.floor(Math.abs(pnlPercent) * 100) / 100).toFixed(2)}%
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    <span className="font-medium">{item.quantity}주</span>
                                                    <span className="mx-1">·</span>
                                                    <span>평단 {currencySymbol}{item.avg_price.toLocaleString()}</span>
                                                    {hasData && currentPrice && (
                                                        <>
                                                            <span className="mx-1">→</span>
                                                            <span className={profitColor}>{currencySymbol}{currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <div className="font-bold text-lg">
                                                        {currencySymbol}{currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                    {hasData && (
                                                        <div className={`text-sm font-semibold ${profitColor}`}>
                                                            {isProfit ? '+' : ''}{currencySymbol}{pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => startEditing(item)}
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-white/50"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}

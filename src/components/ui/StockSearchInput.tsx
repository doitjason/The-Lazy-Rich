"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type StockResult = {
    ticker: string;
    name: string;
    exchange: string;
    type: string;
};

// Popular stocks to show when no search query
const POPULAR_STOCKS: StockResult[] = [
    { ticker: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ", type: "EQUITY" },
    { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "EQUITY" },
    { ticker: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", type: "EQUITY" },
    { ticker: "SPY", name: "S&P 500 ETF", exchange: "NYSE", type: "ETF" },
    { ticker: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", type: "EQUITY" },
    { ticker: "BTC-USD", name: "Bitcoin USD", exchange: "CCC", type: "CRYPTOCURRENCY" },
];

type StockSearchInputProps = {
    value: string;
    onChange: (ticker: string, name?: string) => void;
    placeholder?: string;
    className?: string;
};

export function StockSearchInput({
    value,
    onChange,
    placeholder = "종목을 검색하세요...",
    className,
}: StockSearchInputProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<StockResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedName, setSelectedName] = useState("");

    // Debounced search
    useEffect(() => {
        if (!query || query.length < 1) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.results || []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (stock: StockResult) => {
        onChange(stock.ticker, stock.name);
        setSelectedName(stock.name);
        setOpen(false);
        setQuery("");
    };

    // Show popular stocks when no query, otherwise show search results
    const displayStocks = query ? results : POPULAR_STOCKS;
    const groupHeading = query ? "검색 결과" : "인기 종목";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-12 bg-white/5 dark:bg-black/10 border-white/10 hover:bg-white/10 dark:hover:bg-black/20 hover:text-foreground text-left font-medium px-4",
                        className
                    )}
                >
                    {value ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-sm font-medium text-sky-500 bg-sky-500/10 border border-sky-500/50 px-2 py-0.5 rounded-md shrink-0">
                                {value}
                            </span>
                            {selectedName && (
                                <span className="text-sm text-muted-foreground font-normal truncate">
                                    {selectedName}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="종목 검색 (예: samsung, AAPL)..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading ? (
                            <div className="py-6 text-center">
                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                            </div>
                        ) : displayStocks.length === 0 ? (
                            <CommandEmpty>
                                결과를 찾을 수 없습니다.
                            </CommandEmpty>
                        ) : (
                            <CommandGroup heading={groupHeading}>
                                {displayStocks.map((stock) => (
                                    <CommandItem
                                        key={stock.ticker}
                                        value={stock.ticker}
                                        onSelect={() => handleSelect(stock)}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 shrink-0",
                                                value === stock.ticker ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{stock.ticker}</span>
                                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    {stock.exchange}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground truncate block">
                                                {stock.name}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

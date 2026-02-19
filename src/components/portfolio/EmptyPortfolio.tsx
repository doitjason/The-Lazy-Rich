"use client";

import { Wallet, Plus, ArrowRight, Scale, CloudSun, Rocket, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PortfolioItem } from "@/store/usePortfolioStore";

interface EmptyPortfolioProps {
    onAdd: () => void;
    onSelectPreset?: (items: PortfolioItem[]) => void;
}

export function EmptyPortfolio({ onAdd, onSelectPreset }: EmptyPortfolioProps) {

    // Dummy Preset Data Generator
    const createPreset = (type: '6040' | 'allWeather' | 'tech'): PortfolioItem[] => {
        const base = { user_id: 'guest', created_at: new Date().toISOString() };
        // random ID generator
        const id = () => Math.random().toString(36).substr(2, 9);

        switch (type) {
            case '6040':
                return [
                    { ...base, id: id(), ticker: 'SPY', quantity: 60, avg_price: 500 }, // 60% Stock
                    { ...base, id: id(), ticker: 'BND', quantity: 400, avg_price: 75 }, // 40% Bond (approx value match logic needed but keeping simple quantity)
                ];
            case 'allWeather':
                return [
                    { ...base, id: id(), ticker: 'VTI', quantity: 30, avg_price: 240 }, // 30% Stocks
                    { ...base, id: id(), ticker: 'TLT', quantity: 40, avg_price: 95 },  // 40% Long Term Bonds
                    { ...base, id: id(), ticker: 'IEF', quantity: 15, avg_price: 95 },  // 15% Intermediate Bonds
                    { ...base, id: id(), ticker: 'GLD', quantity: 7.5, avg_price: 200 }, // 7.5% Gold
                    { ...base, id: id(), ticker: 'DBC', quantity: 7.5, avg_price: 22 },  // 7.5% Commodities
                ];
            case 'tech':
                return [
                    { ...base, id: id(), ticker: 'QQQ', quantity: 50, avg_price: 440 },
                    { ...base, id: id(), ticker: 'NVDA', quantity: 10, avg_price: 900 },
                    { ...base, id: id(), ticker: 'MSFT', quantity: 20, avg_price: 420 },
                    { ...base, id: id(), ticker: 'AAPL', quantity: 30, avg_price: 180 },
                ];
            default:
                return [];
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            className="flex flex-col items-center justify-center min-h-[600px] p-6 relative group"
        >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-teal-500/5 to-transparent rounded-3xl blur-3xl -z-10" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-2xl w-full">
                {/* Glowing Icon Container */}
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                        <Wallet className="h-8 w-8 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                        투자를 시작해보세요
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto">
                        자산을 추가하고 나만의 포트폴리오를 완성해보세요.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 w-full">
                    <Button
                        onClick={onAdd}
                        size="lg"
                        className="group relative px-8 py-6 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-emerald-500/40 border border-white/10"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            직접 자산 추가하기 <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                        {/* Button Glow */}
                        <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-50 transition-opacity" />
                    </Button>

                    {/* Divider */}
                    <div className="relative py-4 w-full max-w-sm flex items-center justify-center">
                        <div className="h-px bg-white/10 w-full absolute" />
                        <span className="bg-[#0c0c0e] px-2 text-xs text-muted-foreground relative z-10 font-medium">또는 유명 포트폴리오 체험하기</span>
                    </div>

                    {/* Preset Cards */}
                    {onSelectPreset && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelectPreset(createPreset('6040'))}
                                className="flex flex-col items-center p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all group/card relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 group-hover/card:scale-110 transition-transform duration-300">
                                    <Scale className="h-5 w-5 text-emerald-400" />
                                </div>
                                <h3 className="font-bold text-sm text-foreground mb-1">60/40 포트폴리오</h3>
                                <p className="text-[11px] text-muted-foreground">주식 60% + 채권 40%<br />전통적인 자산배분</p>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelectPreset(createPreset('allWeather'))}
                                className="flex flex-col items-center p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all group/card relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 group-hover/card:scale-110 transition-transform duration-300">
                                    <CloudSun className="h-5 w-5 text-emerald-400" />
                                </div>
                                <h3 className="font-bold text-sm text-foreground mb-1">올웨더 포트폴리오</h3>
                                <p className="text-[11px] text-muted-foreground">4계절 내내 견고한<br />레이달리오의 전략</p>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelectPreset(createPreset('tech'))}
                                className="flex flex-col items-center p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/30 transition-all group/card relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-3 group-hover/card:scale-110 transition-transform duration-300">
                                    <Rocket className="h-5 w-5 text-purple-400" />
                                </div>
                                <h3 className="font-bold text-sm text-foreground mb-1">미국 기술주 성장형</h3>
                                <p className="text-[11px] text-muted-foreground">나스닥 우량주 중심<br />고수익 추구 전략</p>
                            </motion.button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                    <Info className="h-3 w-3" />
                    <span>체험용 데이터입니다. 내역을 저장하려면 로그인이 필요합니다.</span>
                </div>

            </div>
        </motion.div>
    );
}

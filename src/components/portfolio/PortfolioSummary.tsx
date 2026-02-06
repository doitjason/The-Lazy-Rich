"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PORTFOLIO_DATA } from "@/lib/dummy-data";
import { motion } from "framer-motion";

export function PortfolioSummary() {
    // Transform asset data for Pie Chart
    const assetAllocation = [
        { name: "Crypto", value: PORTFOLIO_DATA.assets.filter(a => a.type === 'crypto').reduce((sum, a) => sum + (a.amount * a.price), 0), color: "#F7931A" },
        { name: "Stocks", value: PORTFOLIO_DATA.assets.filter(a => a.type === 'stock').reduce((sum, a) => sum + (a.amount * a.price), 0), color: "#8B5CF6" },
        { name: "Cash", value: PORTFOLIO_DATA.assets.filter(a => a.type === 'cash').reduce((sum, a) => sum + (a.amount * a.price), 0), color: "#10B981" },
    ];

    const totalValue = PORTFOLIO_DATA.totalBalance;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                <CardHeader className="pb-2">
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                        Total Net Worth
                    </p>
                    <div className="flex items-baseline justify-between">
                        <CardTitle className="text-4xl font-bold text-primary">
                            ${totalValue.toLocaleString()}
                        </CardTitle>
                        <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${PORTFOLIO_DATA.dailyChange >= 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                            {PORTFOLIO_DATA.dailyChange >= 0 ? '+' : ''}${PORTFOLIO_DATA.dailyChange.toLocaleString()} ({PORTFOLIO_DATA.dailyChangePercent}%)
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={assetAllocation}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {assetAllocation.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-muted-foreground">Assets</span>
                            <span className="font-bold">100%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                        {assetAllocation.map((item) => (
                            <div key={item.name} className="flex flex-col items-center p-2 rounded-lg bg-white/40 dark:bg-white/5 border border-white/10">
                                <span className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: item.color }} />
                                <span className="text-[10px] text-muted-foreground uppercase">{item.name}</span>
                                <span className="text-xs font-semibold">${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

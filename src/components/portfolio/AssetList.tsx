"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PORTFOLIO_DATA } from "@/lib/dummy-data";
import { motion } from "framer-motion";

export function AssetList() {
    const assets = PORTFOLIO_DATA.assets;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-semibold">Your Assets</h3>
                <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-3">
                {assets.map((asset, index) => (
                    <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <Card className="flex items-center justify-between p-4 border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-sm hover:bg-white/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 text-lg shadow-sm">
                                    {/* Simple icon mapping based on ticker for demo */}
                                    {asset.ticker === 'BTC' ? '₿' :
                                        asset.ticker === 'ETH' ? 'Ξ' :
                                            asset.ticker === 'USD' ? '$' :
                                                asset.ticker[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{asset.ticker}</p>
                                    <p className="text-xs text-muted-foreground">{asset.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-sm">${(asset.amount * asset.price).toLocaleString()}</p>
                                <div className="flex items-center justify-end gap-1">
                                    <span className="text-xs text-muted-foreground">{asset.amount} {asset.ticker}</span>
                                    <span className={asset.change24h >= 0 ? "text-xs text-green-500" : "text-xs text-red-500"}>
                                        ({asset.change24h > 0 ? "+" : ""}{asset.change24h}%)
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

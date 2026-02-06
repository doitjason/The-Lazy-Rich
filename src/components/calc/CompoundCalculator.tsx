"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CompoundCalculator() {
    return (
        <div className="space-y-6">
            <Card className="border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-xl font-medium">Compound Interest</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Visualize the power of compound interest over time.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Initial ($)</label>
                            <Input
                                type="number"
                                placeholder="10000"
                                className="bg-white/50 dark:bg-black/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Monthly ($)</label>
                            <Input
                                type="number"
                                placeholder="500"
                                className="bg-white/50 dark:bg-black/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium">Interest Rate (%)</label>
                        <Input
                            type="number"
                            placeholder="7"
                            className="bg-white/50 dark:bg-black/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-medium">Period (Years)</label>
                            <span className="text-xs font-bold text-primary">10 Years</span>
                        </div>
                        {/* Slider placeholder - using basic range input for UI Day 3 */}
                        <input
                            type="range"
                            min="1"
                            max="50"
                            className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/20 bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-lg">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Estimated Final Amount</p>
                        <h2 className="text-4xl font-bold text-primary">$104,248</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 dark:border-white/5">
                        <div>
                            <p className="text-xs text-muted-foreground">Total Contributed</p>
                            <p className="text-lg font-semibold">$50,000</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Interest Earned</p>
                            <p className="text-lg font-semibold text-green-500">+$54,248</p>
                        </div>
                    </div>

                    <div className="h-32 w-full rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                        <p className="text-xs text-muted-foreground text-center">
                            Area Chart Placeholder<br />(Recharts - Day 8)
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

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
                    <CardTitle className="text-xl font-medium">복리 계산기</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        시간이 만드는 복리의 마법을 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium">초기 금액 ($)</label>
                            <Input
                                type="number"
                                placeholder="10000"
                                className="bg-white/50 dark:bg-black/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium">월 적립액 ($)</label>
                            <Input
                                type="number"
                                placeholder="500"
                                className="bg-white/50 dark:bg-black/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium">연 수익률 (%)</label>
                        <Input
                            type="number"
                            placeholder="7"
                            className="bg-white/50 dark:bg-black/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-medium">기간 (년)</label>
                            <span className="text-xs font-bold text-primary">10년</span>
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
                        <p className="text-sm font-medium text-muted-foreground">예상 최종 금액</p>
                        <h2 className="text-4xl font-bold text-primary">$104,248</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 dark:border-white/5">
                        <div>
                            <p className="text-xs text-muted-foreground">총 원금</p>
                            <p className="text-lg font-semibold">$50,000</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">이자 수익</p>
                            <p className="text-lg font-semibold text-green-500">+$54,248</p>
                        </div>
                    </div>

                    <div className="h-32 w-full rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                        <p className="text-xs text-muted-foreground text-center">
                            차트 영역<br />(Day 8 구현 예정)
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

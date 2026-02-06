"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function RegretCalculator() {
    return (
        <div className="space-y-6">
            <Card className="border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-xl font-medium">했제 계산기</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        그때 투자했더라면 지금 얼마일지 확인해보세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">종목 (티커)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="종목 검색 (예: AAPL)"
                                className="pl-9 bg-white/50 dark:bg-black/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">투자 금액 ($)</label>
                        <Input
                            type="number"
                            placeholder="1000"
                            className="bg-white/50 dark:bg-black/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">기간</label>
                        <div className="flex gap-2">
                            {["1년", "3년", "5년", "10년"].map((period) => (
                                <Button
                                    key={period}
                                    variant="glass"
                                    size="sm"
                                    className="flex-1"
                                >
                                    {period}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/20 bg-white/80 dark:bg-black/60 backdrop-blur-xl shadow-lg">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">현재 가치</p>
                        <h2 className="text-4xl font-bold text-primary">$72,442.18</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 dark:border-white/5">
                        <div>
                            <p className="text-xs text-muted-foreground">수익률</p>
                            <p className="text-lg font-semibold text-green-500">+7,144%</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">총 수익금</p>
                            <p className="text-lg font-semibold text-green-500">+$71,442</p>
                        </div>
                    </div>

                    <div className="h-32 w-full rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                        <p className="text-xs text-muted-foreground text-center">
                            차트 영역<br />(Day 8 구현 예정)
                        </p>
                    </div>
                </CardContent>
            </Card>

            <p className="text-[10px] text-center text-muted-foreground px-4">
                이 결과는 시뮬레이션이며 미래의 수익을 보장하지 않습니다. FOMO에 빠지지 마세요.
            </p>
        </div>
    );
}

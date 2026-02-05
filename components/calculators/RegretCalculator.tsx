"use client";

import { useState } from "react";
import StockChart from "@/components/charts/StockChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { useStockHistory } from "@/hooks/useStockHistory";
// import { useToast } from "@/components/ui/use-toast";

export default function RegretCalculator() {
    const [ticker, setTicker] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState("");
    const [currency, setCurrency] = useState("USD");

    const { mutate: calculateRegret, isPending, data, isError, error } = useStockHistory();
    // const { toast } = useToast(); 

    const handleCalculate = () => {
        if (!ticker || !amount || !date) {
            alert("모든 필드를 입력해 주세요.");
            return;
        }
        calculateRegret({ ticker, startDate: date, amount: Number(amount) });
    };

    return (
        <div className="space-y-6">
            <Card className="glass-card w-full max-w-2xl mx-auto border-0">
                <CardHeader>
                    <CardTitle className="text-2xl font-serif">했제(Regret) 계산기</CardTitle>
                    <CardDescription>
                        &quot;그때 샀더라면...&quot; 과거의 선택을 숫자로 확인해보세요.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Ticker Input */}
                    <div className="space-y-2">
                        <Label htmlFor="ticker">주식 티커 (Ticker)</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="ticker"
                                placeholder="예: AAPL, NVDA, TSLA"
                                className="pl-9"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Amount Input */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">투자 금액</Label>
                            <div className="flex space-x-2">
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue placeholder="통화" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">$</SelectItem>
                                        <SelectItem value="KRW">₩</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="1000"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Date Input */}
                        <div className="space-y-2">
                            <Label htmlFor="date">시작 날짜</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 mt-4"
                        onClick={handleCalculate}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                계산 중...
                            </>
                        ) : (
                            "후회 비용 확인하기 😭"
                        )}
                    </Button>

                    {isError && (
                        <p className="text-sm text-destructive text-center font-medium">
                            {error?.message || "오류가 발생했습니다. 티커와 날짜를 확인해 주세요."}
                        </p>
                    )}

                </CardContent>
            </Card>

            {data && (
                <Card className="glass-card w-full max-w-2xl mx-auto border-0 animate-in fade-in-50 slide-in-from-bottom-5 duration-700">
                    <CardContent className="pt-6">
                        <StockChart
                            data={data.series}
                            title={`$${data.currentVal.toLocaleString()}`}
                            ticker={ticker}
                            percentage={data.percentage}
                        />
                        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                            <div className="p-4 bg-secondary/30 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">초기 투자금</p>
                                <p className="text-lg font-bold">${data.initialVal.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-primary/10 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">현재 가치</p>
                                <p className="text-xl font-bold text-primary">${data.currentVal.toLocaleString()}</p>
                            </div>
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            데이터 제공: Yahoo Finance. 실시간 데이터와 차이가 있을 수 있습니다.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

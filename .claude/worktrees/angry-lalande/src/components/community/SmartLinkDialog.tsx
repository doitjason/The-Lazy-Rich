"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { StockSearchInput } from "@/components/ui/StockSearchInput";
import { SmartLinkCalcId } from "@/lib/community";
import { Trash2, Plus, Calculator, TrendingUp, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartLinkDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (link: string) => void;
    initialCalcId?: SmartLinkCalcId;
}

export function SmartLinkDialog({
    isOpen,
    onClose,
    onInsert,
    initialCalcId = "regret",
}: SmartLinkDialogProps) {
    const [calcId, setCalcId] = useState<SmartLinkCalcId>(initialCalcId);

    // Sync state when dialog opens with a specific calculator type
    useEffect(() => {
        if (isOpen && initialCalcId) {
            setCalcId(initialCalcId);
        }
    }, [isOpen, initialCalcId]);


    // Regret V1 State
    const [v1Ticker, setV1Ticker] = useState("");
    const [v1Period, setV1Period] = useState(10);

    // Regret V2 State
    const [v2Assets, setV2Assets] = useState<{ ticker: string; weight: number }[]>([
        { ticker: "", weight: 100 },
    ]);
    const [v2Period, setV2Period] = useState(10);

    // Compound State
    const [compInitial, setCompInitial] = useState(1000);
    const [compMonthly, setCompMonthly] = useState(100);
    const [compRate, setCompRate] = useState(10);
    const [compYears, setCompYears] = useState(10);

    const handleInsert = () => {
        let params = "";
        if (calcId === "regret") {
            if (!v1Ticker) return;
            params = `ticker=${v1Ticker}&period=${v1Period}Y`;
        } else if (calcId === "regret-v2") {
            const validAssets = v2Assets.filter((a) => a.ticker && a.weight > 0);
            if (validAssets.length === 0) return;
            const assetStr = validAssets.map((a) => `${a.ticker},${a.weight}`).join(";");
            params = `assets=${assetStr}&period=${v2Period}Y`;
        } else if (calcId === "compound") {
            params = `initial=${compInitial}&monthly=${compMonthly}&rate=${compRate}&years=${compYears}`;
        }

        onInsert(`{link:calc:${calcId}:${params}}`);
        onClose();
    };

    const addV2Asset = () => {
        setV2Assets([...v2Assets, { ticker: "", weight: 0 }]);
    };

    const removeV2Asset = (index: number) => {
        if (v2Assets.length <= 1) return;
        setV2Assets(v2Assets.filter((_, i) => i !== index));
    };

    const updateV2Asset = (index: number, field: "ticker" | "weight", value: string | number) => {
        const newAssets = [...v2Assets];
        newAssets[index] = { ...newAssets[index], [field]: value };
        setV2Assets(newAssets);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] overflow-hidden bg-white/95 dark:bg-[#181a20]/95 backdrop-blur-xl border-white/20 dark:border-white/10 rounded-3xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Calculator className="h-5 w-5" />
                        </span>
                        게시글에 계산기 링크 삽입
                    </DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl mb-4 border border-border/10">
                    <button
                        onClick={() => setCalcId("regret")}
                        className={cn(
                            "flex-1 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                            calcId === "regret" 
                                ? "bg-white dark:bg-white/10 shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10" 
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <TrendingUp className="h-3.5 w-3.5" />
                        했제 계산기 V1
                    </button>
                    <button
                        onClick={() => setCalcId("regret-v2")}
                        className={cn(
                            "flex-1 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                            calcId === "regret-v2" 
                                ? "bg-white dark:bg-white/10 shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10" 
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <PieChart className="h-3.5 w-3.5" />
                        했제 계산기 V2
                    </button>
                    <button
                        onClick={() => setCalcId("compound")}
                        className={cn(
                            "flex-1 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                            calcId === "compound" 
                                ? "bg-white dark:bg-white/10 shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10" 
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Calculator className="h-3.5 w-3.5" />
                        자유 계산기
                    </button>
                </div>

                <div className="space-y-6 py-2 max-h-[400px] overflow-y-auto px-1 custom-scrollbar">
                    {calcId === "regret" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[13px] font-bold ml-1">종목 선택</Label>
                                <StockSearchInput 
                                    value={v1Ticker} 
                                    onChange={(ticker) => setV1Ticker(ticker)}
                                    placeholder="티커 검색 (예: AAPL, 삼성전자)"
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end ml-1">
                                    <Label className="text-[13px] font-bold">투자 시점 (과거)</Label>
                                    <span className="text-sm font-bold text-primary">{v1Period}년 전</span>
                                </div>
                                <Slider
                                    value={[v1Period]}
                                    max={40}
                                    min={1}
                                    step={1}
                                    onValueChange={(vals) => setV1Period(vals[0])}
                                    className="py-2"
                                />
                            </div>
                        </div>
                    )}

                    {calcId === "regret-v2" && (
                        <div className="space-y-5">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center ml-1">
                                    <Label className="text-[13px] font-bold">구성 종목 및 비중</Label>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={addV2Asset}
                                        className="h-7 px-2 text-xs font-bold text-primary hover:text-primary hover:bg-primary/5"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" /> 추가
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {v2Assets.map((asset, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <div className="flex-1">
                                                <StockSearchInput
                                                    value={asset.ticker}
                                                    onChange={(ticker) => updateV2Asset(index, "ticker", ticker)}
                                                    placeholder="티커"
                                                />
                                            </div>
                                            <div className="w-20 relative">
                                                <Input
                                                    type="number"
                                                    value={asset.weight}
                                                    onChange={(e) => updateV2Asset(index, "weight", Number(e.target.value))}
                                                    className="pr-6 text-right font-bold text-xs"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeV2Asset(index)}
                                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                disabled={v2Assets.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end ml-1">
                                    <Label className="text-[13px] font-bold">투자 시점</Label>
                                    <span className="text-sm font-bold text-primary">{v2Period}년 전</span>
                                </div>
                                <Slider
                                    value={[v2Period]}
                                    max={40}
                                    min={1}
                                    step={1}
                                    onValueChange={(vals) => setV2Period(vals[0])}
                                    className="py-2"
                                />
                            </div>
                        </div>
                    )}

                    {calcId === "compound" && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[13px] font-bold ml-1">초기 자산</Label>
                                    <Input
                                        type="number"
                                        value={compInitial}
                                        onChange={(e) => setCompInitial(Number(e.target.value))}
                                        className="h-10 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[13px] font-bold ml-1">월 적립금</Label>
                                    <Input
                                        type="number"
                                        value={compMonthly}
                                        onChange={(e) => setCompMonthly(Number(e.target.value))}
                                        className="h-10 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end ml-1">
                                    <Label className="text-[13px] font-bold">연 목표 수익률</Label>
                                    <span className="text-sm font-bold text-primary">{compRate}%</span>
                                </div>
                                <Slider
                                    value={[compRate]}
                                    max={30}
                                    min={0}
                                    step={0.5}
                                    onValueChange={(vals) => setCompRate(vals[0])}
                                    className="py-2"
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end ml-1">
                                    <Label className="text-[13px] font-bold">시뮬레이션 기간</Label>
                                    <span className="text-sm font-bold text-primary">{compYears}년</span>
                                </div>
                                <Slider
                                    value={[compYears]}
                                    max={50}
                                    min={1}
                                    step={1}
                                    onValueChange={(vals) => setCompYears(vals[0])}
                                    className="py-2"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-2">
                    <Button 
                        onClick={handleInsert} 
                        className="w-full h-12 rounded-2xl text-base font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-[0.98]"
                    >
                        본문에 링크 삽입하기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

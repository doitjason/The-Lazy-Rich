"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { usePortfolioStore, PortfolioItem } from "@/store/usePortfolioStore";

interface EditStockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: PortfolioItem | null;
}

export function EditStockDialog({ open, onOpenChange, item }: EditStockDialogProps) {
    const { updateItem, loading } = usePortfolioStore();

    const [quantity, setQuantity] = useState("");
    const [avgPrice, setAvgPrice] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (item) {
            setQuantity(item.quantity.toString());
            setAvgPrice(item.avg_price.toString());
        }
    }, [item]);

    const handleSave = async () => {
        if (!item || !quantity || !avgPrice) {
            setError("모든 필드를 입력해주세요.");
            return;
        }

        setError(null);
        try {
            const success = await updateItem(
                item.id,
                parseFloat(quantity),
                parseFloat(avgPrice)
            );

            if (success) {
                onOpenChange(false);
            } else {
                setError("수정에 실패했습니다. 다시 시도해주세요.");
            }
        } catch (e) {
            setError("오류가 발생했습니다.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-border rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">종목 수정: {item?.ticker?.replace(".KS", "")}</DialogTitle>
                    <DialogDescription>
                        보유 수량이나 평균 단가를 변경하여 포트폴리오를 관리하세요.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">수량</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="bg-slate-50 dark:bg-white/5 border-border"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">평균 단가 ($)</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={avgPrice}
                                onChange={(e) => setAvgPrice(e.target.value)}
                                className="bg-slate-50 dark:bg-white/5 border-border"
                            />
                        </div>
                    </div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                    >
                        {loading ? "저장 중..." : "수정하기"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StockSearchInput } from "@/components/ui/StockSearchInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { trackMetaEvent } from "@/lib/analytics";

interface AddStockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddStockDialog({ open, onOpenChange }: AddStockDialogProps) {
    const { user } = useAuth();
    const { addItem, loading } = usePortfolioStore();

    const [newTicker, setNewTicker] = useState("");
    const [newQuantity, setNewQuantity] = useState("");
    const [newAvgPrice, setNewAvgPrice] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!user?.id || !newTicker || !newQuantity || !newAvgPrice) {
            setError("모든 필드를 입력해주세요.");
            return;
        }

        setError(null);
        try {
            const success = await addItem(
                user.id,
                newTicker,
                parseFloat(newQuantity),
                parseFloat(newAvgPrice)
            );

            if (success) {
                // 종목 추가 성공 트래킹 (P0 #3)
                trackMetaEvent('AddToCart', {
                    content_name: newTicker,
                    content_type: 'stock',
                    content_ids: [newTicker],
                });

                setNewTicker("");
                setNewQuantity("");
                setNewAvgPrice("");
                onOpenChange(false);
            } else {
                setError("추가에 실패했습니다. 다시 시도해주세요.");
            }
        } catch (e) {
            setError("오류가 발생했습니다.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>새 종목 추가</DialogTitle>
                    <DialogDescription>
                        포트폴리오에 추가할 주식 종목과 수량, 평균 단가를 입력하세요.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">종목 검색</label>
                        <StockSearchInput
                            value={newTicker}
                            onChange={(ticker) => setNewTicker(ticker)}
                            placeholder="예: AAPL, MSFT"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">수량</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={newQuantity}
                                onChange={(e) => setNewQuantity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">평균 단가 ($)</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={newAvgPrice}
                                onChange={(e) => setNewAvgPrice(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button onClick={handleAdd} disabled={loading}>
                        {loading ? "저장 중..." : "추가하기"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

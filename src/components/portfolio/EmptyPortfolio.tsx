"use client";

import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyPortfolio() {
    return (
        <Card className="flex flex-col items-center justify-center p-8 text-center border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md min-h-[400px]">
            <CardContent className="flex flex-col items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold">Start Your Wealth Journey</h2>
                    <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                        Add your first asset to track your net worth.
                    </p>
                </div>
                <Button className="w-full max-w-[200px]" size="lg">
                    Add Asset
                </Button>
            </CardContent>
        </Card>
    );
}

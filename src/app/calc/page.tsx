"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegretCalculator } from "@/components/calc/RegretCalculator";
import { CompoundCalculator } from "@/components/calc/CompoundCalculator";
import { PortfolioRegretCalculator } from "@/components/calc/PortfolioRegretCalculator";

export default function CalcPage() {
    return (
        <div className="flex min-h-screen flex-col p-4 space-y-6 max-w-md mx-auto">
            <header className="pt-8 pb-2">
                <h1 className="text-3xl font-bold tracking-tight">투자 계산기</h1>
                <p className="text-muted-foreground">당신의 투자를 분석하고 계획하세요.</p>
            </header>

            <Tabs defaultValue="regret" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="regret">했제 계산기 V1</TabsTrigger>
                    <TabsTrigger value="regret-v2">했제 계산기 V2</TabsTrigger>
                    <TabsTrigger value="compound">자유 계산기</TabsTrigger>
                </TabsList>
                <TabsContent value="regret" className="mt-0">
                    <RegretCalculator />
                </TabsContent>
                <TabsContent value="regret-v2" className="mt-0">
                    <PortfolioRegretCalculator />
                </TabsContent>
                <TabsContent value="compound" className="mt-0">
                    <CompoundCalculator />
                </TabsContent>
            </Tabs>
        </div>
    );
}

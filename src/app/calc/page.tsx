"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegretCalculator } from "@/components/calc/RegretCalculator";
import { CompoundCalculator } from "@/components/calc/CompoundCalculator";

export default function CalcPage() {
    return (
        <div className="flex min-h-screen flex-col p-4 space-y-6 max-w-md mx-auto">
            <header className="pt-8 pb-2">
                <h1 className="text-3xl font-bold tracking-tight">Financial Tools</h1>
                <p className="text-muted-foreground">Analyze and plan your investment.</p>
            </header>

            <Tabs defaultValue="regret" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="regret">Investment Regret</TabsTrigger>
                    <TabsTrigger value="compound">Compound</TabsTrigger>
                </TabsList>
                <TabsContent value="regret" className="mt-0">
                    <RegretCalculator />
                </TabsContent>
                <TabsContent value="compound" className="mt-0">
                    <CompoundCalculator />
                </TabsContent>
            </Tabs>
        </div>
    );
}

"use client";

import { EmptyPortfolio } from "@/components/portfolio/EmptyPortfolio";
import { PortfolioSummary } from "@/components/portfolio/PortfolioSummary";
import { AssetList } from "@/components/portfolio/AssetList";
import { PORTFOLIO_DATA } from "@/lib/dummy-data";

export default function PortfolioPage() {
    const hasAssets = PORTFOLIO_DATA.assets.length > 0;

    return (
        <div className="flex min-h-screen flex-col p-4 max-w-md mx-auto space-y-6 pb-24">
            <header className="pt-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
                    <p className="text-muted-foreground">Track your wealth.</p>
                </div>
            </header>

            {hasAssets ? (
                <div className="space-y-8">
                    <PortfolioSummary />
                    <AssetList />
                </div>
            ) : (
                <div className="mt-8 animate-in zoom-in-95 duration-500">
                    <EmptyPortfolio />
                </div>
            )}
        </div>
    );
}

"use client";

import { QuoteCard } from "@/components/insights/QuoteCard";
import { NewsFeed } from "@/components/insights/NewsFeed";

export default function InsightsPage() {
    return (
        <div className="flex min-h-screen flex-col p-4 max-w-md mx-auto space-y-8 pb-24">
            <header className="pt-8">
                <h1 className="text-3xl font-bold tracking-tight">Daily Insights</h1>
                <p className="text-muted-foreground">Stay ahead of the market.</p>
            </header>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                <QuoteCard />
                <NewsFeed />
            </div>
        </div>
    );
}


import { NextResponse } from "next/server";
import { getMentorMarketContext } from "@/lib/market-data";

export async function GET() {
    try {
        const sage = await getMentorMarketContext("sage", ["AAPL", "KO"]);
        const hero = await getMentorMarketContext("hero", ["NVDA", "AMD"]);
        const speculator = await getMentorMarketContext("speculator", ["TSLA"]);
        const father = await getMentorMarketContext("father", ["SPY"]);
        const architect = await getMentorMarketContext("architect", []);

        return NextResponse.json({
            sage,
            hero,
            speculator,
            father,
            architect
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

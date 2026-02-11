
import { NextResponse } from "next/server";
import { getPersonaMarketContext } from "@/lib/market-data";

export async function GET() {
    try {
        const sage = await getPersonaMarketContext("sage", ["AAPL", "KO"]);
        const hero = await getPersonaMarketContext("hero", ["NVDA", "AMD"]);
        const speculator = await getPersonaMarketContext("speculator", ["TSLA"]);
        const father = await getPersonaMarketContext("father", ["SPY"]);
        const architect = await getPersonaMarketContext("architect", []);

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

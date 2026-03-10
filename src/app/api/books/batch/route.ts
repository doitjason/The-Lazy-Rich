import { NextResponse } from "next/server";
import { fetchNaverBook } from "@/lib/naver-books";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const queriesParam = searchParams.get("queries");

        if (!queriesParam) {
            return NextResponse.json({ error: "queries parameter is required" }, { status: 400 });
        }

        const queries = queriesParam.split(",").filter(q => q.trim() !== "");

        if (queries.length === 0) {
            return NextResponse.json({ error: "no valid queries provided" }, { status: 400 });
        }

        const bookMap = await fetchBatchBooks(queries);

        return NextResponse.json(bookMap, {
            headers: {
                "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
            },
        });
    } catch (error) {
        console.error("[API] Batch book fetch error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { queries } = await request.json();

        if (!queries || !Array.isArray(queries) || queries.length === 0) {
            return NextResponse.json({ error: "queries array is required" }, { status: 400 });
        }

        const bookMap = await fetchBatchBooks(queries);
        return NextResponse.json(bookMap);
    } catch (error) {
        console.error("[API] Batch book fetch error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

async function fetchBatchBooks(queries: string[]) {
    // Fetch all books in parallel on the server
    const results = await Promise.all(
        queries.map(async (query: string) => {
            const data = await fetchNaverBook(query);
            return { query, data };
        })
    );

    // Build a map: query -> book data
    const bookMap: Record<string, { image?: string; author?: string } | null> = {};
    for (const { query, data } of results) {
        bookMap[query] = data ? { image: data.image, author: data.author } : null;
    }
    return bookMap;
}

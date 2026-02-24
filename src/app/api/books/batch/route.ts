import { NextResponse } from "next/server";
import { fetchNaverBook } from "@/lib/naver-books";

export async function POST(request: Request) {
    try {
        const { queries } = await request.json();

        if (!queries || !Array.isArray(queries) || queries.length === 0) {
            return NextResponse.json({ error: "queries array is required" }, { status: 400 });
        }

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

        return NextResponse.json(bookMap);
    } catch (error) {
        console.error("Batch book fetch error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

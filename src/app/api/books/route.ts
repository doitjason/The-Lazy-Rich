import { NextResponse } from "next/server";
import { fetchNaverBook } from "@/lib/naver-books";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
        return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const data = await fetchNaverBook(query);
    if (!data) {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json(data);
}

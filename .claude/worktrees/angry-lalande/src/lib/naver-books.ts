export interface NaverBookData {
    title: string;
    link: string;
    image: string;
    author: string;
    discount: string;
    publisher: string;
    pubdate: string;
    isbn: string;
    description: string;
}

export async function fetchNaverBook(isbnOrTitle: string): Promise<NaverBookData | null> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error("Naver API keys missing");
        return null;
    }

    try {
        const res = await fetch(`https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(isbnOrTitle)}&display=1`, {
            headers: {
                "X-Naver-Client-Id": clientId,
                "X-Naver-Client-Secret": clientSecret,
            },
            next: { revalidate: 86400 } // Cache for 24 hours
        });

        if (!res.ok) {
            console.error("Naver API error:", res.status);
            return null;
        }

        const data = await res.json();
        if (data.items && data.items.length > 0) {
            return data.items[0] as NaverBookData;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch Naver book:", error);
        return null;
    }
}

import { RECOMMENDED_BOOKS } from "@/data/books";
import { fetchNaverBook } from "@/lib/naver-books";
import Link from "next/link";
import Image from "next/image";

interface RelatedBooksSectionProps {
    bookIds: string[];
}

export async function RelatedBooksSection({ bookIds }: RelatedBooksSectionProps) {
    if (!bookIds || bookIds.length === 0) return null;

    const baseRelatedBooks = RECOMMENDED_BOOKS.filter((b) => bookIds.includes(b.id));

    const relatedBooks = await Promise.all(
        baseRelatedBooks.map(async (book) => {
            // Priority 1: Hardcoded imgUrl
            if (book.imgUrl) return { ...book, coverUrl: book.imgUrl };

            // Priority 2: Naver API
            if (book.naverQuery) {
                try {
                    const naverData = await fetchNaverBook(book.naverQuery);
                    if (naverData?.image) {
                        return { ...book, coverUrl: naverData.image };
                    }
                } catch (e) {
                    console.error("Book cover fetch error:", e);
                }
            }

            return { ...book, coverUrl: null };
        })
    );

    return (
        <div className="pt-4 animate-in fade-in duration-700">
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex items-center justify-center">
                    <span className="absolute w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                    <span className="relative w-2 h-5 bg-emerald-500 rounded-full" />
                </div>
                <h3 className="font-black text-base text-gray-900 dark:text-white tracking-tight">📚 관련 추천 도서</h3>
            </div>
            <div className="space-y-3">
                {relatedBooks.map((book) => (
                    <Link key={book.id} href={`/books/${book.id}`} className="block">
                        <div className="bg-gray-50 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex gap-4 items-center group hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                            <div className="w-10 h-14 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 text-lg overflow-hidden relative">
                                {book.coverUrl ? (
                                    <Image 
                                        src={book.coverUrl} 
                                        alt={book.title} 
                                        width={40}
                                        height={56}
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    "📖"
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-700 dark:text-white/80 truncate group-hover:text-black dark:group-hover:text-white transition-colors">{book.title}</p>
                                <p className="text-[11px] text-gray-400 dark:text-white/30 font-medium mt-0.5">{book.author}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export function RelatedBooksSkeleton() {
    return (
        <div className="pt-4 opacity-50">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-5 bg-gray-200 dark:bg-white/10 rounded-full" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-3">
                {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl animate-pulse" />
                ))}
            </div>
        </div>
    );
}

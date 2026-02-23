import { RECOMMENDED_BOOKS } from "@/data/books";
import { notFound } from "next/navigation";
import { Info, ExternalLink } from "lucide-react";
import { Metadata } from "next";
import { BackButton } from "@/components/insights/BackButton";
import { fetchNaverBook } from "@/lib/naver-books";

interface PageProps {
    params: Promise<{
        id: string;
    }>
}

// Generate Static Params for SEO (App Router)
export async function generateStaticParams() {
    return RECOMMENDED_BOOKS.map((book) => ({
        id: book.id,
    }));
}

// Dynamic Metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const book = RECOMMENDED_BOOKS.find((b) => b.id === id);

    if (!book) return { title: 'Book Not Found' };

    // We optionally fetch from Naver API to keep OG images fresh, but metadata might be too slow.
    // However, since it's statically generated or cached, it's fine.
    let ogImage = book.imgUrl;
    if (book.naverQuery) {
        const naverData = await fetchNaverBook(book.naverQuery);
        if (naverData && naverData.image) {
            ogImage = naverData.image;
        }
    }

    return {
        title: `${book.title} 리뷰 | 올바른 장기투자`,
        description: book.description,
        openGraph: {
            title: book.title,
            description: book.description,
            images: [ogImage],
        },
    };
}

export default async function BookDetailPage({ params }: PageProps) {
    const { id } = await params;
    const book = RECOMMENDED_BOOKS.find((b) => b.id === id);

    if (!book) {
        return notFound();
    }

    // Fetch dynamic data from Naver API
    let coverImage = book.imgUrl;
    let authorName = book.author;
    if (book.naverQuery) {
        const naverData = await fetchNaverBook(book.naverQuery);
        if (naverData) {
            if (naverData.image) coverImage = naverData.image;
            if (naverData.author) authorName = naverData.author.replace(/\|/g, ", ");
        }
    }

    return (
        <div className="max-w-md mx-auto relative bg-[#0b0c10] min-h-screen pb-[160px] sm:border-x sm:border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] aspect-square bg-emerald-500/10 rounded-full blur-[100px] opacity-50 pointer-events-none" />

            {/* Top Navigation */}
            <header className="sticky top-0 z-40 bg-[#0b0c10]/70 backdrop-blur-2xl border-b border-white/10 px-4 py-3 flex items-center gap-3">
                <BackButton />
                <h1 className="text-base font-bold text-foreground flex-1 truncate">
                    {book.title}
                </h1>
            </header>

            {/* Affiliate Notice Banner - Anchored to the very top */}
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-3 flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed opacity-90 break-keep font-medium">
                    이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
                </p>
            </div>

            {/* Content */}
            <main className="px-5 py-6 space-y-10 relative z-10">
                {/* Book Header */}
                <div className="flex gap-6 items-center">
                    <div className="w-32 sm:w-36 flex-shrink-0 rounded-xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(16,185,129,0.4)] border border-white/20 relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none z-10" />
                        {coverImage ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    alt={book.title}
                                    src={coverImage}
                                    className="w-full h-auto object-cover aspect-[2/3] relative z-0"
                                />
                            </>
                        ) : (
                            <div className="w-full aspect-[2/3] bg-gradient-to-br from-emerald-900/40 to-gray-900/80 flex items-center justify-center">
                                <span className="text-5xl">📖</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col pt-2 pb-1">
                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2.5 inline-flex items-center w-max px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                            {book.tag}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black leading-tight text-white mb-2 decoration-emerald-500/30 underline underline-offset-4">
                            {book.title}
                        </h2>
                        <p className="text-sm sm:text-base text-emerald-500/80 font-bold">
                            {authorName}
                        </p>
                    </div>
                </div>

                {/* Editor's Review section */}
                <div className="pt-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex items-center justify-center">
                            <span className="absolute w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                            <span className="relative w-2 h-5 bg-emerald-500 rounded-full" />
                        </div>
                        <h3 className="font-black text-lg text-white tracking-tight">
                            에디터 인사이트
                        </h3>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
                        <p className="text-[15px] sm:text-[16px] text-white/80 leading-relaxed font-medium break-keep relative z-10 whitespace-pre-line">
                            {book.longDescription}
                        </p>
                    </div>
                </div>
            </main>

            {/* Sticky Bottom CTA */}
            {book.link && (
                <div className="fixed max-w-md mx-auto left-0 right-0 w-full bottom-16 p-4 pb-4 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/95 to-transparent z-50">
                    <a
                        href={book.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative w-full overflow-hidden rounded-2xl flex items-center justify-center transition-all active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 group-hover:opacity-90 transition-opacity" />
                        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-30 blur-xl group-hover:opacity-50 transition-opacity" />

                        <div className="relative px-6 py-4 flex items-center justify-center gap-3">
                            <span className="text-[17px] font-black tracking-tight text-white drop-shadow-md">
                                더 알아보기
                            </span>
                            <ExternalLink className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                    </a>
                </div>
            )}
        </div>
    );
}

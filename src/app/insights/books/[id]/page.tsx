import { RECOMMENDED_BOOKS } from "@/data/books";
import { notFound } from "next/navigation";
import { Info, ExternalLink } from "lucide-react";
import { Metadata } from "next";
import { BackButton } from "@/components/insights/BackButton";
import { fetchNaverBook } from "@/lib/naver-books";
import { SITE_CONFIG } from "@/lib/constants";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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

export default async function BookDetailPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { from } = await searchParams;
    
    // Determine back button props
    const isFromGuru = from === "guru";
    const backHref = isFromGuru ? "/guru" : undefined;
    const backText = isFromGuru ? "AI 멘토" : undefined;

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
        <div className="max-w-md mx-auto relative bg-white dark:bg-[#0b0c10] min-h-screen pb-[160px] sm:border-x sm:border-gray-200 dark:sm:border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Schema.org Review JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Review",
                        itemReviewed: {
                            "@type": "Book",
                            name: book.title,
                            author: {
                                "@type": "Person",
                                name: authorName,
                            },
                            ...(coverImage ? { image: coverImage } : {}),
                        },
                        author: {
                            "@type": "Organization",
                            name: "The Lazy Rich",
                            url: SITE_CONFIG.url,
                        },
                        publisher: {
                            "@type": "Organization",
                            name: "The Lazy Rich",
                            url: SITE_CONFIG.url,
                        },
                        reviewBody: book.description,
                        mainEntityOfPage: {
                            "@type": "WebPage",
                            "@id": `${SITE_CONFIG.url}/insights/books/${book.id}`,
                        },
                    }),
                }}
            />

            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] aspect-square bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[100px] opacity-50 pointer-events-none" />

            {/* Top Navigation */}
            <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#0b0c10]/70 backdrop-blur-2xl border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center gap-3">
                <BackButton href={backHref} text={backText} />
                <h1 className="text-base font-bold text-foreground flex-1 truncate">
                    {book.title}
                </h1>
            </header>

            {/* Affiliate Notice Banner - Anchored to the very top */}
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-500/20 px-4 py-3 flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed opacity-90 break-keep font-medium">
                    이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
                </p>
            </div>

            {/* Content */}
            <main className="px-5 py-6 space-y-8 relative z-10">
                {/* Book Header */}
                <div className="flex gap-6 items-center">
                    <div className="w-32 sm:w-36 flex-shrink-0 rounded-xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(16,185,129,0.4)] border border-gray-200 dark:border-white/20 relative">
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
                            <div className="w-full aspect-[2/3] bg-gradient-to-br from-emerald-100 dark:from-emerald-900/40 to-gray-200 dark:to-gray-900/80 flex items-center justify-center">
                                <span className="text-5xl">📖</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col pt-2 pb-1">
                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2.5 inline-flex items-center w-max px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 mr-2 animate-pulse" />
                            {book.tag}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black leading-tight text-gray-900 dark:text-white mb-2">
                            {book.title}
                        </h2>
                        <p className="text-sm sm:text-base text-emerald-600/80 dark:text-emerald-500/80 font-bold">
                            {authorName}
                        </p>
                    </div>
                </div>

                {/* Content Parsing & UI Rendering */}
                {(() => {
                    const lines = book.longDescription.split("\n");
                    let summaryLines: string[] = [];
                    let summaryEnd = 0;

                    let foundSummary = false;
                    let pointsCount = 0;
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line.startsWith("3줄 요약") || line.startsWith("3줄요약")) {
                            foundSummary = true;
                            continue;
                        }
                        if (foundSummary) {
                            if (/^\d\./.test(line)) {
                                summaryLines.push(line);
                                pointsCount++;
                            } else if (line !== "" && pointsCount >= 1) {
                                summaryEnd = i;
                                break;
                            }
                        }
                    }
                    if (summaryEnd === 0) summaryEnd = lines.length;

                    const bodyContent = lines.slice(summaryEnd).join("\n").trim();

                    return (
                        <>
                            {/* 3줄 요약 Card — Now perfectly aligned with Column UI */}
                            {summaryLines.length > 0 && (
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="relative flex items-center justify-center">
                                            <span className="absolute w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                                            <span className="relative w-2 h-5 bg-emerald-500 rounded-full" />
                                        </div>
                                        <h3 className="font-black text-base text-gray-900 dark:text-white tracking-tight">3줄 요약</h3>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden border-l-2 border-l-emerald-500/50">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/8 rounded-full blur-[30px] translate-x-6 -translate-y-6" />
                                        {summaryLines.map((line: string, i: number) => (
                                            <p key={i} className="text-[13px] sm:text-[14px] text-gray-600 dark:text-white/70 leading-relaxed font-medium relative z-10">
                                                {line}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Editor's Review section — body only */}
                            {bodyContent && (
                                <div className="pt-2">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="relative flex items-center justify-center">
                                            <span className="absolute w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                                            <span className="relative w-2 h-5 bg-emerald-500 rounded-full" />
                                        </div>
                                        <h3 className="font-black text-lg text-gray-900 dark:text-white tracking-tight">
                                            에디터 인사이트
                                        </h3>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
                                        <div className="relative z-10">
                                            {bodyContent.split("\n\n").filter((p: string) => p.trim()).map((para: string, i: number) => {
                                                const isHeader = para.length < 40 && !para.includes(".");
                                                if (isHeader) {
                                                    return (
                                                        <h4 key={i} className="flex items-center gap-3 mt-8 first:mt-0 mb-3">
                                                            <span className="w-1 h-6 bg-emerald-500 rounded-full flex-shrink-0" />
                                                            <span className="text-[17px] sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                                                {para}
                                                            </span>
                                                        </h4>
                                                    );
                                                }

                                                // Handle bullet lists
                                                const lines = para.split("\n");
                                                const hasBullets = lines.some((line: string) => line.trim().startsWith("- "));

                                                if (hasBullets) {
                                                    const introLines: string[] = [];
                                                    const bulletLines: string[] = [];
                                                    let inBullets = false;
                                                    for (const line of lines) {
                                                        if (line.trim().startsWith("- ")) {
                                                            inBullets = true;
                                                            bulletLines.push(line.trim().slice(2));
                                                        } else if (inBullets) {
                                                            bulletLines.push(line.trim());
                                                        } else {
                                                            introLines.push(line);
                                                        }
                                                    }
                                                    return (
                                                        <div key={i} className="mb-5 last:mb-0">
                                                            {introLines.length > 0 && (
                                                                <p className="text-[15px] sm:text-[16px] text-gray-600 dark:text-white/75 leading-[1.85] font-medium break-keep mb-3">
                                                                    {introLines.join(" ")}
                                                                </p>
                                                            )}
                                                            <ul className="space-y-2 pl-1">
                                                                {bulletLines.map((item: string, j: number) => (
                                                                    <li key={j} className="flex items-start gap-2.5 text-[15px] sm:text-[16px] text-gray-600 dark:text-white/75 leading-[1.7] font-medium">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 mt-[10px] flex-shrink-0" />
                                                                        <span>{item}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    );
                                                }

                                                const joinedText = lines.join(" ");
                                                return (
                                                    <p key={i} className="text-[15px] sm:text-[16px] text-gray-600 dark:text-white/75 leading-[1.85] font-medium break-keep mb-5 last:mb-0">
                                                        {joinedText}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
            </main>

            {/* Sticky Bottom CTA */}
            {book.link && (
                <div className="fixed max-w-md mx-auto left-0 right-0 w-full bottom-16 p-4 pb-4 bg-gradient-to-t from-white dark:from-[#0b0c10] via-white/95 dark:via-[#0b0c10]/95 to-transparent z-50">
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

import { COLUMNS, Column } from "@/data/columns";
import { RECOMMENDED_BOOKS } from "@/data/books";
import { notFound } from "next/navigation";
import { Clock, Tag } from "lucide-react";
import { Metadata } from "next";
import { BackButton } from "@/components/insights/BackButton";
import Link from "next/link";
import { fetchNaverBook } from "@/lib/naver-books";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

// Generate Static Params for SEO
export async function generateStaticParams() {
    return COLUMNS.map((col) => ({
        id: col.id,
    }));
}

// Dynamic Metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const column = COLUMNS.find((c) => c.id === id);

    if (!column) return { title: "Column Not Found" };

    return {
        title: `${column.title} | 올바른 장기투자`,
        description: column.subtitle,
        openGraph: {
            title: column.title,
            description: column.subtitle,
        },
    };
}

// Parse content into sections for ad insertion
function parseContentSections(content: string): { summary: string; sections: string[] } {
    const lines = content.split("\n");

    // First block = 3줄 요약 (up to first empty line after numbered items)
    let summaryEnd = 0;
    let foundSummary = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("3줄 요약") || lines[i].startsWith("3줄요약")) {
            foundSummary = true;
        }
        if (foundSummary && lines[i].trim() === "" && i > 3) {
            summaryEnd = i;
            break;
        }
    }

    const summary = lines.slice(0, summaryEnd).join("\n");
    const bodyContent = lines.slice(summaryEnd).join("\n").trim();

    // Split body into sections by double newline (paragraph breaks)
    const rawSections = bodyContent.split(/\n\n+/).filter((s) => s.trim());

    // Group into ~2-3 sections for ad placement
    const midpoint = Math.ceil(rawSections.length / 2);
    const sections = [
        rawSections.slice(0, midpoint).join("\n\n"),
        rawSections.slice(midpoint).join("\n\n"),
    ];

    return { summary, sections };
}

// Format body text with section headers
function FormattedContent({ text }: { text: string }) {
    const paragraphs = text.split("\n\n").filter((p) => p.trim());

    return (
        <>
            {paragraphs.map((para, i) => {
                // Detect section headers (short lines without periods that introduce a topic)
                const isHeader = para.length < 40 && !para.includes(".");

                if (isHeader) {
                    return (
                        <h3 key={i} className="flex items-center gap-3 mt-8 mb-3">
                            <span className="w-1 h-6 bg-emerald-500 rounded-full flex-shrink-0" />
                            <span className="text-[17px] sm:text-lg font-black text-white tracking-tight">
                                {para}
                            </span>
                        </h3>
                    );
                }

                return (
                    <p key={i} className="text-[15px] sm:text-[16px] text-white/75 leading-[1.85] font-medium break-keep mb-5">
                        {para}
                    </p>
                );
            })}
        </>
    );
}

export default async function ColumnDetailPage({ params }: PageProps) {
    const { id } = await params;
    const column = COLUMNS.find((c) => c.id === id);

    if (!column) {
        return notFound();
    }

    const { summary, sections } = parseContentSections(column.content);

    // Get related books and fetch covers concurrently
    const baseRelatedBooks = column.relatedBookIds
        ? RECOMMENDED_BOOKS.filter((b) => column.relatedBookIds?.includes(b.id))
        : [];

    const relatedBooks = await Promise.all(
        baseRelatedBooks.map(async (book) => {
            let coverUrl = book.imgUrl;
            if (book.naverQuery && !coverUrl) {
                const naverData = await fetchNaverBook(book.naverQuery);
                if (naverData && naverData.image) {
                    coverUrl = naverData.image;
                }
            }
            return { ...book, coverUrl };
        })
    );

    // Get prev/next columns
    const currentIndex = COLUMNS.findIndex((c) => c.id === id);
    const prevColumn = currentIndex > 0 ? COLUMNS[currentIndex - 1] : null;
    const nextColumn = currentIndex < COLUMNS.length - 1 ? COLUMNS[currentIndex + 1] : null;

    // Parse summary lines
    const summaryLines = summary
        .split("\n")
        .filter((line) => /^\d\./.test(line.trim()))
        .map((line) => line.trim());

    return (
        <div className="max-w-md mx-auto relative bg-[#0b0c10] min-h-screen pb-24 sm:border-x sm:border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Schema.org Article JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Article",
                        headline: column.title,
                        description: column.subtitle,
                        author: {
                            "@type": "Organization",
                            name: "TRIFOLI",
                            url: "https://trifoli.kr",
                        },
                        publisher: {
                            "@type": "Organization",
                            name: "TRIFOLI",
                            url: "https://trifoli.kr",
                        },
                        datePublished: column.publishedAt,
                        dateModified: column.publishedAt,
                        mainEntityOfPage: {
                            "@type": "WebPage",
                            "@id": `https://trifoli.kr/insights/columns/${column.id}`,
                        },
                        articleSection: column.categoryLabel,
                        keywords: column.tags.join(", "),
                    }),
                }}
            />

            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] aspect-square bg-emerald-500/8 rounded-full blur-[100px] opacity-50 pointer-events-none" />

            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-[#0b0c10]/70 backdrop-blur-2xl border-b border-white/10 px-4 py-3 flex items-center gap-3">
                <BackButton />
                <h1 className="text-base font-bold text-foreground flex-1 truncate">
                    {column.title}
                </h1>
            </header>

            {/* Content */}
            <main className="px-5 py-6 space-y-8 relative z-10">
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    {/* Emoji Hero */}
                    <div className="relative inline-flex items-center justify-center">
                        <div className={`w-20 h-20 rounded-3xl ${column.categoryBg} border border-white/10 flex items-center justify-center text-4xl shadow-lg`}>
                            {column.thumbnailEmoji}
                        </div>
                        <div className={`absolute inset-0 ${column.categoryBg} rounded-3xl blur-xl opacity-40 pointer-events-none`} />
                    </div>

                    {/* Category Tag */}
                    <div className="flex justify-center">
                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${column.categoryBg} ${column.categoryColor} border border-current/20`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 inline-block" />
                            {column.categoryLabel}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-black leading-tight text-white px-2">
                        {column.title}
                    </h2>

                    {/* Meta */}
                    <div className="flex items-center justify-center gap-2 text-[11px] text-white/35 font-medium">
                        <Link href="/insights/about" className="hover:text-emerald-400 transition-colors">{column.author}</Link>
                        <span>·</span>
                        <Clock className="w-3 h-3" />
                        <span>{column.readTime}분 읽기</span>
                        <span>·</span>
                        <span>{column.publishedAt}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        {column.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-bold text-white/25 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5">
                                <Tag className="w-2.5 h-2.5" />
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 3줄 요약 */}
                {summaryLines.length > 0 && (
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="relative flex items-center justify-center">
                                <span className="absolute w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                                <span className="relative w-2 h-5 bg-emerald-500 rounded-full" />
                            </div>
                            <h3 className="font-black text-base text-white tracking-tight">3줄 요약</h3>
                        </div>
                        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden border-l-2 border-l-emerald-500/50">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/8 rounded-full blur-[30px] translate-x-6 -translate-y-6" />
                            {summaryLines.map((line, i) => (
                                <p key={i} className="text-[13px] sm:text-[14px] text-white/70 leading-relaxed font-medium relative z-10">
                                    {line}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Article Body - Section 1 */}
                <div>
                    <FormattedContent text={sections[0]} />
                </div>

                {/* In-article Ad Slot (between sections) */}
                {sections.length > 1 && (
                    <div className="py-2">
                        {/* AdSlot is client component, imported directly */}
                        <div className="border border-dashed border-white/10 rounded-2xl py-6 flex items-center justify-center">
                            <span className="text-[11px] text-white/20 font-medium tracking-wide">
                                📢 본문 내 광고 영역
                            </span>
                        </div>
                    </div>
                )}

                {/* Article Body - Section 2 */}
                {sections.length > 1 && (
                    <div>
                        <FormattedContent text={sections[1]} />
                    </div>
                )}

                {/* Related Books */}
                {relatedBooks.length > 0 && (
                    <div className="pt-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative flex items-center justify-center">
                                <span className="absolute w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                                <span className="relative w-2 h-5 bg-emerald-500 rounded-full" />
                            </div>
                            <h3 className="font-black text-base text-white tracking-tight">📚 관련 추천 도서</h3>
                        </div>
                        <div className="space-y-3">
                            {relatedBooks.map((book) => (
                                <Link key={book.id} href={`/insights/books/${book.id}`} className="block">
                                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex gap-4 items-center group hover:bg-white/[0.05] transition-colors">
                                        <div className="w-10 h-14 rounded-lg bg-emerald-500/10 border border-white/10 flex items-center justify-center flex-shrink-0 text-lg overflow-hidden relative">
                                            {book.coverUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover absolute inset-0" />
                                            ) : (
                                                "📖"
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white/80 truncate group-hover:text-white transition-colors">{book.title}</p>
                                            <p className="text-[11px] text-white/30 font-medium mt-0.5">{book.author}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Ad Slot */}
                <div className="border border-dashed border-white/10 rounded-2xl py-6 flex items-center justify-center">
                    <span className="text-[11px] text-white/20 font-medium tracking-wide">
                        📢 하단 광고 영역
                    </span>
                </div>

                {/* Investment Disclaimer */}
                <div className="border-t border-white/5 pt-5 mt-2">
                    <p className="text-[11px] text-white/20 leading-relaxed font-medium break-keep">
                        본 콘텐츠는 정보 제공 목적으로 작성되었으며, 특정 금융 상품에 대한 투자 권유나 매매 추천이 아닙니다. 투자 판단은 본인의 책임하에 이루어져야 하며, 투자 결과에 대한 법적 책임은 투자자 본인에게 있습니다.
                    </p>
                </div>

                {/* Prev / Next Navigation */}
                <div className="flex gap-3 pt-2">
                    {prevColumn ? (
                        <Link href={`/insights/columns/${prevColumn.id}`} className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-4 group hover:bg-white/[0.05] transition-colors">
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">이전 칼럼</span>
                            <p className="text-[13px] font-bold text-white/60 mt-1 line-clamp-1 group-hover:text-white/80 transition-colors">{prevColumn.title}</p>
                        </Link>
                    ) : (
                        <div className="flex-1" />
                    )}
                    {nextColumn ? (
                        <Link href={`/insights/columns/${nextColumn.id}`} className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-right group hover:bg-white/[0.05] transition-colors">
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">다음 칼럼</span>
                            <p className="text-[13px] font-bold text-white/60 mt-1 line-clamp-1 group-hover:text-white/80 transition-colors">{nextColumn.title}</p>
                        </Link>
                    ) : (
                        <div className="flex-1" />
                    )}
                </div>
            </main>
        </div>
    );
}

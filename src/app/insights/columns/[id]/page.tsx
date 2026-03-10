import { COLUMNS } from "@/data/columns";
import { RECOMMENDED_BOOKS } from "@/data/books";
import { notFound } from "next/navigation";
import { Clock, Tag, ArrowRight } from "lucide-react";
import { Metadata } from "next";
import { BackButton } from "@/components/insights/BackButton";
import Link from "next/link";
import { fetchNaverBook } from "@/lib/naver-books";
import { SITE_CONFIG } from "@/lib/constants";
import { getColumnContent } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import React from "react";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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

// Helper to render text with Markdown-style links [text](url) - reused for manual text if needed
function renderTextWithLinks(text: string) {
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
            const [, label, url] = match;
            const isExternal = url.startsWith("http");
            return (
                <Link
                    key={i}
                    href={url}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="text-emerald-500 dark:text-emerald-400 font-bold underline underline-offset-4 decoration-emerald-500/30 hover:decoration-emerald-500 transition-all hover:bg-emerald-500/5 px-0.5 rounded"
                >
                    {label}
                </Link>
            );
        }
        return part;
    });
}

const getTextContent = (node: any): string => {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(getTextContent).join('');
    if (node && typeof node === 'object' && node.props && node.props.children) return getTextContent(node.props.children);
    return '';
};

// MDX Components mapping the same styles as before
const mdxComponents = {
    h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="flex items-center gap-2 mt-8 mb-3">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
            <span className="text-[16.5px] sm:text-[17px] font-black text-gray-900 dark:text-white tracking-tight">
                {children}
            </span>
        </h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => {
        const textContent = getTextContent(children).trim();
        // Check if it's a short, unpunctuated line acting as a title (fallback for plain text titles)
        const isHeading = textContent.length > 0 && 
                          textContent.length < 50 && 
                          !textContent.match(/[.?!~]$/) && 
                          !textContent.includes('3줄 요약') && 
                          !textContent.includes('결론:'); // Prevent some normal end-paragraphs from catching

        const isCtaPath = (href?: string) => 
            href === "/" || 
            href?.startsWith("/?persona=") || 
            href?.startsWith("/?mentor=") || 
            href?.startsWith("/calc");

        // CTA links should never have a dot
        const hasCtaLink = React.Children.toArray(children).some(child => 
            React.isValidElement(child) && 
            (child.props as any)?.href && 
            isCtaPath((child.props as any).href)
        );

        if (isHeading && !hasCtaLink) {
            return (
                <div className="flex items-center gap-2 mt-8 mb-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                    <h3 className="text-[16.5px] sm:text-[17px] font-black text-gray-900 dark:text-white tracking-tight m-0">
                        {children}
                    </h3>
                </div>
            );
        }

        return (
            <p className="text-[15px] sm:text-[16px] text-gray-600 dark:text-white/75 leading-[1.85] font-medium break-keep mb-5 [&:last-child]:mb-0">
                {children}
            </p>
        );
    },
    ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="space-y-3 pl-1 mb-10">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="space-y-3 pl-1 mb-10">{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
        <li className="flex items-start gap-3 text-[15px] sm:text-[16px] text-gray-600 dark:text-white/75 leading-[1.7] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 mt-[10px] flex-shrink-0" />
            <span className="flex-1">{children}</span>
        </li>
    ),
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
        const isExternal = href?.startsWith("http");
        const isCta = href === "/" || 
                    href?.startsWith("/?persona=") || 
                    href?.startsWith("/?mentor=") || 
                    href?.startsWith("/calc");
        
        if (isCta) {
            const isGuru = href === "/" || 
                        href?.startsWith("/?persona=") || 
                        href?.startsWith("/?mentor=");
            return (
                <Link 
                    href={href || "#"} 
                    className="group inline box-decoration-clone px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl transition-colors"
                >
                    <span className="inline-block text-[0.9em] translate-y-[-0.5px] opacity-90 mr-1">{isGuru ? "🤖" : "🧮"}</span>
                    <span>{children}</span>
                </Link>
            )
        }

        return (
            <Link
                href={href || "#"}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-emerald-600 dark:text-emerald-400 font-bold underline underline-offset-4 decoration-emerald-500/30 hover:decoration-emerald-500 transition-all hover:bg-emerald-500/5 px-0.5 rounded"
            >
                {children}
            </Link>
        );
    },
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="my-6 px-5 py-4 bg-gray-50/80 dark:bg-white/[0.03] rounded-3xl text-[13.5px] sm:text-[14px] text-gray-600 dark:text-white/60 font-medium [&_p]:leading-[1.7] [&_strong]:text-gray-800 dark:[&_strong]:text-white/90 has-[a]:bg-transparent has-[a]:p-0 has-[a]:my-6 has-[a]:text-left">
            {children}
        </blockquote>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-black text-gray-900 dark:text-white underline underline-offset-2 decoration-emerald-500/30">
            {children}
        </strong>
    )
};

// Function to split raw content for ad insertion
function splitContentIntoParts(rawContent: string) {
    const lines = rawContent.split("\n");
    let summaryLines: string[] = [];
    let bodyStartIndex = 0;
    let foundSummary = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes("3줄 요약") || line.includes("3줄요약")) {
            foundSummary = true;
            continue;
        }
        if (foundSummary) {
            // Check if we hit the end of summary (empty line after numbered items)
            if (line === "" && summaryLines.length > 0) {
                bodyStartIndex = i;
                break;
            }
            if (/^\d\./.test(line)) {
                summaryLines.push(line);
            }
        }
    }

    // Fallback if structure is slightly different
    if (bodyStartIndex === 0) {
        bodyStartIndex = lines.findIndex(l => l.trim() !== "" && !l.includes("3줄")) ;
    }

    const bodyContent = lines.slice(bodyStartIndex).join("\n").trim();
    
    // Split body into sections for ad placement
    // More robust split that handles CRLF and simple newlines
    const paragraphs = bodyContent.split(/\r?\n\r?\n+/).filter(p => p.trim() !== "");
    const resultParts: string[] = [];
    
    if (paragraphs.length >= 10) { // Lowered slightly from 12 to ensure 3 ads on most columns
        const partSize = Math.ceil(paragraphs.length / 3);
        resultParts.push(paragraphs.slice(0, partSize).join("\n\n"));
        resultParts.push(paragraphs.slice(partSize, partSize * 2).join("\n\n"));
        resultParts.push(paragraphs.slice(partSize * 2).join("\n\n"));
    } else if (paragraphs.length >= 5) { // Lowered slightly from 6 for better coverage
        const mid = Math.ceil(paragraphs.length / 2);
        resultParts.push(paragraphs.slice(0, mid).join("\n\n"));
        resultParts.push(paragraphs.slice(mid).join("\n\n"));
    } else {
        resultParts.push(bodyContent);
    }

    return { summaryLines, bodyParts: resultParts };
}

export default async function ColumnDetailPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { from } = await searchParams;
    
    // Determine back button props
    const isFromGuru = from === "guru";
    const backHref = isFromGuru ? "/" : undefined;
    const backText = isFromGuru ? "AI 멘토" : undefined;

    const column = COLUMNS.find((c) => c.id === id);

    if (!column) {
        return notFound();
    }

    const contentData = await getColumnContent(id);
    if (!contentData) {
        return notFound();
    }

    const { summaryLines, bodyParts } = splitContentIntoParts(contentData.source);

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

    return (
        <div className="max-w-md mx-auto relative bg-white dark:bg-[#0b0c10] min-h-screen pb-24 sm:border-x sm:border-gray-200 dark:sm:border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
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
                            name: "The Lazy Rich",
                            url: SITE_CONFIG.url,
                        },
                        publisher: {
                            "@type": "Organization",
                            name: "The Lazy Rich",
                            url: SITE_CONFIG.url,
                        },
                        datePublished: column.publishedAt,
                        dateModified: column.publishedAt,
                        mainEntityOfPage: {
                            "@type": "WebPage",
                            "@id": `${SITE_CONFIG.url}/insights/columns/${column.id}`,
                        },
                        articleSection: column.categoryLabel,
                        keywords: column.tags.join(", "),
                    }),
                }}
            />

            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] aspect-square bg-emerald-500/5 dark:bg-emerald-500/8 rounded-full blur-[100px] opacity-50 pointer-events-none" />

            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#0b0c10]/70 backdrop-blur-2xl border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center gap-3">
                <BackButton href={backHref} text={backText} />
                <h1 className="text-base font-bold text-foreground flex-1 truncate">
                    {column.title}
                </h1>
            </header>

            {/* Content */}
            <main className="px-5 py-6 space-y-8 relative z-10">
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <div className="relative inline-flex items-center justify-center">
                        <div className={`w-20 h-20 rounded-3xl ${column.categoryBg} border border-gray-200 dark:border-white/10 flex items-center justify-center text-4xl shadow-lg`}>
                            {column.thumbnailEmoji}
                        </div>
                        <div className={`absolute inset-0 ${column.categoryBg} rounded-3xl blur-xl opacity-40 pointer-events-none`} />
                    </div>

                    <div className="flex justify-center">
                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${column.categoryBg} ${column.categoryColor} border border-current/20`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 inline-block" />
                            {column.categoryLabel}
                        </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black leading-tight text-gray-900 dark:text-white px-2">
                        {column.title}
                    </h2>

                    <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 dark:text-white/35 font-medium">
                        <Link href="/insights/about" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">{column.author}</Link>
                        <span>·</span>
                        <Clock className="w-3 h-3" />
                        <span>{column.readTime}분 읽기</span>
                        <span>·</span>
                        <span>{column.publishedAt}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                        {column.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-white/25 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5">
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
                            <h3 className="font-black text-base text-gray-900 dark:text-white tracking-tight">3줄 요약</h3>
                        </div>
                        <div className="bg-gray-50 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden border-l-2 border-l-emerald-500/50">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/8 rounded-full blur-[30px] translate-x-6 -translate-y-6" />
                            {summaryLines.map((line, i) => (
                                <p key={i} className="text-[13px] sm:text-[14px] text-gray-600 dark:text-white/70 leading-relaxed font-medium relative z-10">
                                    {renderTextWithLinks(line)}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Article Body Sections with MDX */}
                {bodyParts.map((part, index) => (
                    <div key={index} className="mdx-content">
                        <MDXRemote source={part} components={mdxComponents} />

                        {/* In-article Ad Slot */}
                        {index < bodyParts.length - 1 && (
                            <div className="py-4">
                                <div className="border border-dashed border-gray-300 dark:border-white/10 rounded-2xl py-6 flex items-center justify-center bg-transparent relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gray-50 dark:bg-white/[0.02] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
                                    <span className="text-[11px] text-gray-400 dark:text-white/30 font-medium tracking-wide relative z-10 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                        본문 내 광고 영역 {bodyParts.length > 2 ? index + 1 : ""}
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Related Books */}
                {relatedBooks.length > 0 && (
                    <div className="pt-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative flex items-center justify-center">
                                <span className="absolute w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                                <span className="relative w-2 h-5 bg-emerald-500 rounded-full" />
                            </div>
                            <h3 className="font-black text-base text-gray-900 dark:text-white tracking-tight">📚 관련 추천 도서</h3>
                        </div>
                        <div className="space-y-3">
                            {relatedBooks.map((book) => (
                                <Link key={book.id} href={`/insights/books/${book.id}`} className="block">
                                    <div className="bg-gray-50 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex gap-4 items-center group hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                                        <div className="w-10 h-14 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 text-lg overflow-hidden relative">
                                            {book.coverUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover absolute inset-0" />
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
                )}

                {/* Bottom Ad Slot */}
                <div className="border border-dashed border-gray-300 dark:border-white/10 rounded-2xl py-6 flex items-center justify-center bg-transparent relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-50 dark:bg-white/[0.02] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
                    <span className="text-[11px] text-gray-400 dark:text-white/30 font-medium tracking-wide relative z-10 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                        하단 광고 영역
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                    </span>
                </div>

                {/* Investment Disclaimer */}
                <div className="border-t border-gray-200 dark:border-white/5 pt-5 mt-2">
                    <p className="text-[11px] text-gray-400 dark:text-white/20 leading-relaxed font-medium break-keep">
                        본 콘텐츠는 정보 제공 목적으로 작성되었으며, 특정 금융 상품에 대한 투자 권유나 매매 추천이 아닙니다. 투자 판단은 본인의 책임하에 이루어져야 하며, 투자 결과에 대한 법적 책임은 투자자 본인에게 있습니다.
                    </p>
                </div>

                {/* Prev / Next Navigation */}
                <div className="flex gap-3 pt-2">
                    {prevColumn ? (
                        <Link href={`/insights/columns/${prevColumn.id}`} className="flex-1 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-4 group hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                            <span className="text-[10px] text-gray-400 dark:text-white/30 font-bold uppercase tracking-wider">이전 칼럼</span>
                            <p className="text-[13px] font-bold text-gray-500 dark:text-white/60 mt-1 line-clamp-1 group-hover:text-gray-700 dark:group-hover:text-white/80 transition-colors">{prevColumn.title}</p>
                        </Link>
                    ) : (
                        <div className="flex-1" />
                    )}
                    {nextColumn ? (
                        <Link href={`/insights/columns/${nextColumn.id}`} className="flex-1 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-right group hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                            <span className="text-[10px] text-gray-400 dark:text-white/30 font-bold uppercase tracking-wider">다음 칼럼</span>
                            <p className="text-[13px] font-bold text-gray-500 dark:text-white/60 mt-1 line-clamp-1 group-hover:text-gray-700 dark:group-hover:text-white/80 transition-colors">{nextColumn.title}</p>
                        </Link>
                    ) : (
                        <div className="flex-1" />
                    )}
                </div>
            </main>
        </div>
    );
}

import { Metadata } from "next";
import { BackButton } from "@/components/insights/BackButton";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
    title: "에디터 소개 | The Lazy Rich",
    description:
        "The Lazy Rich 는 금융업에 종사하지 않는 개인 투자자가 직접 운영합니다. 공개된 데이터와 원문을 확인해 장기투자 인사이트를 정리합니다.",
};

export default function AboutEditorPage() {
    return (
        <div className="max-w-md mx-auto relative bg-[#0b0c10] min-h-screen pb-24 sm:border-x sm:border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Schema.org Organization JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        name: "The Lazy Rich",
                        url: SITE_CONFIG.url,
                        description:
                            "올바른 장기투자 문화를 위한 데이터 기반 인사이트 플랫폼",
                        foundingDate: "2026",
                    }),
                }}
            />

            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] aspect-square bg-emerald-500/8 rounded-full blur-[100px] opacity-50 pointer-events-none" />

            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-[#0b0c10]/70 backdrop-blur-2xl border-b border-white/10 px-4 py-3 flex items-center gap-3">
                <BackButton />
                <h1 className="text-base font-bold text-foreground flex-1 truncate">
                    에디터 소개
                </h1>
            </header>

            {/* Content */}
            <main className="px-5 py-8 space-y-10 relative z-10">
                {/* Profile Hero */}
                <div className="text-center space-y-4">
                    <div className="relative inline-flex items-center justify-center">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-white/10 flex items-center justify-center text-4xl shadow-lg">
                            ✍️
                        </div>
                        <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl blur-xl opacity-40 pointer-events-none" />
                    </div>

                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                            The Lazy Rich 에디터
                        </h2>
                        <p className="text-sm text-emerald-500/70 font-bold mt-1">
                            올바른 장기투자를 위한 인사이트
                        </p>
                    </div>
                </div>

                {/* Editorial Philosophy */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex items-center justify-center">
                            <span className="absolute w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                            <span className="relative w-2 h-5 bg-emerald-500 rounded-full" />
                        </div>
                        <h3 className="font-black text-base text-white tracking-tight">
                            편집 철학
                        </h3>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 relative overflow-hidden border-l-2 border-l-emerald-500/50">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/8 rounded-full blur-[30px] translate-x-6 -translate-y-6" />
                        <p className="text-[14px] sm:text-[15px] text-white/70 leading-[1.85] font-medium break-keep relative z-10">
                            먼저 밝혀 둘 것이 있습니다. 저는 금융업에 종사하지
                            않는 개인 투자자입니다. 자격을 갖춘 전문가가 아니며,
                            이곳의 글은 투자 자문이 아닙니다.
                        </p>
                        <p className="text-[14px] sm:text-[15px] text-white/70 leading-[1.85] font-medium break-keep relative z-10">
                            그래서 더 지키는 원칙이 하나 있습니다. 데이터가
                            뒷받침하지 않는 주장은 싣지 않는다는 것입니다.
                            제 의견이 아니라 확인 가능한 근거를 남기려 합니다.
                        </p>
                        <p className="text-[14px] sm:text-[15px] text-white/70 leading-[1.85] font-medium break-keep relative z-10">
                            수치는 원문 통계나 법령을 직접 확인해 적고, 확인하지
                            못한 내용은 확인하지 못했다고 적습니다. 제 돈으로
                            인덱스 중심의 장기투자를 이어가면서 알게 된 것들을
                            함께 정리합니다.
                        </p>
                    </div>
                </div>

                {/* What We Cover */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex items-center justify-center">
                            <span className="absolute w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                            <span className="relative w-2 h-5 bg-emerald-500 rounded-full" />
                        </div>
                        <h3 className="font-black text-base text-white tracking-tight">
                            다루는 주제
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {[
                            {
                                emoji: "📊",
                                title: "시장 해부",
                                desc: "S&P 500, ETF, 글로벌 시장의 역사적 데이터를 분석합니다",
                            },
                            {
                                emoji: "🧠",
                                title: "투자 마인드셋",
                                desc: "행동경제학과 투자심리학에 기반한 인사이트를 전합니다",
                            },
                            {
                                emoji: "📘",
                                title: "실전 가이드",
                                desc: "직접 실행할 수 있는 구체적인 투자 전략을 안내합니다",
                            },
                            {
                                emoji: "👤",
                                title: "인물 탐구",
                                desc: "워런 버핏, 존 보글 등 검증된 투자 거장의 철학을 소개합니다",
                            },
                            {
                                emoji: "📖",
                                title: "추천 도서",
                                desc: "장기투자에 도움이 되는 엄선된 도서를 리뷰합니다",
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex gap-4 items-center"
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">
                                    {item.emoji}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white/80">
                                        {item.title}
                                    </p>
                                    <p className="text-[12px] text-white/40 font-medium mt-0.5 break-keep">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editorial Standards */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex items-center justify-center">
                            <span className="absolute w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                            <span className="relative w-2 h-5 bg-emerald-500 rounded-full" />
                        </div>
                        <h3 className="font-black text-base text-white tracking-tight">
                            편집 기준
                        </h3>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 space-y-4">
                            {[
                                "모든 데이터와 통계는 공신력 있는 출처(금융감독원, SPIVA, CBOE 등)를 기반으로 합니다.",
                                "특정 종목이나 금융 상품의 매수·매도를 추천하지 않습니다.",
                                "광고와 편집 콘텐츠를 명확히 구분합니다. 도서 추천에는 쿠팡 파트너스 제휴가 포함될 수 있으며, 이는 관련 페이지에 고지됩니다.",
                                "오류가 발견될 경우, 확인 즉시 정정합니다.",
                            ].map((standard, i) => (
                                <p
                                    key={i}
                                    className="text-[14px] sm:text-[15px] text-white/70 leading-[1.85] font-medium break-keep flex gap-3"
                                >
                                    <span className="text-emerald-500 font-black flex-shrink-0">
                                        {i + 1}.
                                    </span>
                                    <span>{standard}</span>
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex items-center justify-center">
                            <span className="absolute w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                            <span className="relative w-2 h-5 bg-emerald-500 rounded-full" />
                        </div>
                        <h3 className="font-black text-base text-white tracking-tight">
                            문의하기
                        </h3>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                        <div className="space-y-1">
                            <p className="text-[12px] text-white/40 font-medium">에디터 이메일</p>
                            <p className="text-[15px] text-white/90 font-bold">{SITE_CONFIG.supportEmail}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-white/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            ✉️
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="border-t border-white/5 pt-5">
                    <p className="text-[11px] text-white/20 leading-relaxed font-medium break-keep">
                        본 콘텐츠는 정보 제공 목적으로 작성되었으며, 특정 금융
                        상품에 대한 투자 권유나 매매 추천이 아닙니다. 투자 판단은
                        본인의 책임하에 이루어져야 하며, 투자 결과에 대한 법적
                        책임은 투자자 본인에게 있습니다.
                    </p>
                </div>

                {/* Back to Insights */}
                <div className="flex justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-bold text-emerald-500/60 hover:text-emerald-400 transition-colors"
                    >
                        ← 인사이트로 돌아가기
                    </Link>
                </div>
            </main>
        </div>
    );
}

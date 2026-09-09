import { Metadata } from "next";

/**
 * /mentor 는 "use client" 페이지라 page.tsx 에서 metadata 를 export 할 수 없다.
 * 그래서 얇은 layout 을 두고 여기에 붙인다. (/calc 과 같은 방식)
 *
 * 이걸 비워 두면 루트 layout 의 기본 title/description 을 그대로 물려받아
 * 여러 페이지가 똑같은 제목으로 색인된다.
 */
export const metadata: Metadata = {
    title: "AI 투자 멘토",
    description:
        "워런 버핏, 존 보글 등 검증된 투자 거장의 관점으로 내 투자 고민을 정리해 보는 대화형 도구입니다.",
    alternates: { canonical: "/mentor" },
    openGraph: {
        title: "AI 투자 멘토 | The Lazy Rich",
        description:
            "거장들의 투자 철학을 바탕으로 내 상황에 맞는 질문을 던지고 답을 정리해 보세요.",
        type: "website",
        url: "https://thelazyrich.me/mentor",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "AI 투자 멘토" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "AI 투자 멘토 | The Lazy Rich",
        description: "거장들의 투자 철학으로 내 투자 고민을 정리해 보세요.",
        images: ["/logo.png"],
    },
};

export default function MentorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

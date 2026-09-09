import { Metadata } from "next";

/**
 * 서비스가 무엇을 지향하는지 설명하는 공개 페이지.
 * 사람(에디터)을 소개하는 /about 과는 다른 페이지이므로 제목도 구분한다.
 *
 * 상위 /profile/layout.tsx 가 noindex 를 걸어 두었으므로 여기서 다시 연다.
 */
export const metadata: Metadata = {
    title: "서비스 소개",
    description:
        "The Lazy Rich 가 어떤 원칙으로 만들어졌는지 소개합니다. 거장들의 투자 철학을 연구해 흔들리지 않는 장기투자 기준을 정리합니다.",
    alternates: { canonical: "/profile/about" },
    robots: { index: true, follow: true },
    openGraph: {
        title: "서비스 소개 | The Lazy Rich",
        description: "The Lazy Rich 가 어떤 원칙으로 만들어졌는지 소개합니다.",
        type: "website",
        url: "https://thelazyrich.me/profile/about",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "The Lazy Rich" }],
    },
};

export default function ProfileAboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "내 포트폴리오",
    description:
        "보유 자산을 등록하고 자산 배분과 비중을 한눈에 확인합니다. 등록한 포트폴리오는 AI 투자 멘토 진단에 바로 활용됩니다.",
    alternates: { canonical: "/portfolio" },
    openGraph: {
        title: "내 포트폴리오 | The Lazy Rich",
        description: "보유 자산의 배분과 비중을 한눈에 확인하세요.",
        type: "website",
        url: "https://thelazyrich.me/portfolio",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "내 포트폴리오" }],
    },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

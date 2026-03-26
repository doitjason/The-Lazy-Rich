import { Metadata } from "next";

export const metadata: Metadata = {
    title: "했제 투자 계산기",
    description: "과거 그 시점에 이 종목을 샀더라면? 수익률과 미래 자산 가치를 시뮬레이션해보세요.",
    openGraph: {
        title: "했제 투자 계산기 | The Lazy Rich",
        description: "과거 그 시점에 이 종목을 샀더라면? 수익률과 미래 자산 가치를 시뮬레이션해보세요.",
        type: "website",
        url: "https://thelazyrich.me/calc",
        images: [
            {
                url: "/logo.png",
                width: 1200,
                height: 630,
                alt: "했제 투자 계산기",
            }
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "했제 투자 계산기 | The Lazy Rich",
        description: "과거 성과 분석부터 미래 자산 계획까지, 똑똑한 투자의 시작.",
        images: ["/logo.png"],
    },
};

export default function CalcLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

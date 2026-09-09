import { Metadata } from "next";

export const metadata: Metadata = {
    title: "서비스 이용약관",
    description:
        "The Lazy Rich 서비스 이용에 관한 약관입니다. 제공 범위, 이용자의 의무, 책임의 한계를 정합니다.",
    alternates: { canonical: "/terms" },
    openGraph: {
        title: "서비스 이용약관 | The Lazy Rich",
        description: "서비스 제공 범위, 이용자의 의무, 책임의 한계.",
        type: "website",
        url: "https://thelazyrich.me/terms",
    },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

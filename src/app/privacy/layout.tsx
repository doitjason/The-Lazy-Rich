import { Metadata } from "next";

export const metadata: Metadata = {
    title: "개인정보 처리방침",
    description:
        "The Lazy Rich 가 수집하는 개인정보 항목과 보유 기간, 제3자 제공 및 광고 쿠키 사용에 관한 고지입니다.",
    alternates: { canonical: "/privacy" },
    openGraph: {
        title: "개인정보 처리방침 | The Lazy Rich",
        description: "수집 항목, 보유 기간, 제3자 제공 및 광고 쿠키 사용 고지.",
        type: "website",
        url: "https://thelazyrich.me/privacy",
    },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

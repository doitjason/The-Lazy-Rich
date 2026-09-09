import { Metadata } from "next";

/**
 * 로그인 처리 과정에서만 지나가는 경로. 색인될 이유가 없다.
 */
export const metadata: Metadata = {
    title: "로그인",
    robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

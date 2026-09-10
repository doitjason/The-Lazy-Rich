import { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/layout/BottomNav";
import { SiteFooter } from "@/components/layout/SiteFooter";

import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsManager } from "@/components/analytics/AnalyticsManager";
import { Agentation } from "agentation";
import { Suspense } from "react";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thelazyrich.me"),
  title: {
    default: "The Lazy Rich | 올바른 장기투자를 위한 AI 투자 컴패니언",
    template: "%s | The Lazy Rich"
  },
  description: "The Lazy Rich는 데이터 기반 투자 인사이트, 포트폴리오 관리, AI 투자 멘토링을 통해 당신의 단단한 장기투자를 돕습니다.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://thelazyrich.me",
    siteName: "The Lazy Rich",
    title: "The Lazy Rich | 올바른 장기투자를 위한 AI 투자 컴패니언",
    description: "데이터 기반 투자 인사이트, 포트폴리오 관리, AI 투자 멘토링을 통해 당신의 단단한 장기투자를 돕습니다.",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Lazy Rich | 올바른 장기투자를 위한 AI 투자 컴패니언",
    description: "데이터 기반 투자 인사이트, 포트폴리오 관리, AI 투자 멘토링을 통해 당신의 단단한 장기투자를 돕습니다.",
    images: ["/logo.png"],
  },
  verification: {
    other: {
      "naver-site-verification": "02fca866070cd76f8d7ec03e32bb2fb30a90dea7",
    },
  },
  alternates: {
    canonical: "https://thelazyrich.me",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="naver-site-verification" content="02fca866070cd76f8d7ec03e32bb2fb30a90dea7" />
        {/*
          Google AdSense 게재 코드.

          심사를 받으려면 이 코드가 사이트에 실제로 붙어 있어야 한다. 2026-03-08
          에 넣었다가 2026-03-16 커밋에서 빠진 뒤로 없는 상태였다.

          클라이언트 ID 는 public/ads.txt 의 퍼블리셔 ID 와 같아야 한다.
          (pub-9935065185301028) 둘이 어긋나면 소유 확인이 되지 않는다.

          next/script 대신 순수 script 태그를 쓴다. 이 태그는 <head> 에 그대로
          들어가야 하고, 크롤러가 HTML 만 받아도 보여야 하기 때문이다.

          주의: next.config.ts 의 CSP 에 googlesyndication 계열 도메인이 열려
          있어야 한다. 스크립트만 붙이고 CSP 를 빼먹으면 광고가 에러 없이
          빈 화면으로만 나타난다. 카카오 애드핏이 5개월간 그 상태였다.
        */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9935065185301028"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          pretendard.variable
        )}
      >
        <Suspense fallback={null}>
          <AnalyticsManager />
        </Suspense>
        <AuthProvider>
          <CurrencyProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <main className="pb-20">
                {children}
                <SiteFooter />
              </main>
              <BottomNav />
              {process.env.NODE_ENV !== "production" && (
                <Agentation endpoint="http://localhost:4747" />
              )}
            </ThemeProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

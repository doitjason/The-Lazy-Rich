import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/layout/BottomNav";

import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsManager } from "@/components/analytics/AnalyticsManager";
import { Suspense } from "react";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thelazyrich.me"),
  title: {
    default: "The Lazy Rich | 올바른 장기투자를 위한 AI 투자 컴패니언",
    template: "%s | The Lazy Rich"
  },
  description: "The Lazy Rich는 데이터 기반 투자 인사이트, 포트폴리오 관리, AI 멘토링을 통해 당신의 단단한 장기투자를 돕습니다.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://thelazyrich.me",
    siteName: "The Lazy Rich",
    title: "The Lazy Rich | 올바른 장기투자를 위한 AI 투자 컴패니언",
    description: "데이터 기반 투자 인사이트, 포트폴리오 관리, AI 멘토링을 통해 당신의 단단한 장기투자를 돕습니다.",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Lazy Rich | 올바른 장기투자를 위한 AI 투자 컴패니언",
    description: "데이터 기반 투자 인사이트, 포트폴리오 관리, AI 멘토링을 통해 당신의 단단한 장기투자를 돕습니다.",
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
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
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
              </main>
              <BottomNav />
            </ThemeProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

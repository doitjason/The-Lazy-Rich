import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      // 게재 중단한 칼럼. 색인에 남은 URL 이 404 로 떨어지지 않도록 목록으로 보낸다.
      // (RIA 제도의 감면율/적용 기한을 1차 출처로 확인할 수 없어 글을 내렸다)
      {
        source: "/columns/ria-account-tax-savings",
        destination: "/",
        permanent: true,
      },
      {
        source: "/insights/columns/:id",
        destination: "/columns/:id",
        permanent: true,
      },
      {
        source: "/insights/books/:id",
        destination: "/books/:id",
        permanent: true,
      },
      {
        source: "/insights/about",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/insights",
        destination: "/",
        permanent: true,
      },
      // Redirect old AI Mentor links (which were at the root) to the new /mentor path
      {
        source: "/",
        has: [{ type: "query", key: "mentor" }],
        destination: "/mentor",
        permanent: true,
      },
      {
        source: "/",
        has: [{ type: "query", key: "persona" }],
        destination: "/mentor",
        permanent: true,
      },
      {
        source: "/",
        has: [{ type: "query", key: "action", value: "analyze_portfolio" }],
        destination: "/mentor",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://t1.kakaocdn.net https://t1.daumcdn.net https://*.kakao.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://rttphluffayixqppypvs.supabase.co wss://rttphluffayixqppypvs.supabase.co https://api.openai.com https://*.pstatic.net https://*.kakao.com https://*.daumcdn.net; frame-src 'self' https://*.kakao.com https://*.daumcdn.net; frame-ancestors 'none';"
          }
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ssl.pstatic.net",
      },
      {
        protocol: "http",
        hostname: "*.pstatic.net",
      },
      {
        protocol: "https",
        hostname: "*.pstatic.net",
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;

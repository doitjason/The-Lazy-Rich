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
      // AI 멘토의 옛 경로. 페이지는 /mentor 로 옮겼는데 리다이렉트를 두지 않아
      // 서치 콘솔에 404 로 남아 있었다.
      {
        source: "/guru",
        destination: "/mentor",
        permanent: true,
      },
      {
        source: "/guru/:path*",
        destination: "/mentor",
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
            // 광고/애널리틱스는 스크립트 호스트와 그 스크립트가 다시 부르는
            // 호스트가 서로 다르다. 한쪽만 열어 두면 조용히 실패한다.
            //
            //   카카오 애드핏 : 스크립트 t1.daumcdn.net
            //                   -> iframe  t1.kakaocdn.net   (frame-src)
            //                   -> 광고 요청 *.daum.net       (connect-src)
            //   GA4          : 스크립트 www.googletagmanager.com
            //                   -> 수집    www.google-analytics.com
            //
            // 도메인을 추가할 때는 배포 후 콘솔에 CSP 위반이 남지 않는지
            // 반드시 확인할 것. 위반은 에러 페이지 없이 빈 화면으로만 나타난다.
            value: [
              "default-src 'self'",
              //   AdSense : 스크립트 pagead2.googlesyndication.com
              //             -> iframe  googleads.g.doubleclick.net, tpc.googlesyndication.com
              //             -> 검증    *.adtrafficquality.google
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.googletagmanager.com https://*.kakaocdn.net https://*.daumcdn.net https://*.kakao.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://partner.googleadservices.com https://www.googletagservices.com https://adservice.google.com https://*.adtrafficquality.google",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              // GA4 는 수집 요청을 한 곳으로만 보내지 않는다. 실제로 관측된 것만
              // 적어도 www.google-analytics.com, analytics.google.com,
              // www.google.com 세 곳이다. 와일드카드는 상위 도메인 자체를
              // 포함하지 않으므로(*.analytics.google.com 은 analytics.google.com
              // 을 커버하지 않는다) 둘 다 적는다.
              "connect-src 'self' https://rttphluffayixqppypvs.supabase.co wss://rttphluffayixqppypvs.supabase.co https://api.openai.com https://*.pstatic.net https://*.kakao.com https://*.kakaocdn.net https://*.daumcdn.net https://*.daum.net https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.google.com https://stats.g.doubleclick.net https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://adservice.google.com",
              "frame-src 'self' https://*.kakao.com https://*.kakaocdn.net https://*.daumcdn.net https://*.daum.net https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://www.google.com",
              "frame-ancestors 'none'",
            ].join("; ") + ";"
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

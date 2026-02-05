# [Master PRD] Project: CORE (Final Guru Edition)

## 1. 프로젝트 개요 (Overview)
* **제품명:** **CORE** (코어)
    * *의미:* The Essence of Investment. 시장의 소음(Noise)에 흔들리지 않는 투자의 중심.
* **핵심 가치:** Timeless (변치 않는), Intellectual (지적), Anti-Noise (소음 차단).
* **타겟 시장:** Global (KR, EN, VN).
* **플랫폼:** **Web-First Hybrid App** (Next.js + Capacitor).

## 2. 디자인 시스템 (Design System)
* **Color:**
    * **Primary:** `Sky Blue 500 (#0EA5E9)` (브랜드/버튼/신뢰)
    * **Emphasis:** `Deep Navy (#0F172A)` (강조 텍스트/무게감)
    * **Background:** `Clean White` + 은은한 Sky Blue 그라데이션.
* **Font:**
    * **Display:** `Newsreader` (Serif) - 감성/철학/명언.
    * **UI:** `Inter` (Sans) - 데이터/가독성/숫자.
* **Glassmorphism Spec:**
    * `.glass-panel`: `bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]`
    * `.glass-card`: `bg-white/50 backdrop-blur-md border border-white/40 hover:bg-white/80 transition-all`
* **Motion:** `framer-motion` (Soft Page Transition, Number Count-up, Path Drawing).

## 3. 상세 기능 명세 (Detailed Feature Specs)

### [기능 1] 구루와의 대화 (Guru Chat)
* **Concept:** "Select Your Mentor" (나만의 투자 이사회 소집).
* **Process:**
    1.  **Selection UI:** 대화방 진입 시 워렌 버핏, 존 보글, 피터 린치 중 1명을 선택. (인물별 일러스트 카드).
    2.  **Persona System:** 선택된 구루의 어투, 철학, 명언 데이터를 기반으로 `System Prompt` 동적 변경.
* **Initial Gurus:**
    * **Warren Buffett:** 가치투자, 장기보유, 유머.
    * **John Bogle:** 인덱스 펀드, 비용 절감, 시장 효율성.
    * **Peter Lynch:** 생활 속 투자, 성장주, 발로 뛰는 리서치.
* **UI:** 메시지 Float-up 효과, 구루별 고유 아이콘/아바타 표시.

### [기능 2] 투자 계산기 (Investment Calculators)
**로그인 없이 즉시 사용 가능 (Guest Mode). 화폐 단위(￦, $, ₫) 자동 변환.**
1.  **단일 종목 했제 (Single Regret):** "그때 샀더라면..." 시각화. (그래프 선 그리기 애니메이션).
2.  **포트폴리오 했제 (Portfolio Regret):** 내 포트폴리오 데이터 연동 수익률 시뮬레이션.
3.  **경제적 자유 계산기 (FIRE Calculator):** 월 복리 계산 및 목표 도달 시간 예측.

### [기능 3] 내 포트폴리오 (My Portfolio)
* **Hub:** 앱의 데이터 허브.
* **UI:** 도넛 차트 및 카드 리스트 (Masonry Layout).
* **Empty State:** "첫 번째 투자를 기록하세요" + `[+ 자산 추가]` 버튼.

### [기능 4] 투자 정보 (Anti-Noise Info)
* **Contents:**
    * **틀린 예측:** 과거의 비관적 뉴스(흑백 처리) vs 현재의 폭등 주가(컬러 강조).
    * **오늘의 명언:** 매일 자정 변경, 사용자 언어로 자동 번역 노출.

## 4. 기술 스택 및 비용 전략 (Tech Stack & Cost Strategy)

### 4.1 Core Stack
* **Framework:** Next.js 14 (App Router), TypeScript.
* **Styling:** Tailwind CSS, Shadcn/ui.
* **State:** Zustand.
* **Data:** `@tanstack/react-query`, `yahoo-finance2`.
* **Auth/DB:** **Supabase** (Auth: Google/Email, DB: PostgreSQL).
* **Deploy:** Vercel (Web), Capacitor (App).

### 4.2 AI Model & Cost Optimization (중요)
* **Primary Model:** **`gpt-4o-mini`** (Default).
    * *Reason:* GPT-5 대비 200배 저렴하며, 페르소나 연기에 최적화됨.
* **Token Diet Strategy:**
    * 포트폴리오 전체가 아닌 "비중 상위 5개 종목"만 프롬프트에 주입.
    * 답변 길이 `max_tokens: 300` 제한.

## 5. 배포 및 운영 전략
* **Store:** App Store, Play Store 출시.
* **Legal:** `/legal/privacy`, `/legal/terms` 페이지 생성.
* **Remote Config:** Supabase `app_config` 테이블로 점검 모드 제어.

## 6. 보안 및 데이터 보호 (Security)
* **RLS:** `auth.uid() == user_id` 조건으로 내 데이터만 접근 허용.
* **Server Actions:** 모든 외부 API(OpenAI, Yahoo)는 서버 사이드에서 호출.
* **Input Validation:** Zod 사용.

## 7. 비용 관리 (Cost Control / Rate Limiting)
* **Tool:** **Upstash Redis** (`@upstash/ratelimit`).
* **Chat Limit:** 유저당 **1분 15회 / 일일 50회** 제한.
* **Data Limit:** IP당 **1분 60회** 요청 제한.

## 8. 환경 변수 (Environment Variables)
**개발 시작 시 `.env.local`에 설정할 키 목록:**
* `OPENAI_API_KEY`
* `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
* `NEXT_PUBLIC_SENTRY_DSN`
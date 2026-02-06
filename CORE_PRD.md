# [Master PRD] Project: CORE (Stitch & Mobile-First Edition)

## 1. 프로젝트 개요 (Overview)
* **제품명:** CORE (코어) - The Essence of Investment.
* **플랫폼:** **Mobile-First Web App** (반응형 필수, 모바일 뷰 최우선).
* **언어 설정:** **한국어 (Korean) 기본**. (i18n 도입 전까지 모든 UI 텍스트는 한국어로 하드코딩).
* **개발 전략 (Phasing):**
    * **Priority:** 디자인 디테일보다 **'전체 메뉴의 기능 구현'**을 최우선으로 진행.
    * **Step:** 1주 차에 하단 탭 5개 메뉴의 핵심 기능을 모두 구현하여 '전체 흐름'을 완성한 후, 2주 차부터 디테일(데이터 연동) 고도화.

## 2. 디자인 시스템 및 워크플로우 (Design System via Stitch)
**[CRITICAL] 모든 UI 개발은 반드시 Google Stitch (MCP)를 통해 수행한다.**
* **Design Tool:** **Google Stitch via MCP**.
    * *명령 원칙:* "Stitch를 사용하여 모바일 뷰에 최적화된 [기능명] UI 코드를 생성해줘."
* **Style Concept:** **Clean Glassmorphism**.
    * `bg-white/70`, `backdrop-blur-xl` 등 투명도와 블러를 적극 활용.
    * **Primary Color:** Sky Blue 500 (`#0EA5E9`).
    * **Text:** Deep Navy (`#0F172A`).
* **Icons:** **Lucide React** 라이브러리 필수 사용.
* **Layout:**
    * **Mobile First:** 모바일 화면(375px~430px)에서 가장 완벽하게 보여야 함.
    * **Navigation:** **Bottom Tab Bar (하단 고정)**.

## 3. 네비게이션 구조 (Bottom Tab Order)
앱 하단에 고정된 탭 바(Tab Bar)는 다음 순서와 아이콘으로 배치한다.
1.  **구루 (Guru):** `MessageCircle` or `Bot` 아이콘.
2.  **계산기 (Calc):** `Calculator` 아이콘.
3.  **내 자산 (Portfolio):** `PieChart` 아이콘.
4.  **인사이트 (Insights):** `Lightbulb` or `Zap` 아이콘.
5.  **내 정보 (Profile):** `User` 아이콘.

## 4. 상세 기능 명세 (Feature Specs)

### [Tab 1] 구루와의 대화 (Guru Chat)
* **기능:** 워렌 버핏, 피터 린치 등 투자 거장 페르소나와 대화.
* **초기 구현:** 복잡한 RAG(데이터 검색) 로직보다, **채팅방 UI와 페르소나 선택 기능** 구현에 집중.

### [Tab 2] 투자 계산기 (Calculator) - **High Priority**
**[참조] 아래 레퍼런스 사이트의 기능과 로직을 그대로 구현한다 (Copy Logic).**
1.  **했제 계산기 (Regret Calculator):**
    * *Reference:* `https://the-hedge.vercel.app/regret.html`
    * *기능:* 종목, 날짜, 금액 입력 시 -> "그때 샀으면 지금 얼마인지" 계산 및 차트 표시.
2.  **복리 계산기 (Compound Calculator):**
    * *Reference:* `https://the-hedge.vercel.app/compound.html`
    * *기능:* 초기금, 월 적립액, 이자율, 기간 입력 시 -> 월별 자산 증가 추이 계산 및 차트 표시.
* **UI:** Stitch를 통해 모바일에 최적화된 카드 형태 UI로 재구성.

### [Tab 3] 내 자산 (Portfolio)
* **기능:** 사용자가 보유한 종목과 수량을 입력하면 현재 가치와 비중을 시각화.
* **UI:** 도넛 차트(Recharts 사용) + 종목 리스트 카드.
* **CRUD:** 종목 추가/수정/삭제 기능 우선 구현.

### [Tab 4] 인사이트 (Insights)
* **기능:** 시장의 소음(Noise)과 진실(Signal)을 구분해주는 콘텐츠.
* **구성:** '오늘의 명언', '잘못된 뉴스 다시보기(과거 공포 뉴스 vs 현재 주가)'.

### [Tab 5] 내 정보 (Profile)
* **기능:** 로그인/로그아웃, 앱 설정, 구독 관리.

## 5. 기술 스택 (Tech Stack)
* **Framework:** Next.js 14 (App Router).
* **Styling:** Tailwind CSS + **Stitch Generated Code**.
* **State Management:** Zustand.
* **DB/Auth:** Supabase.
* **Data:** `yahoo-finance2` (No API Key).

## 6. 개발 프로세스 가이드 (for AI Agent)
1.  **Setup:** Next.js, Tailwind, Lucide, Zustand 설정.
2.  **Design (Stitch):** Stitch MCP를 호출하여 **App Shell (하단 탭바)** 및 공통 레이아웃 디자인 생성.
3.  **Feature Build (Fast Track):**
    * 탭 1~5의 페이지 껍데기(Skeleton) 생성.
    * **Tab 2(계산기)**의 로직 구현 (레퍼런스 사이트 참조).
    * **Tab 3(포트폴리오)**의 CRUD 구현.
4.  **Refine:** 데이터 연동 및 버그 수정.
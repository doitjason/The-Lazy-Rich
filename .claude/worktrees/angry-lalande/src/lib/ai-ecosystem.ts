/**
 * AI Ecosystem Map — 경량화된 앱 내 서비스 인덱스
 * 
 * AI 투자 멘토의 시스템 프롬프트에 주입되어, 멘토가 앱 내 모든 서비스를
 * 100% 이해하고 유저의 대화 맥락에 맞춰 자율적으로 추천할 수 있게 합니다.
 * 
 * ⚠️ 토큰 효율을 위해 최소한의 정보만 압축하여 전달합니다.
 *    새로운 칼럼/도서 추가 시 이 인덱스는 자동으로 갱신됩니다.
 */

import { COLUMNS } from "@/data/columns";
import { RECOMMENDED_BOOKS } from "@/data/books";

// ─── 경량화된 인덱스 생성 (메모리 캐시) ─────────────────────────

let _cachedEcosystemPrompt: string | null = null;

/**
 * 앱 생태계 맵을 경량화된 문자열로 생성합니다.
 * 한 번 생성되면 메모리에 캐싱하여 매 요청마다 재생성하지 않습니다.
 */
export function getAppEcosystemMap(): string {
    if (_cachedEcosystemPrompt) return _cachedEcosystemPrompt;

    // 1. 칼럼 인덱스 (id | 제목 | 카테고리 | 핵심태그)
    const columnIndex = COLUMNS.map(col =>
        `${col.id}|${col.title}|${col.categoryLabel}|${col.tags.slice(0, 3).join(",")}`
    ).join("\n");

    // 2. 도서 인덱스 (id | 제목 | 저자 | 핵심태그 | 난이도)
    const bookIndex = RECOMMENDED_BOOKS.map(book =>
        `${book.id}|${book.title}|${book.author}|${book.tag}|${book.level || "intermediate"}`
    ).join("\n");

    _cachedEcosystemPrompt = `
═══ [앱 내 서비스 생태계 — App Ecosystem Map] ═══

당신은 이 앱의 투자 생태계를 완벽하게 이해하는 거장입니다. 특정 조건에만 기계적으로 반응하는 챗봇이 아닙니다. 유저와의 대화 맥락을 총체적으로 파악하여, 아래 도구 중 유저에게 가장 가치 있는 0~2개를 스스로 판단해 자연스럽게 제안하세요.

[⛔️ 절대 규칙]
- 매 답변마다 기계적으로 추천하지 마세요. 정말 유저에게 도움이 될 때만 제안합니다.
- 추천할 때는 반드시 "왜 이것이 당신에게 필요한지"를 당신의 철학적 어조로 먼저 설명한 뒤, 마지막에 태그를 출력하세요.
- 태그는 답변 텍스트의 가장 마지막 줄에만 위치해야 합니다. 본문 중간에 넣지 마세요.
- 태그를 번역하거나 변형하지 마세요. 정확히 [ACTION:...] 형식 그대로 출력해야 버튼이 작동합니다.
- 사용자가 포트폴리오 분석을 요청했는데 데이터가 없는 경우에만 [ACTION:PORTFOLIO:create]를 출력하세요.
- 비로그인 유저가 포트폴리오 분석을 명시적으로 요청한 경우에만 [ACTION:LOGIN]을 출력하세요.

─── 1. 🧮 재무 계산기 ───
유저의 문맥에서 종목명이나 금액을 파악하여 태그에 직접 삽입하세요.

A. 했제 계산기 V1 (특정 종목의 과거 수익률 확인)
   형식: [ACTION:CALC:regret:종목티커:금액]
   예시: 유저가 "테슬라 1000만원 투자했으면" → [ACTION:CALC:regret:TSLA:10000000]
   예시: 유저가 "엔비디아 $5000" → [ACTION:CALC:regret:NVDA:5000]
   적합한 맥락: 과거 투자를 후회하는 감정, 특정 종목의 과거 수익률이 궁금할 때

B. 했제 계산기 V2 (특정 포트폴리오의 과거 수익률(백테스트) 확인. 나의 포트폴리오 포함)
   형식: [ACTION:CALC:portfolio]
   적합한 맥락: 포트폴리오 방어력 점검, 자산배분 전략 논의, 백테스트 필요 시

C. 자유 계산기 (복리/은퇴/경제적 자유 시뮬레이션)
   형식: [ACTION:CALC:fire]
   적합한 맥락: 은퇴 목표 설정, 적립식 투자 효과 확인, FIRE 관련 대화

─── 2. 📰 인사이트 & 심화 학습 ───

시장 상황 점검:
   형식: [ACTION:MARKET]
   적합한 맥락: 현재 시황 질문, 매크로 지표 궁금, 공포/탐욕 지수 등

전문가 칼럼 (id|제목|카테고리|태그):
${columnIndex}
   형식: [ACTION:COLUMN:칼럼id]
   예시: [ACTION:COLUMN:peace-portfolio]

추천 도서 (id|제목|저자|태그|난이도):
${bookIndex}
   형식: [ACTION:BOOK:도서id]
   예시: [ACTION:BOOK:psychology-of-money]
   적합한 맥락: 투자 철학 논의, 심화 학습 권유, 멘탈 관리 필요 시

─── 3. 📊 포트폴리오 & 계정 ───

포트폴리오 신규 등록 (데이터 없을 시):
   형식: [ACTION:PORTFOLIO:create]
   적합한 맥락: 유저가 포트폴리오 분석을 요청했으나 등록된 종목이 없을 때만 사용

포트폴리오 정밀 지표 확인 (배당, 섹터 비중, 벤치마크 비교 등):
   형식: [ACTION:PORTFOLIO:metrics]
   적합한 맥락: 유저의 자산이 등록되어 있고, 배당/섹터/성과 심층 분석이 필요할 때

로그인 안내 (비로그인 유저만):
   형식: [ACTION:LOGIN]
   적합한 맥락: 비로그인 유저가 포트폴리오 분석을 명시적으로 요청한 경우에만
`.trim();

    return _cachedEcosystemPrompt;
}

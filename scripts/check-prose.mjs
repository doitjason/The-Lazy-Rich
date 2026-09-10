#!/usr/bin/env node
/**
 * 문체 검사기 — AI Slop 지표 자동 탐지
 *
 * 사용법:
 *   node scripts/check-prose.mjs            전체 검사
 *   node scripts/check-prose.mjs <id>       특정 칼럼만
 *
 * 기준은 .agent/skills/column_auditor/SKILL.md 의 [G. 윤문 규칙] 과 [J. 읽을 가치].
 *
 * 분량 하한이 지켜진 이유는 규칙이 좋아서가 아니라 검사기가 있었기 때문이다.
 * 문체 규칙도 문서로만 두면 지켜지지 않으므로, 기계로 판정 가능한 것만 여기서 잡는다.
 *
 * [금지] 항목이 하나라도 있으면 exit 1.
 * [주의] 항목은 기계가 오판할 수 있어 보고만 하고 종료 코드에 반영하지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/columns';
const only = process.argv[2];

/** 재사용이 금지된 상투어. SKILL.md [G-2] 와 동기화할 것. */
const CLICHES = [
  '든든한 길잡이', '든든한 나침반', '든든한 조력자',
  '부드럽게 조언', '일깨워줍니다',
  '큰 영감을 줄 것입니다',
];

/** 이미 소진된 비유. SKILL.md [G-1] 과 동기화할 것. */
const TIRED_METAPHORS = ['눈덩이', '마라톤', '항해', '나침반', '씨앗을 심', '근육', '다이어트'];

/** 양비론 마무리. 마지막 문단에서만 검사한다. */
const FENCE_SITTING = [
  '정답은 없', '균형이 중요', '본인에게 맞는', '각자의 판단',
  '신중하게 접근', '생각해 보십시오', '고민해 보시기 바랍니다',
];

const CONNECTIVES = ['또한', '게다가', '결론적으로', '즉,', '다시 말해', '따라서', '그러므로'];

/** 3줄 요약을 제외한 본문. */
function bodyOf(src) {
  const lines = src.split(/\r?\n/);
  let found = false, items = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!found) {
      if (t.includes('3줄 요약')) found = true;
      continue;
    }
    if (t === '') continue;
    if (/^\d+\./.test(t)) { items++; continue; }
    if (items > 0) return lines.slice(i).join('\n');
  }
  return src;
}

/**
 * 헤딩·인용·CTA·목록을 제외한 서술 문단만 돌려준다.
 *
 * 목록을 빼는 이유: 번호 목록의 각 항목은 문장으로 세면 "5문장 문단"으로 잡히지만
 * 화면에서는 항목별로 줄이 나뉘어 렌더된다. 모바일 가독성 기준의 대상이 아니다.
 */
function paragraphsOf(body) {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) =>
      p &&
      !p.startsWith('#') &&
      !p.startsWith('>') &&
      !/^\[.*\]\(.*\)$/.test(p) &&
      !/^\d+\.\s/.test(p) &&   // 번호 목록
      !/^-\s/.test(p)          // 불릿 목록
    );
}

function sentencesOf(p) {
  return p.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function audit(id, src) {
  const body = bodyOf(src);
  const paras = paragraphsOf(body);
  const banned = [];
  const warn = [];

  // --- [금지] ---

  // 본문 볼드체 (헤딩 제외)
  const boldHits = body.replace(/^#+.*$/gm, '').match(/\*\*[^*\n]+\*\*/g);
  if (boldHits) banned.push(`본문 볼드체 ${boldHits.length}건: ${boldHits.slice(0, 2).join(', ')}`);

  for (const c of CLICHES) {
    if (body.includes(c)) banned.push(`상투어: "${c}"`);
  }

  // 양비론 마무리 — 마지막 서술 문단만
  const last = paras.at(-1) ?? '';
  for (const f of FENCE_SITTING) {
    if (last.includes(f)) banned.push(`양비론 마무리: "${f}"`);
  }

  // --- [주의] ---

  // 종결어미 3연속 동일
  const allSentences = paras.flatMap(sentencesOf);
  let run = 1;
  for (let i = 1; i < allSentences.length; i++) {
    const a = allSentences[i - 1].slice(-4);
    const b = allSentences[i].slice(-4);
    const same = (a.endsWith('습니다.') && b.endsWith('습니다.')) ||
                 (a.endsWith('입니다.') && b.endsWith('입니다.'));
    run = same ? run + 1 : 1;
    if (run === 4) {
      warn.push(`종결어미 4문장 연속 동일: "${allSentences[i].slice(0, 26)}…"`);
      run = 1;
    }
  }

  // 전환어 문단당 2개 이상
  for (const p of paras) {
    const n = CONNECTIVES.reduce((s, c) => s + (p.split(c).length - 1), 0);
    if (n >= 2) warn.push(`전환어 ${n}개/문단: "${p.slice(0, 26)}…"`);
  }

  // 문단당 5문장 이상 (모바일)
  for (const p of paras) {
    const n = sentencesOf(p).length;
    if (n >= 5) warn.push(`${n}문장 문단 (모바일 가독성): "${p.slice(0, 26)}…"`);
  }

  // 소진된 비유
  const metaphors = TIRED_METAPHORS.filter((m) => body.includes(m));
  if (metaphors.length) warn.push(`소진된 비유: ${metaphors.join(', ')}`);

  // 섹션 길이 균일성 — 표준편차가 평균의 25% 미만이면 대칭 구조 의심
  const heads = body.split(/^##\s+/m).slice(1).map((s) => s.replace(/\s+/g, '').length);
  if (heads.length >= 4) {
    const avg = heads.reduce((a, b) => a + b, 0) / heads.length;
    const sd = Math.sqrt(heads.reduce((a, b) => a + (b - avg) ** 2, 0) / heads.length);
    if (sd / avg < 0.25) {
      warn.push(`섹션 길이가 균일함 (편차 ${Math.round((sd / avg) * 100)}%) — 대칭 구조 의심`);
    }
  }

  return { id, banned, warn };
}

const files = fs.readdirSync(DIR)
  .filter((f) => f.endsWith('.mdx'))
  .filter((f) => !only || f === `${only}.mdx`);

if (!files.length) {
  console.error(`대상 없음: ${only ?? DIR}`);
  process.exit(2);
}

const results = files.map((f) => audit(f.replace(/\.mdx$/, ''), fs.readFileSync(path.join(DIR, f), 'utf8')));

let bannedTotal = 0, warnTotal = 0;
for (const r of results) {
  if (!r.banned.length && !r.warn.length) continue;
  console.log(`\n${r.id}`);
  for (const b of r.banned) { console.log(`  [금지] ${b}`); bannedTotal++; }
  for (const w of r.warn) { console.log(`  [주의] ${w}`); warnTotal++; }
}

console.log('\n' + '-'.repeat(52));
console.log(`${files.length}편 검사 | 금지 ${bannedTotal}건 | 주의 ${warnTotal}건`);

if (bannedTotal) {
  console.log('\n[금지] 항목은 발행 전에 반드시 고친다.');
  process.exit(1);
}
console.log('[주의] 는 기계 판정이므로 사람이 보고 결정한다.');

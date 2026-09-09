#!/usr/bin/env node
/**
 * 추천도서 소개글 분량 검사기
 *
 * 사용법:
 *   node scripts/check-books.mjs          미달 항목만 출력
 *   node scripts/check-books.mjs --all    전체 목록 출력
 *
 * 도서 페이지는 전부 쿠팡 제휴 링크를 달고 있다. 제휴 링크가 붙은 페이지의
 * 본문이 얇으면 구글은 이를 thin affiliate 로 분류한다. 실제로 이 사이트는
 * 2026-03 에 "가치가 별로 없는 콘텐츠" 사유로 애드센스 반려를 받았다.
 *
 * 그래서 칼럼(2,000자)보다는 낮되, 제휴 페이지로서 최소한의 독자적 가치를
 * 담을 수 있는 선을 하한으로 잡는다.
 *
 * 측정 기준은 check-columns.mjs 와 같다. 3줄 요약을 제외한 본문에서
 * 공백을 뺀 글자 수.
 *
 * 미달이 있으면 exit code 1 로 종료한다.
 */
import fs from 'node:fs';

const FILE = 'src/data/books.ts';
const MIN = 1200;          // 발행 하한
const RECOMMENDED = 1400;  // 권장 하한
const showAll = process.argv.includes('--all');

/**
 * 3줄 요약 블록을 제외한 본문을 돌려준다.
 *
 * 칼럼(.mdx)은 요약 항목이 연달아 붙어 있지만 도서는 항목 사이가 빈 줄로
 * 나뉜다. 빈 줄을 종료 신호로 쓰면 도서에서 첫 항목만 잘려 나가므로,
 * 빈 줄은 건너뛰고 "번호로 시작하지 않는 첫 문단"을 본문 시작으로 본다.
 */
function bodyOf(src) {
  const lines = src.split(/\r?\n/);
  let found = false, items = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!found) {
      if (t.includes('3줄 요약') || t.includes('3줄요약')) found = true;
      continue;
    }
    if (t === '') continue;
    if (/^\d+\./.test(t)) { items++; continue; }
    if (items > 0) return lines.slice(i).join('\n');
  }
  return src;
}

/** 공백을 제거한 순수 글자 수. */
function charCount(body) {
  return body.replace(/\s+/g, '').length;
}

if (!fs.existsSync(FILE)) {
  console.error(`파일을 찾을 수 없습니다: ${FILE}`);
  process.exit(2);
}

const src = fs.readFileSync(FILE, 'utf8');
const BS = String.fromCharCode(92);

const ids = [...src.matchAll(/"id":\s*"([^"]+)"/g)].map((m) => m[1]);
const descRe = new RegExp('"longDescription":\\s*"((?:[^"' + BS + BS + ']|' + BS + BS + '.)*)"', 'g');
const descs = [...src.matchAll(descRe)].map((m) => JSON.parse('"' + m[1] + '"'));

if (ids.length !== descs.length) {
  console.error(`파싱 불일치: id ${ids.length}개, longDescription ${descs.length}개`);
  process.exit(2);
}

/**
 * 렌더러(src/app/books/[id]/page.tsx)는 40자 미만이고 마침표가 없는 블록을
 * 제목(h4)으로 승격시킨다. 제목이 연달아 두 개 나오면 본문 없는 제목이
 * 화면에 그대로 노출되므로, 문단을 끼워 넣다가 위치를 잘못 잡은 것이다.
 */
function isHeadingBlock(block) {
  return block.length < 40 && !block.includes('.');
}

function adjacentHeadings(body) {
  const blocks = body.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  const bad = [];
  for (let i = 0; i < blocks.length - 1; i++) {
    if (isHeadingBlock(blocks[i]) && isHeadingBlock(blocks[i + 1])) {
      bad.push(`${blocks[i]} → ${blocks[i + 1]}`);
    }
  }
  return bad;
}

const rows = ids
  .map((id, i) => {
    const body = bodyOf(descs[i]);
    return { id, chars: charCount(body), headingPairs: adjacentHeadings(body) };
  })
  .sort((a, b) => a.chars - b.chars);

const under = rows.filter((r) => r.chars < MIN);
const belowRec = rows.filter((r) => r.chars >= MIN && r.chars < RECOMMENDED);

const list = showAll ? rows : under;
if (list.length) {
  console.log('ID'.padEnd(34) + '글자수'.padStart(7) + '부족'.padStart(7));
  console.log('-'.repeat(48));
  for (const r of list) {
    const gap = r.chars < MIN ? String(MIN - r.chars) : '-';
    console.log(r.id.padEnd(34) + String(r.chars).padStart(7) + gap.padStart(7));
  }
  console.log('-'.repeat(48));
}

const total = rows.reduce((s, r) => s + r.chars, 0);
console.log(`전체 ${rows.length}권 | 평균 ${Math.round(total / rows.length).toLocaleString()}자`);
console.log(`하한 ${MIN.toLocaleString()}자 미달: ${under.length}권` +
  (under.length ? ` (총 ${under.reduce((s, r) => s + (MIN - r.chars), 0).toLocaleString()}자 부족)` : ''));
console.log(`권장 ${RECOMMENDED.toLocaleString()}자 미달: ${belowRec.length}권`);

const structural = rows.filter((r) => r.headingPairs.length);
if (structural.length) {
  console.log('');
  console.log('제목 블록이 연달아 붙은 곳 (본문 없는 제목이 렌더된다):');
  for (const r of structural) {
    for (const pair of r.headingPairs) console.log(`  ${r.id}: ${pair}`);
  }
}

if (under.length || structural.length) {
  console.log('');
  console.log('미달 항목은 SKILL.md 의 [도서 소개글] 항목대로 보강한다.');
  console.log('책이 실제로 주장하는 것 / 개념 하나를 풀어서 / 한계와 안 맞는 독자 / 한국 독자 조건');
  process.exit(1);
}
console.log('');
console.log('전 도서가 분량 하한을 충족합니다.');

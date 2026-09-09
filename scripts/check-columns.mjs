#!/usr/bin/env node
/**
 * 칼럼 분량 검사기
 *
 * 사용법:
 *   node scripts/check-columns.mjs          미달 항목만 출력
 *   node scripts/check-columns.mjs --all    전체 목록 출력
 *
 * 기준은 .agent/skills/column_auditor/SKILL.md 의 [분량 하한] 항목과 같다.
 * 본문 2,000자 이상 (3줄 요약 제외, 링크/헤딩/공백 제외).
 *
 * 미달이 있으면 exit code 1 로 종료하므로 CI 나 커밋 훅에 걸 수 있다.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/columns';
const MIN = 2000;          // 발행 하한
const RECOMMENDED = 2300;  // 권장 하한
const showAll = process.argv.includes('--all');

/** 3줄 요약 블록을 제외한 본문을 돌려준다. */
function bodyOf(src) {
  const lines = src.split(/\r?\n/);
  let found = false, items = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.includes('3줄 요약') || t.includes('3줄요약')) { found = true; continue; }
    if (found) {
      if (t === '' && items > 0) return lines.slice(i).join('\n');
      if (/^\d\./.test(t)) items++;
    }
  }
  return src;
}

/** 링크 전체, 헤딩 마크업, 공백을 제거한 순수 글자 수. */
function charCount(body) {
  return body
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\s+/g, '')
    .length;
}

if (!fs.existsSync(DIR)) {
  console.error(`디렉터리를 찾을 수 없습니다: ${DIR}`);
  process.exit(2);
}

const rows = fs.readdirSync(DIR)
  .filter(f => f.endsWith('.mdx'))
  .map(f => {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    return { id: f.replace(/\.mdx$/, ''), chars: charCount(bodyOf(src)) };
  })
  .sort((a, b) => a.chars - b.chars);

const under = rows.filter(r => r.chars < MIN);
const belowRec = rows.filter(r => r.chars >= MIN && r.chars < RECOMMENDED);

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
console.log(`전체 ${rows.length}편 | 평균 ${Math.round(total / rows.length).toLocaleString()}자`);
console.log(`하한 ${MIN.toLocaleString()}자 미달: ${under.length}편` +
  (under.length ? ` (총 ${under.reduce((s, r) => s + (MIN - r.chars), 0).toLocaleString()}자 부족)` : ''));
console.log(`권장 ${RECOMMENDED.toLocaleString()}자 미달: ${belowRec.length}편`);

if (under.length) {
  console.log('');
  console.log('미달 항목은 SKILL.md 의 [분량을 채우는 방법] 네 가지로 보강한다.');
  console.log('반례 추가 / 한계 명시 / 한국 조건 보강 / 출처 구체화');
  process.exit(1);
}
console.log('');
console.log('전 칼럼이 분량 하한을 충족합니다.');

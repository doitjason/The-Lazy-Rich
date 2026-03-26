---
description: 최신 투자 트렌드 분석 및 가이드라인 준수 칼럼 제작 워크플로우
---
# Workflow: Write Column (지능형 칼럼 제작)

본 워크플로우는 주제 발굴부터 중복 검토, 최종 검수까지 'The Lazy Rich'의 독창적이고 고품질인 칼럼을 제작하는 과정을 정의합니다.

## 단계별 프로세스 (Process Steps)

### Step 1: 주제 선정 및 중복 검토 (Topic Selection & De-duplication)
- **자율 발굴 시**: `column_auditor` 스킬을 활용하여 `src/content/columns` 내 기존 파일을 먼저 분석한다. 중복되지 않는 **Readable & Clickable** 주제 5개를 선별하여 유저에게 제안한다.
- **주제 제공 시**: 유저가 제공한 주제가 기존 칼럼과 겹치는지 검사하고, 유사할 경우 보완된 관점을 제시하여 승인을 받는다.

### Step 2: 기초 설계 (Structuring)
- `column_auditor` 스킬의 가이드에 근거하여 칼럼의 전체 구조(3줄 요약, 소제목 위계, CTA 배치 등)를 설계한다.

### Step 3: 콘텐츠 제작 (Drafting)
- **Skill 활용**: `column_auditor` 스킬의 문체 및 스타일 규칙을 적용하며 글을 작성한다.
- **문체**: 인간 에디터가 독자에게 조언하는 듯한 생동감 있고 리드미컬한 문장을 사용한다.
- **주의**: 본문 내 볼드체(`**`) 사용 금지 규칙을 반드시 준수한다.

### Step 4: 스마트 링크 및 수치 검증 (Integration & Validation)
- 맥락상 독자가 직접 확인하고 싶어지는 피크 지점에 계산기(Regret V1/V2, Compound) 딥링크나 AI 멘토 질문 링크를 삽입한다.
- 본문 내 모든 수치가 삽입된 딥링크의 결과값과 100% 일치하는지 확인한다.

### Step 5: 스타일 및 무결성 검증 (Final Audit)
- **Skill 실행**: `column_auditor` 스킬을 호출하여 전체 결과물에 대한 최종 오딧(Audit)을 수행한다.
- 수치 오차, 스타일 위반, 법적 면책 조항 누락 등이 발견되면 즉시 수정한다.
- 검수 결과를 [스타일 준수 / 수치 정합성 / 링크 동작] 항목별로 요약하여 보고한다.

### Step 6: 데이터 등록 (Data Registration)
- 작성된 칼럼이 웹사이트 목록에 노출되도록 `src/data/columns.ts` 내 `COLUMNS` 배열의 최상단에 새로운 칼럼 객체를 추가한다.
- `id`, `title`, `subtitle`, `category`, `thumbnailEmoji`, `publishedAt` 등 모든 메타데이터를 일관성 있게 작성한다.

### Step 7: 최종 승인 및 보고 (Final Report)
- 모든 등록 과정을 마친 후 유저에게 최종 칼럼 전문과 배포 완료 사실을 보고한다.

---
schemaVersion: 2
title: "Mono-repo에 AI Agent 작업 지원 체계 구축하기"
description: "목적과 범위"
category: "미분류"
categorySlug: "uncategorized"
tags: []
publishedAt: "2026-08-10T14:28:00.000Z"
updatedAt: "2026-11-01T03:52:00.000Z"
---

### 목적과 범위

React Native WebView shell, Next\.js 콘텐츠, 공통 패키지가 함께 있는 프론트엔드 mono\-repo에 AI Agent\(Codex, Claude Code\)가 안전하게 작업할 수 있는 문서 구조와 검증 체계를 만들었다\. 이 글은 그 체계를 하나로 연결해 설명한다\. Agent가 과거 대화 없이 작업을 시작해 필요한 사실을 찾고, 실제 구현을 확인하고, 변경을 검증하고, 다음 세션에 근거를 남기는 전체 운영 방식을 다룬다\.

이 체계는 특정 모델에 전달하는 긴 프롬프트 하나가 아니다\. 다음 요소가 함께 만드는 피드백 루프다\.

```text
저장소 진입
  → 작업 범위와 완료 조건 확인
  → 사실의 소유 문서 선택
  → 실제 코드·설정·테스트로 현재 상태 확인
  → 작업 유형에 맞는 Skill 적용 (Claude Code는 hook이 강제)
  → 코드·테스트·소유 문서 변경
  → 로컬 검증과 플랫폼 수동 확인
  → 커밋 hook이 본문·테스트 동반·구조 검사
  → PR workflow 결과와 리뷰 확인
  → 커밋 본문에 결정 이유와 검증 증거 보존
  → 다음 세션이 갱신된 현재 사실에서 다시 시작
```

대상 독자는 다음과 같다\.

- 과거 대화 상태 없이 새 작업을 시작하는 AI Agent
- 저장소의 작업 방식을 처음 확인하는 개발자
- 구조 변경이나 신뢰 경계 변경을 리뷰하는 개발자
- 테스트와 CI 실패 원인을 추적하는 유지보수 담당자

개별 기능의 제품 설명, 일정, 사업 계획은 다루지 않는다\.

> 저장소 안의 정본은 ` docs/AI_AGENT_HARNESS.md `다\. 이 글은 그 정본과 각 소유 문서를 처음 읽는 사람이 한 번에 이해하도록 엮은 설명이다\. 내용이 다르면 실행 가능한 계약\(코드·스크립트·workflow\)이 현재 사실이다\.

표기: 프로젝트 고유 접두사는 ` {prefix} `, 패키지 scope는 ` @scope `, workspace 패키지 이름은 ` &lt;app 패키지&gt; `·` &lt;web 패키지&gt; `로 바꿔 적었다\.

### 도입 배경

React Native WebView shell, Next\.js 콘텐츠, 공통 계약 패키지와 네이티브 플랫폼 설정이 함께 있는 mono\-repo에서는 다음 문제가 반복되기 쉽다\.

- 실행 명령, 현재 구조와 목표 규칙이 한 문서에 섞이면 일부만 갱신되어 충돌한다\.
- 긴 단일 프롬프트는 작업과 관계없는 문맥까지 싣고 workspace 고유 제약을 묻는다\.
- 기능 계약을 중앙 문서에만 두면 코드 변경과 문서 갱신 시점이 분리된다\.
- 자연어 규칙만 있으면, Agent가 규칙을 읽었더라도 구조·테스트 위반을 merge 전에 기계적으로 발견하기 어렵다\.
- 도구별 규칙 본문을 따로 관리하면 한쪽만 수정되는 순간 도구마다 다른 규칙을 적용한다\.
- 문서에 Skill 포인터만 적어 두면 Agent가 Skill을 열지 않고 기억으로 작업한다\.
- 작업 계획과 완료 기록을 별도 문서로 계속 쌓으면 현재 사실과 과거 결정의 소유권이 겹친다\.

현재 체계는 이를 해결하기 위해 다음 원칙을 쓴다\.

1. 저장소 진입점은 짧은 라우터로 유지한다\.
1. 사실 하나에는 소유 문서 하나만 둔다\.
1. 전역 규칙과 workspace·feature 지역 지식을 분리한다\.
1. 작업 절차는 필요할 때만 Skill로 불러온다\.
1. 기계적으로 판정할 수 있는 규칙은 test·script·CI로 바꾼다\.
1. 빠뜨리면 이력에 남는 작업\(코드 수정, 커밋, PR, 배포\)은 실행 직전 관문으로 Skill 확인을 강제한다\.
1. 구현되지 않은 문서는 미리 만들지 않고 도입 조건만 유지한다\.
1. 구조적 결정의 과거 이유는 커밋 본문이 소유한다\.

### 전체 문서와 검증 구조

다음 트리는 AI Agent 작업 지원 체계에 직접 연결되는 문서와 실행 장치만 표시한다\.

```text
.
├── AGENTS.md                              # 도구 중립 진입점과 문서 라우터
├── CLAUDE.md -> AGENTS.md                 # Claude용 루트 진입 symlink
├── TECH_RULES.md                          # 기술 스택·상위 아키텍처·금지 규칙
├── README.md                              # 실행·빌드·검증 명령의 단일 기준
├── .mise.toml                             # Node·Ruby·Java 버전
├── package.json                           # packageManager(pnpm 버전)
├── pnpm-workspace.yaml                    # workspace·catalog·install script 허용·patch·overrides
├── turbo.json                             # 루트 lint·test·typecheck·build 실행 (structure 필수 경로)
├── patches/                               # pnpm patch (react-native-webview 120Hz)
│
├── app/
│   ├── AGENTS.md                          # React Native workspace 지역 규칙
│   ├── CLAUDE.md -> AGENTS.md
│   ├── src/features/*/README.md           # Native feature 책임·계약·예외
│   ├── __mocks__/                         # 네이티브 SDK 공용 module mock
│   ├── jest.config.js
│   └── tests/
│       ├── unit/                          # 순수 로직·schema·store
│       └── integration/                   # RN render·platform adapter·native 경계
│
├── web/
│   ├── AGENTS.md                          # Next.js workspace 지역 규칙
│   ├── CLAUDE.md -> AGENTS.md
│   ├── src/features/*/README.md           # Web feature 책임·계약·예외
│   ├── __mocks__/                         # 공용 module mock
│   ├── tests/
│   │   ├── unit/                          # 순수 로직·schema·store·단일 컴포넌트
│   │   ├── integration/                   # storage·API·bridge·hook 연동
│   │   ├── e2e/                           # Playwright 핵심 브라우저 흐름
│   │   └── fixtures/                      # 테스트 데이터
│   ├── jest.config.mjs
│   └── playwright.config.ts
│
├── packages/
│   ├── shared/README.md                   # 브리지 토큰·schema·발신·처리 인덱스
│   └── design-system/README.md            # 공통 UI·아이콘·색상 카탈로그
│
├── docs/
│   ├── AI_AGENT_HARNESS.md                # 저장소 안의 canonical 설계 설명
│   ├── architecture/
│   │   ├── folder-structure.md            # 현재 폴더와 책임 스냅샷
│   │   └── service-boundaries.md          # App·Web·API·bridge 경계
│   ├── guides/new-screen.md               # 새 화면 추가 절차
│   ├── runbooks/deploy.md                 # 환경·빌드·배포 절차
│   └── specs/stackflow-kit-extraction.md  # 외부 StackFlow kit 소비 계약
│
├── .codex/skills/                         # 작업별 canonical 절차 (8개는 agents/openai.yaml 메타데이터 동반)
│   ├── babysit-pr/SKILL.md
│   ├── code-review/SKILL.md
│   ├── codex-pr-body/SKILL.md
│   ├── deploy-web/SKILL.md
│   ├── doc-policy/SKILL.md
│   ├── git-commit-push/SKILL.md
│   ├── new-screen/SKILL.md
│   ├── scaled-fsd-architecture/SKILL.md
│   ├── unit-test-policy/SKILL.md
│   └── write-developer-technical-docs/SKILL.md
├── .claude/
│   ├── skills/                            # canonical Skill을 가리키는 symlink
│   └── settings.json                      # Skill 관문 hook 등록
│
├── .githooks/
│   ├── pre-commit                         # harness 테스트·구조 검사
│   └── commit-msg                         # 커밋 본문·테스트 동반 검사
│
├── tests/unit/                            # Repository harness의 Node 단위 테스트 (34개)
│   ├── repository-harness.test.mjs        # harness 검사 함수 (23)
│   ├── skill-guard.test.mjs               # Skill 관문 판정 (6)
│   ├── commit-check.test.mjs              # commit-msg 규칙 (4)
│   └── app-version.test.mjs               # app 버전 = Android versionName = iOS MARKETING_VERSION (1)
├── scripts/
│   ├── check-structure.sh                 # 기본 폴더·파일 규칙 검사
│   ├── check-repository-harness.mjs       # 문서·Skill·계약·테스트 구조 검사
│   ├── skill-guard.mjs                    # Claude Code Skill 관문
│   ├── commit-check.mjs                   # commit-msg 검사 본문
│   ├── generate-pose-camera-contract.mjs  # pose camera 계약 생성 (structure:check가 드리프트 비교)
│   ├── run-with-envfile.mjs               # env 파일을 읽어 app·web script 실행
│   ├── run-ios-local-device.mjs           # iOS 실기기 실행 (LAN IP 주입)
│   ├── run-android-local-device.mjs       # Android 실기기 실행
│   └── start-android-emulator.sh          # Android 에뮬레이터 기동
│
└── .github/
    ├── actions/
    │   ├── setup-toolchain/               # .mise.toml·packageManager로 Node·JDK·pnpm 설치
    │   └── stackflow-kit-auth/            # private Git dependency 인증 action
    ├── PULL_REQUEST_TEMPLATE.md           # 검증·수동 매트릭스·문서 동기화 체크
    └── workflows/
        ├── validate-pr.yml                # 모든 PR의 공통 검증·Android bundle·Web E2E
        ├── validate-app-shared.yml        # dev push App·shared 경로 검증
        └── deploy-web.yml                 # Web 테스트·E2E·typecheck·dev 배포
```

ADR, handoff 규격, 브리지·feature API 가이드, release·incident runbook과 화면별 데이터 문서는 아직 없다\. 구현이나 반복 비용이 생기기 전에 자리 문서를 만들지 않는 것이 현재 정책이다\. 새 문서의 도입 조건은 ` doc-policy ` Skill이 소유한다\.

### 권위와 사실 판정 순서

문서끼리 내용이 다르거나 문서와 구현이 충돌할 때는 다음 순서로 현재 사실을 판정한다\.

1. 실행 가능한 계약
   - 런타임 코드와 플랫폼 설정
   - TypeScript 타입과 Zod schema
   - 테스트
   - ` scripts/check-structure.sh `
   - ` scripts/check-repository-harness.mjs `
1. ` TECH_RULES.md `
   - 고정 기술 스택
   - 상위 아키텍처 원칙
   - 구현 금지 사항
1. ` AGENTS.md ` 문서 맵에 등록된 사실별 소유 문서
1. ` AGENTS.md `의 일반 작업 흐름과 저장소 운영 규칙

문서가 구현과 다르면 구현이 현재 상태다\. 다만 계약을 의도적으로 바꾸는 작업이라면 코드만 바꾸지 않고, 해당 사실의 소유 문서를 같은 변경 단위에서 갱신한다\.

이 문서의 표와 체크리스트는 관계를 설명하기 위한 요약이다\. 세부 규칙의 정본은 ` AGENTS.md ` 문서 맵이 가리키는 소유 문서다\.

### 문서별 역할

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">문서 또는 장치</th><th scope="col">소유하는 사실</th><th scope="col">Agent가 사용하는 시점</th></tr></thead>
<tbody><tr><td><code>AGENTS.md</code></td><td>권위 순서, 문서 맵, 필독 경로, 금지 사항, 완료 조건</td><td>모든 작업의 시작과 완료 전</td></tr><tr><td><code>TECH_RULES.md</code></td><td>기술 스택, 도구 버전의 기준 위치, 상위 아키텍처 원칙, 보안·신뢰 경계 원칙, 금지 패턴</td><td>모든 코드 변경 전</td></tr><tr><td><code>README.md</code></td><td>도구 설치, 실제 pnpm script, 환경별 실행, 빌드, 검증 명령</td><td>실행·검증 명령을 고를 때</td></tr><tr><td><code>app/AGENTS.md</code></td><td>Native bridge, hardware back, URL, 환경, 네이티브 소스 배치, RN 경로, react-native CLI·iOS Pods 함정</td><td><code>app/</code> 또는 native 설정 변경 시</td></tr><tr><td><code>web/AGENTS.md</code></td><td>StackFlow, 렌더링 경계, 상태 소유권, API·UI 규칙</td><td><code>web/</code> 변경 시</td></tr><tr><td><code>docs/architecture/folder-structure.md</code></td><td>현재 디렉터리와 책임의 스냅샷</td><td>파일 이동·폴더 추가 전후</td></tr><tr><td><code>docs/architecture/service-boundaries.md</code></td><td>App·Web·API route·Native-Web bridge 책임과 데이터 흐름</td><td>런타임 간 통신 변경 시</td></tr><tr><td><code>docs/guides/new-screen.md</code></td><td>새 화면(StackFlow activity) 추가 절차</td><td>새 화면 추가 시</td></tr><tr><td><code>docs/runbooks/deploy.md</code></td><td>환경 변수, 빌드, 배포 workflow, 배포 secret</td><td>환경·배포 변경 시</td></tr><tr><td>Feature <code>README.md</code></td><td>해당 feature의 책임, 계약, mock, 미구현 경계와 알려진 예외</td><td>도메인 동작을 조사하거나 바꿀 때</td></tr><tr><td><code>packages/shared/README.md</code></td><td>공통 bridge token, payload schema, 발신자와 처리자</td><td>Native-Web 메시지 변경 시</td></tr><tr><td><code>packages/design-system/README.md</code></td><td>재사용 UI, 아이콘, 색상 token과 public export</td><td>공통 UI를 추가하거나 쓸 때</td></tr><tr><td><code>docs/specs/stackflow-kit-extraction.md</code></td><td>외부 패키지 commit, adapter 경계, 인증과 수동 회귀 지점</td><td>StackFlow kit SHA·인증·adapter 변경 시</td></tr><tr><td><code>docs/AI_AGENT_HARNESS.md</code></td><td>Agent 진입점, 문서 소유권, Skill, 검증 흐름의 설계 설명</td><td>Agent 체계·검사·hook을 바꿀 때</td></tr><tr><td><code>.codex/skills/*/SKILL.md</code></td><td>특정 작업 유형의 판단 기준과 실행 절차</td><td>해당 유형의 작업에만 선택적으로</td></tr><tr><td>PR 템플릿</td><td>자동화하기 어려운 수동 검증과 문서 동기화 확인</td><td>PR 작성과 리뷰 시</td></tr><tr><td>Git 커밋 본문</td><td>구조 결정의 배경, 중요한 구현 내용, 검증 증거</td><td>과거 결정 이유를 조사할 때</td></tr></tbody>
</table>
</div>

### Canonical과 도구별 진입 방식

Codex와 Claude에 별도의 규칙 본문을 복사하지 않는다\.

```text
Codex
  → AGENTS.md
  → app/AGENTS.md 또는 web/AGENTS.md
  → .codex/skills/<skill>/SKILL.md

Claude
  → CLAUDE.md symlink → AGENTS.md
  → app/CLAUDE.md 또는 web/CLAUDE.md symlink → 각 workspace의 AGENTS.md
  → .claude/skills/<skill>/SKILL.md symlink → .codex/skills/<skill>/SKILL.md
  → .claude/settings.json hook → scripts/skill-guard.mjs

공통 (pnpm install 이후 모든 커밋)
  → .githooks/pre-commit, .githooks/commit-msg → scripts/commit-check.mjs
```

루트와 두 workspace의 ` CLAUDE.md `, ` .claude/skills/*/SKILL.md `는 모두 canonical 파일을 가리키는 symlink다\. repository harness가 두 종류 모두 정확한 symlink인지 검사한다\. 복사본이나 canonical 경로만 적은 adapter 파일은 허용하지 않는다\.

도구별 차이는 발견 경로와 Claude 전용 hook뿐이다\. 실제 규칙 본문, 테스트 명령과 완료 조건은 같은 소유 문서에서 읽는다\. Claude hook은 Skill을 **읽었는지**를 검사하고, git hook은 도구와 관계없이 커밋 **결과물**을 검사한다\.

반복 절차 문서\(` docs/guides/new-screen.md `, ` docs/runbooks/deploy.md `\)는 문서가 본문을 소유한다\. 같은 이름의 Skill\(` new-screen `, ` deploy-web `\)은 작업을 자동으로 불러오는 진입점과 완료 확인만 가진다\.

### Skill별 역할

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">Skill</th><th scope="col">적용 대상</th><th scope="col">판단 내용</th></tr></thead>
<tbody><tr><td><code>babysit-pr</code></td><td>PR 상태·CI·리뷰·충돌·mergeability 감시</td><td>기본은 읽기 전용. 재실행·수정·댓글·merge는 명시적 승인 뒤 수행</td></tr><tr><td><code>code-review</code></td><td>현재 브랜치 또는 PR의 net diff 리뷰</td><td>기본은 읽기 전용. 수정은 별도의 명시적 요청이 있을 때만 수행</td></tr><tr><td><code>codex-pr-body</code></td><td>PR 제목·본문·검증 증거·수동 테스트 표 작성</td><td>기본은 초안 반환. 요청받은 경우에만 기존 내용을 보존해 GitHub 갱신</td></tr><tr><td><code>deploy-web</code></td><td>Web 수동 배포, 환경 변수·배포 workflow·secret 변경</td><td>실행 전 확인과 완료 확인. 절차 본문은 <code>docs/runbooks/deploy.md</code></td></tr><tr><td><code>doc-policy</code></td><td>새 문서 생성 또는 기존 문서 확장</td><td>기존 소유권 중복, 문서 도입 트리거, 생성·갱신·보류 판단</td></tr><tr><td><code>git-commit-push</code></td><td>커밋과 push</td><td>관련 변경만 stage, 비어 있지 않은 커밋 본문, 검증·push 확인</td></tr><tr><td><code>new-screen</code></td><td>새 화면 추가, activity 등록·route·네비게이션·safe area 변경</td><td>읽을 순서와 완료 확인. 절차 본문은 <code>docs/guides/new-screen.md</code></td></tr><tr><td><code>scaled-fsd-architecture</code></td><td>파일 이동, 구조 변경, 리팩터링, API·bridge 배치</td><td><code>app → features → shared</code> 의존 방향, segment와 파일 책임, 확장 조건</td></tr><tr><td><code>unit-test-policy</code></td><td>모든 기능 구현·수정·리팩터링·버그 수정</td><td>Unit·Integration·E2E·수동 검증 선택, 테스트 위치와 케이스</td></tr><tr><td><code>write-developer-technical-docs</code></td><td>아키텍처, 계약, runbook, 구현 설명</td><td>코드·테스트·설정 근거 조사, 현재·예외·미래 구분</td></tr></tbody>
</table>
</div>

Skill은 전역 사실을 복제하는 문서가 아니다\. 작업마다 달라지는 판단 절차만 담아서 불필요한 초기 문맥을 줄인다\.

### 기능 구현 작업 흐름

#### 1\. 범위와 완료 조건 결정

Agent는 요청에서 다음을 먼저 분리한다\.

- 변경할 runtime과 feature
- 동작 변경인지 구조 변경인지
- 신뢰 경계·보안 분기가 포함되는지
- 자동 테스트로 검증할 부분과 실기기 확인이 필요한 부분
- 함께 바뀌어야 하는 소유 문서

범위가 불명확해 결과가 크게 달라지는 경우에만 사용자에게 결정을 요청한다\.

#### 2\. 필요한 문서만 선택

```text
모든 코드 변경
  → TECH_RULES.md
  → unit-test-policy

Web 변경
  → web/AGENTS.md

App·Native 변경
  → app/AGENTS.md

새 화면 추가
  → new-screen
  → docs/guides/new-screen.md, web/AGENTS.md

폴더·책임 변경
  → scaled-fsd-architecture
  → docs/architecture/folder-structure.md

Feature 동작 변경
  → 해당 feature README

Native-Web bridge 변경
  → packages/shared/README.md
  → docs/architecture/service-boundaries.md

환경 변수·배포 변경
  → deploy-web
  → docs/runbooks/deploy.md

StackFlow kit SHA·인증·adapter 변경
  → docs/specs/stackflow-kit-extraction.md
  → docs/runbooks/deploy.md
```

Agent는 모든 문서를 한 번에 읽지 않고, 변경 범위의 소유 문서만 추가로 읽는다\.

#### 3\. 실제 구현 근거 조사

문서 설명을 그대로 구현하지 않고 다음 우선순위로 확인한다\.

1. 런타임 코드와 플랫폼 설정
1. 테스트와 실행 스크립트
1. ` package.json `, ` pnpm-workspace.yaml `, lockfile, workflow
1. 최근 관련 커밋의 결정 이유
1. 기존 문서

이 단계에서 문서가 오래됐다는 사실을 발견하면, 목표 구조에 코드를 억지로 맞추지 않고 현재 구현과 의도된 변경을 구분한다\.

#### 4\. 구조와 테스트 계층 결정

App과 Web의 TypeScript 소스는 축소형 FSD의 단방향 의존을 따른다\.

```text
app
  ↓
features
  ↓
shared
```

테스트는 실패가 의미하는 범위로 분류한다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">계층</th><th scope="col">선택 기준</th><th scope="col">위치</th></tr></thead>
<tbody><tr><td>Unit</td><td>단일 모듈의 분기·변환·schema·상태 전이</td><td><code>app/tests/unit</code>, <code>web/tests/unit</code>, 루트 <code>tests/unit</code></td></tr><tr><td>Integration</td><td>storage·API·bridge·platform adapter처럼 둘 이상의 경계가 만남</td><td><code>app/tests/integration</code>, <code>web/tests/integration</code></td></tr><tr><td>E2E</td><td>실제 Next.js 서버와 브라우저의 핵심 화면·라우팅 흐름</td><td><code>web/tests/e2e</code></td></tr><tr><td>수동</td><td>Native SDK, 권한, WebView lifecycle, hardware back, 카메라 실동작</td><td>완료 보고의 플랫폼 매트릭스</td></tr></tbody>
</table>
</div>

Jest 파일은 workspace의 ` tests/unit ` 또는 ` tests/integration ` 아래 ` *.test.ts(x) `를 쓴다\. 루트 repository harness 테스트는 Node test runner의 ` *.test.mjs `다\. Playwright 파일은 ` web/tests/e2e/*.spec.ts `를 쓴다\.

소스 내부에 Jest·Playwright suffix를 가진 테스트 파일을 다시 두거나, 테스트 계층에서 suffix를 섞어 쓰면 repository harness가 실패한다\. Jest 공통 setup은 아직 없으며, 실제로 필요해지면 workspace의 ` tests/setup `에 도입한다\.

#### 5\. 코드·테스트·문서 동시 변경

기능 구현은 코드 생성으로 끝나지 않는다\.

- 필수 테스트 대상에는 정상 경로와 위험한 경계·실패 입력을 추가한다\.
- API·IPC·storage restore 같은 신뢰 경계는 Zod ` safeParse ` 실패를 안전하게 처리한다\.
- Web의 서버 상태는 TanStack Query, 클라이언트 작업 상태는 Zustand가 소유한다\.
- Native\-Web token과 payload schema는 ` packages/shared `가 소유한다\.
- 구조가 바뀌면 폴더 스냅샷을 갱신한다\.
- 도메인 동작·mock·미구현 경계가 바뀌면 해당 feature README를 갱신한다\.
- bridge 계약이 바뀌면 계약 인덱스와 양쪽 feature 설명을 확인한다\.
- 외부 StackFlow kit commit이나 adapter 경계가 바뀌면 소비 계약과 수동 회귀 지점을 확인한다\.
- 새 의존성은 해당 workspace의 ` package.json `에 선언한다\. 둘 이상의 workspace가 쓰면 ` pnpm-workspace.yaml `의 ` catalog `로 옮긴다\.

#### 6\. 로컬 검증

루트 공통 검증은 ` README.md `가 소유한다\.

```bash
pnpm run lint
pnpm run test
pnpm run typecheck
pnpm run build
pnpm run structure:check
```

Web 화면·라우팅·브라우저 연결을 바꿨다면 추가로 실행한다\.

```bash
pnpm run test:e2e
```

` test `는 루트 repository harness의 Node 테스트와 App/Web Unit·Integration Jest 테스트를 실행한다\. ` test:e2e `는 production Next\.js build를 3100 포트에 띄우고 Chromium과 WebKit에서 Playwright 시나리오를 실행한다\.

루트 ` build `는 Android Metro bundle 검증을 대체하지 않는다\. PR workflow와 App 관련 ` dev ` push workflow는 다음 명령을 따로 실행한다\.

```bash
pnpm --filter <app 패키지> run bundle:android:ci
```

#### 7\. 커밋과 PR로 작업 종료

커밋할 때 ` .githooks `가 먼저 검사한다\.

- ` pre-commit `: ` pnpm run test:harness `, ` pnpm run structure:check `
- ` commit-msg `: trailer를 뺀 커밋 본문이 비어 있지 않은지, app·web·packages 소스를 바꿨는데 테스트 변경이 없으면 ` 테스트 제외: &lt;사유&gt; ` 줄이 있는지

hook은 ` pnpm install ` 때 루트 ` prepare ` script가 ` git config core.hooksPath .githooks `로 연결한다\. ` commit-msg ` 판정의 세부는 ` scripts/commit-check.mjs `가 소유한다\.

- 소스: ` app/src `·` web/src `·` packages/*/src `의 ` .ts `·` .tsx `·` .js `·` .jsx `\(` .stories `·` .d.ts ` 제외\)\. 네이티브 Kotlin·Swift와 ` .mjs `는 대상이 아니다\.
- 테스트 동반: 경로에 ` tests/ `가 있거나 ` .test `·` .spec ` suffix인 staged 파일이 하나라도 있으면 인정한다\.
- trailer: ` ^[A-Za-z-]+: .+ ` 형태의 줄은 본문으로 세지 않는다\.
- 제목이 ` Merge  `, ` Revert &quot; `, ` fixup!  `, ` squash!  `, ` amend!  `로 시작하면 검사를 건너뛴다\.
- 사용자가 강제하라고 했을 때만 ` F=1 git commit ... `으로 두 hook을 건너뛴다\.

PR 작성자는 다음 증거를 남긴다\.

- 자동 검증 명령과 결과 \(PR 템플릿\)
- 추가·수정한 테스트 계층과 케이스 수 \(테스트 계층은 PR 템플릿, 케이스 수는 ` unit-test-policy ` 완료 조건\)
- 런타임 변경 시 플랫폼 × 시나리오 × 결과 수동 테스트 표 \(PR 템플릿\)
- 함께 갱신한 소유 문서와 ` last_verified ` \(PR 템플릿\)
- 실행하지 못한 검증 \(` AGENTS.md ` 작업 흐름\)

구조적 결정의 이유, 중요한 구현 내용과 검증 결과는 비어 있지 않은 커밋 본문에 남긴다\. 다음 Agent는 현재 규칙을 문서에서, 과거 결정 이유를 Git 이력에서 찾는다\.

PR workflow는 모든 PR에서 자동 실행된다\. 다만 사용 중인 GitHub 요금제의 private 저장소에서는 branch protection과 ruleset API가 403을 반환해 required status check를 설정할 수 없다\. 따라서 PR 실패는 리뷰 신호일 뿐 merge를 기계적으로 막지 않는다\. 대신 dev push workflow 두 개가 dev에 들어온 변경을 다시 검사한다\. ` validate-app-shared.yml `과 ` deploy-web.yml `은 모두 ` structure:check `를 실행하고, 배포 workflow는 배포 직전에 Web Unit·Integration, Web typecheck, Web E2E까지 다시 실행해 Web 배포 경로를 막는다\. lint는 dev push에서 다시 돌지 않는다\.

### 변경 유형별 동기화 대상

다음 표는 탐색용 요약이다\. 정확한 소유권은 ` AGENTS.md ` 문서 맵과 PR 템플릿을 기준으로 한다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">변경 유형</th><th scope="col">함께 확인하거나 갱신할 위치</th></tr></thead>
<tbody><tr><td>라이브러리·상위 기술 규칙</td><td><code>TECH_RULES.md</code>, <code>pnpm-workspace.yaml</code></td></tr><tr><td>도구 버전(Node·JDK·Ruby·pnpm)</td><td><code>.mise.toml</code>, 루트 <code>packageManager</code> (workflow에는 적지 않음)</td></tr><tr><td>실행·검증 script</td><td><code>README.md</code></td></tr><tr><td>폴더·책임 배치</td><td><code>docs/architecture/folder-structure.md</code>, <code>scaled-fsd-architecture</code></td></tr><tr><td>App·Web 서비스 경계</td><td><code>docs/architecture/service-boundaries.md</code></td></tr><tr><td>새 화면·activity 등록</td><td><code>docs/guides/new-screen.md</code></td></tr><tr><td>Feature 동작·mock·미구현 경계</td><td>해당 feature <code>README.md</code></td></tr><tr><td>Bridge token·payload schema</td><td><code>packages/shared/README.md</code>, 관련 feature README</td></tr><tr><td>공통 UI·아이콘·색상</td><td><code>packages/design-system/README.md</code></td></tr><tr><td>환경 변수·빌드·배포 workflow</td><td><code>docs/runbooks/deploy.md</code></td></tr><tr><td>StackFlow kit commit·인증·adapter 경계</td><td><code>docs/specs/stackflow-kit-extraction.md</code>, <code>docs/runbooks/deploy.md</code></td></tr><tr><td>테스트 선택·배치·완료 기준</td><td><code>unit-test-policy</code></td></tr><tr><td>Agent 진입·문서 소유권·검증 흐름</td><td><code>docs/AI_AGENT_HARNESS.md</code></td></tr></tbody>
</table>
</div>

### 자동 검증 체계

#### 구조와 repository harness

` pnpm run structure:check `는 ` scripts/check-structure.sh `를 실행하고, 기본 구조 검사를 통과하면 ` scripts/check-repository-harness.mjs `를 호출한다\. 검사 항목 목록은 두 스크립트가 소유한다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">검사기</th><th scope="col">현재 검증 범위</th></tr></thead>
<tbody><tr><td><code>scripts/check-structure.sh</code></td><td>필수 경로(<code>pnpm-lock.yaml</code>, <code>pnpm-workspace.yaml</code> 포함), <code>package-lock.json</code>과 workspace별 lockfile 금지, 빈 source 폴더, 금지 segment, schema 위치, 파일 suffix, 네이티브 디렉터리 규칙, pose camera 계약 생성물 드리프트</td></tr><tr><td><code>scripts/check-repository-harness.mjs</code></td><td>필수 문서, frontmatter, 문서 경로·링크·<code>pnpm run</code> script, npm·npx·yarn 명령 혼입, canonical 진입 symlink와 Skill symlink, feature README, 테스트 계층, FSD 역방향 import, 브리지 token 인덱스, 알려진 신뢰 경계 marker, 선언만 남은 환경 변수</td></tr><tr><td><code>findStackflowKitConsumerErrors</code></td><td><code>@scope/stackflow-kit</code>이 private Git 저장소의 40자 commit SHA에 고정됐는지, 같은 SHA가 <code>pnpm-workspace.yaml</code>의 <code>onlyBuiltDependencies</code>에 허용돼 있는지(다르면 kit build 없이 빈 패키지가 설치됨), mono-repo에 로컬 <code>packages/stackflow-kit</code> source가 다시 생기지 않았는지 검사</td></tr><tr><td>Skill·진입 검사</td><td>Skill frontmatter의 <code>name</code>·<code>description</code> 존재와 <code>name</code> = 디렉터리명, canonical 없는 <code>.claude</code> adapter 금지, <code>AGENTS.md</code>의 <code>docs/AI_AGENT_HARNESS.md</code> 참조</td></tr><tr><td>테스트·FSD 검사</td><td><code>scripts/</code>·<code>packages/</code>를 포함한 금지 위치의 테스트 파일, 다른 slice는 <code>index</code>·<code>server</code> 진입점으로만 import, feature 간 순환 import 금지</td></tr><tr><td><code>findToolchainSourceErrors</code></td><td>workflow가 <code>setup-node</code>·<code>setup-java</code>·<code>pnpm/action-setup</code>·<code>mise-action</code>이나 <code>node-version</code>·<code>java-version</code>을 직접 쓰지 않고 <code>.github/actions/setup-toolchain</code>으로만 도구를 설치하는지 검사</td></tr></tbody>
</table>
</div>

문서 frontmatter는 루트·app·web 최상위 ` .md `와 ` docs/ `·` web/docs/ ` 아래 문서에 필수다\(feature README는 대상이 아니다\)\. ` title `·` kind `·` status `·` owner `·` last_verified `가 모두 있어야 하고, ` kind `·` status `는 정해진 값만 쓴다\. ` code_sources `를 적으면 그 경로가 실제로 있어야 한다\. ` last_verified `는 ` YYYY-MM-DD ` 형식만 검사하고 날짜가 지났는지는 보지 않는다\. 사람이 기록한 재검토 정보일 뿐, 실제 검증 행위를 증명하지 않는다\.

문서 경로 검사는 자연어를 의미 분석하지 않는다\. ` / `가 들어 있고 확장자가 있는 인라인 코드 경로와 Markdown 상대 링크를 확인한다\. 디렉터리 표기, glob, ` .env* ` 같은 표현, ` / `가 없는 단일 파일명, fenced code block 안의 경로는 검사하지 않는다\. 반면 ` pnpm run &lt;script&gt; ` 존재 여부와 npm·npx·yarn 명령 금지 검사는 fenced code block을 포함한 원문 전체를 본다\.

#### Claude Code Skill 관문

문서에 적은 Skill 포인터에는 강제력이 없다\. 그래서 ` .claude/settings.json `의 hook이 ` scripts/skill-guard.mjs `를 실행해, 정해진 작업을 해당 Skill을 읽기 전에 차단한다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">작업</th><th scope="col">먼저 읽어야 하는 Skill</th></tr></thead>
<tbody><tr><td>app·web·packages 소스·테스트 수정</td><td><code>unit-test-policy</code></td></tr><tr><td>커밋·push</td><td><code>git-commit-push</code></td></tr><tr><td>PR 생성</td><td><code>codex-pr-body</code></td></tr><tr><td>Web 배포</td><td><code>deploy-web</code></td></tr></tbody>
</table>
</div>

- 세션이 시작될 때 SessionStart hook이 관문 목록과 &quot;새 화면 추가 → ` new-screen ` 적용&quot; 안내를 출력한다\(새 화면은 관문이 아니라 안내다\)\.
- Skill을 읽으면 PostToolUse hook이 ` os.tmpdir()/{prefix}-skill-guard/&lt;session&gt;.txt `에 기록하고, 이후 해당 관문은 자동으로 통과한다\. ` plugin:skill ` 형식은 접두어를 떼고 기록한다\.
- 코드 수정 관문은 Edit·Write·MultiEdit·NotebookEdit 도구에 걸리고, 대상은 ` app/src `·` app/tests `·` web/src `·` web/tests `·` packages/*/src ` 아래 ` .ts `·` .tsx `·` .js `·` .jsx `·` .mjs `다\. packages 테스트, 네이티브 Kotlin·Swift, CSS·JSON은 관문 밖이다\.
- 우회는 문장 앞 대입 ` F=1 `, ` SKILL_OK=1 `\(사용자가 slash command로 Skill을 불러 기록이 없을 때\), ` SKILL_GUARD=0 `만 인정한다\.
- Bash 관문은 실제로 실행되는 문장의 첫 낱말로 판정한다\. heredoc 본문과 검색 명령은 막지 않는다\.
- 배포 관문은 스크립트 이름 자리의 ` deploy `·` upload `\(` deploy:dev `, ` deploy:dev:ci `, ` upload:dev ` 포함\)와 ` opennextjs-cloudflare deploy `·` upload `, ` wrangler deploy `·` versions upload `\(` npx `·` pnpx `·` pnpm exec `·` pnpm dlx ` 경유 포함\)만 잡는다\. ` docs/runbooks/deploy.md `처럼 인자에 ` deploy ` 낱말이 있는 명령은 막지 않는다\.
- 관문 목록은 ` skill-guard.mjs `의 ` GATES `·` EDIT_GATE `가 소유하고, ` tests/unit/skill-guard.test.mjs `가 검증한다\.

#### PR과 배포 workflow

```text
모든 PR
└── Validate repository (단일 job)
    ├── private kit 인증 → setup-toolchain
    ├── pnpm install --frozen-lockfile → 인증 정보 삭제
    ├── lint
    ├── test
    ├── Android native unit test
    ├── typecheck
    ├── build
    ├── Android JavaScript bundle
    ├── structure:check
    ├── Chromium·WebKit 설치
    ├── Playwright E2E
    └── HTML report artifact (취소되지 않으면 업로드, 14일 보관)

dev App·shared 관련 경로 push (app, packages/shared, 루트 manifest·lock·workspace, patches, .github/actions)
  → structure:check
  → 루트 typecheck
  → 루트 test
  → Android JavaScript bundle

dev Web 관련 경로 push 또는 수동 실행 (web, packages/shared, packages/design-system, scripts, 루트 manifest·lock·workspace, .github/actions)
  → structure:check
  → Web Unit·Integration
  → Web typecheck
  → Chromium·WebKit E2E
  → deploy:dev:ci (dev 브랜치 확인 → OpenNext build → Cloudflare 배포, 한 step)
```

PR workflow는 같은 PR의 이전 실행을 취소하고\(` concurrency `\), checkout은 ` persist-credentials: false `로 한다\. 배포 job은 GitHub ` environment: dev `를 쓴다\. E2E는 env 파일 없이 ` {PREFIX}_E2E=1 ` production build를 3100 포트에 띄우므로, 외부 API를 부르지 않는 화면 흐름만 다룬다\. CI에서는 ` retries: 1 `, ` forbidOnly `가 켜진다\.

세 workflow 모두 ` .github/actions/setup-toolchain `으로만 도구를 설치한다\. 이 action이 ` jdx/mise-action `으로 ` .mise.toml `의 Node·JDK를, ` pnpm/action-setup `으로 루트 ` packageManager `의 pnpm을 설치하고 pnpm store를 캐시한다\. workflow에 버전을 직접 적으면 ` findToolchainSourceErrors `가 막으므로, 로컬과 CI의 도구 버전이 갈라지지 않는다\. Web 배포 workflow는 ` --filter &lt;web 패키지&gt;... `로 Web과 그 의존 workspace만 설치한다\. ` validate-app-shared.yml `은 이름과 path trigger가 App·shared 범위를 나타내지만, 실제 ` typecheck `와 ` test `는 루트에서 실행하므로 연결된 workspace 전체를 검증한다\.

세 workflow는 private Git dependency를 설치하기 전에 ` .github/actions/stackflow-kit-auth/action.yml `로 SSH Git URL을 PAT가 담긴 HTTPS로 바꾼다\. ` pnpm install `이 끝나면, PR이나 브랜치 코드가 test·build·E2E에서 실행되기 전에 runner의 Git credential 설정을 지운다\(` if: always() `로 ` rm -f $HOME/.gitconfig `\)\. secret을 받지 못하는 fork·Dependabot PR은 인증 단계에서 실패한다\.

이 구조는 Agent가 &quot;검증했다&quot;고 보고하는 것과 저장소가 실제 계약을 통과하는 것을 분리한다\. 다만 PR workflow 실패가 merge를 강제로 막지는 않으므로, 리뷰 확인과 배포 직전 gate를 함께 유지한다\.

### 현재 구현으로 얻는 효과

- 새 Agent 세션이 과거 대화 없이 문서 소유권과 작업 순서를 복원할 수 있다\.
- Codex와 Claude가 물리적으로 같은 canonical 규칙을 읽는다\.
- Claude Code는 코드 수정·커밋·PR·배포 전에 해당 Skill을 반드시 읽는다\.
- 도구와 관계없이 모든 커밋이 본문, 테스트 동반 여부, 구조 검사를 통과해야 한다\.
- 현재 구조, 허용 규칙, 기능 계약, 실행 명령의 소유자가 분리된다\.
- Feature 지식이 코드 가까이에 있어서 변경할 때 함께 발견된다\.
- FSD 역방향 import, 잘못된 테스트 위치, 누락된 bridge token 인덱스와 알려진 신뢰 경계 위반을 workflow 실행 전에 로컬에서도 발견한다\.
- Unit·Integration·E2E가 실패 범위별로 책임을 나눠 가진다\.
- 핵심 Web 흐름을 Chromium과 WebKit에서 PR과 배포 전에 검증한다\.
- 외부 StackFlow kit의 source 소유권과 mono\-repo의 소비 계약이 분리되고, 고정 commit과 인증 경계를 검사한다\.
- 구조적 결정은 Git 이력에 남고, 현재 문서는 작업 일지로 쓰지 않는다\.
- 미구현 문서를 미리 만들지 않아, 자리 문서를 현재 계약으로 오독할 가능성을 줄인다\.

이 효과는 탐색과 회귀 발견 수단이 있다는 뜻이다\. Agent 작업 시간이나 재작업률이 실제로 줄었는지는 아직 측정하지 않았다\.

### 현재 예외와 한계

- 신뢰 경계 검사는 알려진 파일과 필수 marker를 기준으로 하며, 새로운 IPC·storage·API 경계를 의미적으로 자동 발견하지 않는다\.
- 문서 검사는 경로, metadata와 일부 계약 누락을 찾지만, 본문이 실제 구현과 의미적으로 일치하는지는 사람이 검토해야 한다\.
- ` last_verified `는 사람이 기록한 날짜이며, 만료 검사나 실제 검증 행위 증명이 아니다\.
- Skill 읽기 관문은 Claude Code에만 있다\. Codex와 사람에게는 git hook이 결과물\(본문·테스트 동반·구조\)만 검사하며, PR 생성과 배포 전 Skill 확인은 강제하지 않는다\.
- ` web/package.json `의 ` assert-dev-branch `는 ` deploy:dev `·` deploy:dev:ci `·` upload:dev ` script를 dev 외 브랜치에서 막는다\. ` opennextjs-cloudflare `·` wrangler `를 직접 실행하면 막지 않는다\(Claude Code에서는 Skill 관문에는 걸린다\)\.
- Claude Code가 Bash로 파일을 쓰면\(sed, heredoc\) 코드 수정 관문을 지나간다\. 테스트 동반의 실질적인 방어선은 ` commit-msg ` 검사다\.
- ` commit-msg `의 테스트 동반 판정은 경로 기준이라, 대상과 관계없는 ` tests/ ` 파일만 바꿔도 통과한다\. 영문 ` Note: ... ` 같은 줄은 trailer로 보고 본문에서 뺀다\.
- git hook은 ` pnpm install `을 한 clone에서만 동작하고 ` -no-verify `나 ` F=1 `로 우회할 수 있다\. CI의 ` structure:check `는 PR workflow와 dev push workflow 두 개에서 돈다\. PR workflow는 merge를 막지 못하고, dev push workflow는 path filter에 걸리는 변경\(app·shared·design\-system·web·scripts·루트 manifest 등\)에서만 돈다\. 그래서 문서·skill만 바꾼 dev 직접 push는 구조 검사를 거치지 않는다\.
- ` 테스트 제외: ` 사유가 타당한지는 기계가 판정하지 않는다\. 리뷰에서 확인한다\.
- Playwright E2E는 인증 진입, 체형 분석, 옷장, 누끼 테스트, 마이페이지 5개 spec\(38개 시나리오\)을 Chromium·WebKit에서 실행한다\(76개\)\. 실제 BE와 연결한 인증 API나 모든 실패 복구를 보장하지는 않는다\.
- Browser E2E는 Native SDK, 권한, WebView lifecycle, hardware back과 카메라 실동작을 재현하지 못한다\.
- PR workflow는 자동 실행되지만 required status check가 아니므로 merge를 강제로 막지 않는다\.
- 모든 PR에서 build, Android native unit test, Android bundle과 두 브라우저 E2E를 실행하므로 CI 시간이 늘어난다\.
- 문서·검사가 Agent 재작업률과 작업 시간을 얼마나 줄였는지 비교할 수 있는 정량 지표는 아직 없다\.

자동화가 있다는 이유로 코드 리뷰, 문서 검토나 플랫폼 수동 검증을 생략하면 안 된다\.

### 향후 확장 조건

확장은 일정이 아니라 반복 비용과 운영 조건을 기준으로 진행한다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">후보</th><th scope="col">도입 조건</th><th scope="col">기대 효과</th></tr></thead>
<tbody><tr><td>신뢰 경계 AST·ESLint 검사</td><td>marker 기반 검사 누락·오탐이 반복될 때</td><td>새 경계의 검증 누락 자동 발견</td></tr><tr><td>Git diff 기반 문서 동기화</td><td>의미 단위 문서 갱신 누락이 반복될 때</td><td>코드와 소유 문서를 같은 PR에서 강제</td></tr><tr><td>Codex용 Skill 관문</td><td>Codex 작업에서 Skill 미확인 실수가 반복될 때</td><td>도구와 관계없이 같은 관문 적용</td></tr><tr><td>Native device E2E</td><td>안정적인 실기기 또는 device farm이 준비될 때</td><td>권한·SDK·WebView 반복 흐름 자동화</td></tr><tr><td>Web E2E 시나리오 확대</td><td>인증·API·결과 계약이 안정되고 회귀 비용이 반복될 때</td><td>핵심 실패 복구와 결과 흐름 보장</td></tr><tr><td>Coverage baseline과 위험 모듈 threshold</td><td>현재 테스트의 의미 있는 baseline을 합의했을 때</td><td>테스트 누락을 수치로 추적</td></tr><tr><td>Harness 효과 측정</td><td>PR 결과와 비교할 수 있는 작업 표본이 쌓였을 때</td><td>실패율·재작업률·검증 시간 개선 평가</td></tr><tr><td>ADR</td><td>구조 예외 승인이나 같은 결정의 번복·재논의가 두 번 이상 반복될 때</td><td>대안·범위·rollback 조건 보존</td></tr><tr><td>기능 스펙</td><td>구현 전 요구사항 왕복이 반복되어 대화 합의만으로 비쌀 때</td><td>요구사항·완료 기준의 사전 고정</td></tr><tr><td>Release runbook</td><td>실제 출시 준비에 들어가 차단 조건과 제출 절차를 채울 수 있을 때</td><td>실행 가능한 출시 절차 확보</td></tr><tr><td>Incident runbook</td><td>실사용자 트래픽과 운영 대응·rollback 책임이 생겼을 때</td><td>실행 가능한 복구 절차 확보</td></tr><tr><td>Handoff 규격</td><td>여러 작업자나 세션의 인수인계 실패가 반복될 때</td><td>최소 작업 상태와 근거 전달</td></tr><tr><td>브리지 메시지 가이드</td><td>새 메시지 추가 절차를 세 번째로 반복할 때</td><td>계약·양방향 배선 절차 재사용</td></tr><tr><td>Feature API 가이드</td><td>생성·검증·query 배선 절차를 두 번 이상 다시 구성할 때</td><td>API 연결 절차 재사용</td></tr><tr><td>화면 ↔ 데이터 문서</td><td>디자인 정본과 식별자가 확정되고 반복 매핑 비용이 생길 때</td><td>화면별 계약 탐색 비용 감소</td></tr><tr><td>PR required status check</td><td>저장소 공개 범위나 요금제가 기능을 지원할 때</td><td>PR 실패의 merge 강제 차단, 배포 workflow 중복 축소</td></tr></tbody>
</table>
</div>

후보를 도입할 때는 먼저 기존 소유 문서에 넣을 수 있는지 판단한다\. 새 문서가 필요하면 현재 코드와 운영 증거로 내용을 채우고, ` AGENTS.md ` 문서 맵에 소유권과 갱신 트리거를 등록한다\.

### 기능 구현 완료 체크리스트

이 체크리스트는 독립 정본이 아니다\. ` AGENTS.md `, ` unit-test-policy `, ` README.md `, PR 템플릿을 한 작업 순서로 연결한 요약이다\.

- 작업 범위와 완료 조건이 명확한가\.
- 변경 범위의 ` AGENTS.md `, 기술 규칙과 feature README를 확인했는가\.
- 해당 작업의 Skill을 읽었는가\.
- 문서 주장보다 실제 코드·테스트·설정을 우선해 조사했는가\.
- 새 로직을 Unit·Integration·E2E·수동 검증 중 올바른 계층에 배치했는가\.
- 신뢰 경계에서 손상 입력을 안전하게 거부하는가\.
- Web의 서버 상태와 클라이언트 작업 상태의 소유권이 분리되어 있는가\.
- 새 의존성을 쓰는 workspace에 선언했고, 공통이면 catalog로 옮겼는가\.
- 폴더·도메인·bridge·환경·외부 패키지 변경에 해당하는 소유 문서를 갱신했는가\.
- ` lint `, ` test `, ` typecheck `, ` build `, ` structure:check `가 통과했는가\.
- Web 흐름 변경 시 ` test:e2e `가 Chromium과 WebKit에서 통과했는가\.
- Native 런타임 동작 변경 시 영향받는 플랫폼의 수동 결과를 남겼는가\.
- 권한이 포함된 Native 흐름이라면 권한 거부 상태도 확인했는가\.
- PR 본문에 검증 결과, 문서 동기화와 남은 위험이 기록됐는가\.
- 커밋 본문에 변경 이유와 중요한 검증 증거가 남아 있고, 테스트가 없으면 ` 테스트 제외: ` 사유가 있는가\.

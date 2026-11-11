---
schemaVersion: 2
title: "pnpm Mono-repo와 축소형 FSD 구현"
description: "React Native App과 Next.js Web을 한 저장소에서 관리하면서도 런타임 의존성, framework 설정, 플랫폼 프로젝트의 소유권은 workspace별로 나눈다. 이 문서는 그 구성을 실제 구현 기준으로 기록한다."
tags: ["React Native", "Next.js", "아키텍처", "개발 도구"]
publishedAt: "2026-08-03T08:48:00.000Z"
updatedAt: "2026-11-10T15:32:00.000Z"
manuscriptPages: 18
---

### 목적

React Native App과 Next\.js Web을 한 저장소에서 관리하면서도 런타임 의존성, framework 설정, 플랫폼 프로젝트의 소유권은 workspace별로 나눈다\. 이 문서는 그 구성을 실제 구현 기준으로 기록한다\.

> 표기: 내부 패키지 scope는 ` @scope `, workspace 패키지 이름은 ` <app 패키지> `·` <web 패키지> `로 바꿔 적었다\.

### 1\. Repository 구성

```text
.
├── app/                         # React Native package
├── web/                         # Next.js package
├── packages/
│   ├── shared/                  # App·Web 공통 bridge·도메인 schema/type
│   └── design-system/           # 공통 UI·아이콘·색상 token, Storybook
├── scripts/                     # 환경별 실행, 구조·문서 검증 script
├── tests/unit/                  # 저장소 harness 테스트 (Node test runner)
├── patches/                     # pnpm patch로 만든 외부 패키지 수정
├── .github/
│   ├── actions/                 # 도구 설치, private 의존성 인증 composite action
│   └── workflows/               # PR 검증, App·shared 검증, Web 배포
├── .githooks/                   # pre-commit, commit-msg
├── package.json                 # packageManager, 공통 turbo task
├── pnpm-workspace.yaml          # workspace, catalog, install script 허용, patch, overrides
├── pnpm-lock.yaml               # 단일 lockfile
├── .mise.toml                   # Node·Ruby·Java 버전
└── turbo.json                   # task graph
```

### 2\. 루트의 책임

루트는 workspace orchestration만 맡는다\.

- workspace 선언: ` app `, ` web `, ` packages/* `
- 공통 task: ` build `, ` lint `, ` test `, ` test:e2e `, ` typecheck `, ` structure:check `, ` storybook `
- 루트 devDependency: ` turbo ` 하나
- 의존성 해석: 루트 ` pnpm-lock.yaml ` 하나
- 공통 라이브러리 버전: ` pnpm-workspace.yaml `의 ` catalog `
- 도구 버전: ` .mise.toml `\(Node·Ruby·Java\)과 ` packageManager `\(pnpm\)

런타임 패키지와 플랫폼 설정은 루트로 끌어올리지 않는다\. ` package-lock.json `이나 workspace별 lockfile이 생기면 구조 검사가 실패한다\.

#### catalog로 공통 버전 맞추기

React, Zod, TypeScript, Jest, ESLint, Zustand, Tailwind 계열처럼 둘 이상의 workspace가 쓰는 패키지는 catalog에 한 번만 적고, 각 ` package.json `은 ` catalog: `로 참조한다\.

```json
{
  "dependencies": {
    "react": "catalog:",
    "zod": "catalog:"
  }
}
```

App과 Web이 같은 Zod schema로 bridge 계약을 검증하므로, Zod 버전이 workspace마다 갈라지지 않는 것이 특히 중요했다\.

#### isolated 설치

pnpm 기본 isolated ` node_modules `를 쓴다\. 다른 패키지를 통해 우연히 설치된 의존성을 import하면 바로 실패하므로, 각 workspace는 import하는 모든 패키지를 직접 선언한다\. React Native 관련 경로\(Gradle, Xcode, Metro\)도 루트가 아니라 ` app/node_modules ` 기준으로 맞췄다\.

### 3\. Web package

` web/ `은 Next\.js App Router, StackFlow, UI 스타일, HTTP 경계, Cloudflare 빌드·배포 설정, 브라우저 E2E를 소유한다\.

```text
web/
├── src/
├── tests/{unit,integration,e2e,fixtures}
├── package.json
├── next.config.ts
├── open-next.config.ts
├── openapi-ts.config.ts
├── wrangler.jsonc
├── playwright.config.ts
├── jest.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

### 4\. App package

` app/ `은 React Native entry, Metro·Babel·Jest 설정, iOS·Android 프로젝트와 native 의존성을 소유한다\.

```text
app/
├── src/
├── tests/{unit,integration}
├── __mocks__/              # native SDK 공용 module mock
├── ios/
├── android/
├── index.js
├── package.json
├── Gemfile                 # CocoaPods 버전 고정
├── metro.config.js
├── babel.config.js
└── jest.config.js
```

### 5\. 공통 패키지

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">패키지</th><th scope="col">소유</th></tr></thead>
<tbody><tr><td><code>packages/shared</code></td><td>bridge envelope, 도메인별 event token·payload schema·추론 타입. subpath export(<code>/bridge</code>, <code>/auth</code>, <code>/location</code>, <code>/pose</code>, <code>/safe-area</code>, <code>/webview</code> …)로 나눠 공개</td></tr><tr><td><code>packages/design-system</code></td><td>UI primitive, SVG React component, 색상 token, Storybook. 소비자는 공개 export로만 가져온다</td></tr></tbody>
</table>
</div>

두 패키지는 빌드 산출물 없이 TypeScript source를 그대로 export한다\. 같은 저장소 안에서만 소비하므로 별도 빌드 단계를 두지 않았다\.

StackFlow 공통 로직은 저장소 밖의 private Git 저장소로 분리했고, Web이 고정 commit SHA로 설치한다\. 분리 배경은 별도 글에서 다룬다\.

### 6\. 소스 의존 방향

App과 Web 모두 다음 방향을 쓴다\.

```text
app → features → shared
```

- feature 요청은 해당 feature의 ` api/ `에 두고, ` shared `에는 범용 client와 transport만 둔다\.
- 다른 feature는 ` index.ts `\(또는 서버 전용 ` server.ts `\) 진입점으로만, 한 방향으로만 import한다\.
- 소스 폴더 안에 테스트를 두지 않는다\. 테스트는 workspace의 ` tests/unit `, ` tests/integration `, ` tests/e2e `에 둔다\.

이 규칙은 리뷰에만 맡기지 않고 저장소 harness가 import 경로를 읽어 역방향 import, 진입점을 거치지 않은 import, feature 간 순환을 검사한다\.

### 7\. Web Activity 조립

` web/src/app/[[...stack]]/page.tsx `는 StackFlow ` Stack `만 렌더링한다\. middleware가 넘긴 요청 경로를 ` initialContext `로 전달해 서버 렌더링 시점에도 올바른 Activity를 그린다\.

Activity, params 타입, URL route는 ` stackflow/config/stackflow.ts ` 한 파일에서 등록하고, 세 등록부의 키가 어긋나면 컴파일 단계에서 막는다\. 실제 화면 component는 feature가 소유한다\.

### 8\. App native adapter

WebView controller가 envelope 파싱과 dispatch를 조립한다\. 인증, 위치, safe area, pose camera, 이미지 분할 요청은 각 feature handler로 위임한다\.

iOS·Android native 코드는 ` Bridge `, ` Manager `, ` Helper `, ` Model `, ` View ` 책임으로 나눈다\.

### 9\. 환경별 실행

각 workspace에서 실행한다\.

```bash
cd web
pnpm run local-dev     # .env.local, 0.0.0.0:3001
pnpm run dev           # .env.dev
pnpm run prd           # .env.prd

cd ../app
pnpm run local-dev     # Metro
pnpm run dev
pnpm run prd
```

플랫폼 실행 명령도 환경 이름을 유지한다\.

```bash
pnpm run ios:local-dev
pnpm run ios:dev
pnpm run ios:prd
pnpm run ios:simulator:local-dev
pnpm run android:local-dev
pnpm run android:dev
pnpm run android:prd
pnpm run android:simulator:local-dev
```

모든 script는 ` scripts/run-with-envfile.mjs `가 선택한 env 파일을 읽어 실행한다\. 파일이 없으면 즉시 실패한다\.

### 10\. Safe Area

Native App은 좌우 inset을 직접 적용하고, top/bottom inset은 bridge로 Web에 전달한다\. Web은 CSS 변수와 layout primitive\(` Layout.Content `, ` Layout.Bottom `의 ` safeAreaVariant `\)로 AppBar·콘텐츠·하단 영역을 보정한다\.

### 11\. Bridge

envelope과 도메인 token·schema는 ` packages/shared `, 범용 전송·구독은 Web ` shared/bridge `, 파싱·dispatch는 App ` features/webview `, 발신·처리 코드는 각 feature가 소유한다\. ` packages/shared/README.md `가 모든 token × schema × 발신·처리 위치의 인덱스를 유지하고, token을 추가했는데 인덱스에 없으면 harness가 실패한다\.

### 12\. 구조 예외의 정리

초기에는 일부 feature에 어댑터 교체와 다단계 orchestration을 위한 ` apis `, ` services ` 폴더를 예외로 두었다\. 이후 요청은 모두 feature ` api/ `의 ` *.query.ts `·` *.mutation.ts `·` *.request.ts `로 옮겼고, 예외를 문서로만 관리하지 않도록 해당 폴더 이름 자체를 구조 검사에서 막았다\. 현재 구조 예외는 없다\.

### 13\. 검증

```bash
pnpm run lint
pnpm run structure:check
pnpm run test
pnpm run test:e2e
pnpm run typecheck
pnpm run build
pnpm --filter <app 패키지> run bundle:android:ci   # 루트 build에 포함되지 않는 Metro bundle 검증
```

검증 항목:

- [ ] ` package-lock.json `이나 workspace별 lockfile이 생기지 않았는가
- [ ] 루트에 런타임 의존성이 추가되지 않았는가
- [ ] 둘 이상의 workspace가 쓰는 패키지를 catalog로 옮겼는가
- [ ] import하는 패키지를 해당 workspace에 직접 선언했는가
- [ ] app → features → shared 방향과 feature 진입점 규칙을 지키는가
- [ ] Web Activity·params·route를 함께 등록했는가
- [ ] native method 계약이 두 플랫폼에서 일치하는가
- [ ] 배포 명령과 대상 브랜치가 일치하는가

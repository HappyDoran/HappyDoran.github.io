---
schemaVersion: 2
title: "Next.js 16과 OpenNext로 Cloudflare Workers 운영하기"
description: "WebView 앱이 띄우는 Next.js 콘텐츠를 OpenNext로 Cloudflare Workers에 배포·운영한 방식을 정리한다. Next.js 15에서 16으로 올린 이유, Turbopack 전환, OpenNext·Wrangler 설정, 배포 script와 dev 자동 배포 workflow, middleware.ts를 유지하는 이유, WebView 개발 환경에서 만난 dev 서버 문제와 deep link hydration 문제를 현재 코드와 커밋 기록 기준으로 다룬다."
tags: ["Next.js", "개발 도구", "네트워크"]
publishedAt: "2026-11-11T14:16:00.000Z"
updatedAt: "2026-11-11T14:17:00.000Z"
manuscriptPages: 44
---

> 표기: 프로젝트 고유 접두사는 ` {prefix} `, workspace 패키지 이름은 ` <web 패키지> `·` <app 패키지> `로 바꿔 적었다\.

### 문서 목적

WebView 앱이 띄우는 Next\.js 콘텐츠를 OpenNext로 Cloudflare Workers에 배포·운영한 방식을 정리한다\. Next\.js 15에서 16으로 올린 이유, Turbopack 전환, OpenNext·Wrangler 설정, 배포 script와 dev 자동 배포 workflow, ` middleware.ts `를 유지하는 이유, WebView 개발 환경에서 만난 dev 서버 문제와 deep link hydration 문제를 현재 코드와 커밋 기록 기준으로 다룬다\.

StackFlow 라우팅 자체와 popstate 우회의 상세는 「StackFlow 기반 WebView 내비게이션 설계」, CI 파이프라인과 배포 관문의 Agent 관점 설명은 「Mono\-repo에 AI Agent 작업 지원 체계 구축하기」에서 다뤘다\.

### 1\. 구성 개요

```mermaid
flowchart LR
    App[RN WebView shell] -->|MOBILE_WEB_APP_URL| Worker
    subgraph Cloudflare
      Worker[Worker: .open-next/worker.js] --> Assets[ASSETS binding<br/>.open-next/assets]
    end
    Worker -->|server route, API_BASE_URL| BE[Backend API]
    Dev[next build] --> ON[opennextjs-cloudflare build] --> Worker
```

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">항목</th><th scope="col">현재 값</th></tr></thead>
<tbody><tr><td>Next.js</td><td><code>16.4.3</code>, App Router, dev·build 모두 Turbopack</td></tr><tr><td>어댑터</td><td><code>@opennextjs/cloudflare</code> <code>^1.20.14</code></td></tr><tr><td>런타임 플래그</td><td><code>nodejs_compat</code></td></tr><tr><td>배포 대상</td><td><code>dev</code> 환경 Worker 하나</td></tr><tr><td>자동 배포</td><td><code>dev</code> 브랜치 push만</td></tr></tbody>
</table>
</div>

App의 WebView는 Web을 URL로 불러온다\. BE 호출은 App이 아니라 Web의 서버 route가 서버 전용 ` API_BASE_URL `로 한다\. 그래서 Web 서버 런타임이 Workers 위에서 돌아야 한다\.

### 2\. Next\.js 15 → 16 업그레이드: 배포가 막혀서

업그레이드는 새 기능이 아니라 배포 차단 때문에 했다\. 커밋 기록은 이렇다\.

- Next\.js 15가 지원 종료되면서 OpenNext의 버전 검사\(` checkNextVersionSupport `\)가 출시 2년이 지난 major로 판정해 dev 배포를 ` process.exit(1) `로 막았다\. 그 시점 이후 배포가 전부 실패했다\.
- ` next ` 16\.4\.2, ` @opennextjs/cloudflare ` 1\.20\.12\(` next >=16.4.1 ` peer\), ` wrangler ` 4\.151로 함께 올렸다\.

업그레이드에 딸려 온 변경은 다음과 같다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">변경</th><th scope="col">내용</th></tr></thead>
<tbody><tr><td>Turbopack 기본</td><td>Next 16은 dev·build 기본이 Turbopack이고, 커스텀 webpack 설정이 있으면 build가 실패한다. SVGR webpack 설정을 <code>turbopack.rules</code>로 옮기고 webpack 함수를 지웠다</td></tr><tr><td>ESLint</td><td><code>eslint-config-next</code> 16은 ESLint 9와 flat config를 요구해 <code>.eslintrc.json</code>을 <code>eslint.config.mjs</code>로 옮겼다. flat config는 <code>.gitignore</code>를 읽지 않아 <code>.open-next</code>, <code>.wrangler</code> 등 산출물을 <code>ignores</code>에 넣었다</td></tr><tr><td>React Hooks 규칙</td><td>react-hooks 7의 React Compiler 전제 규칙은 Compiler를 쓰지 않아 끄고 이전과 같은 범위만 검사한다</td></tr><tr><td>생성 파일</td><td><code>tsconfig</code>(<code>jsx: react-jsx</code>), <code>next-env.d.ts</code>는 Next 16 생성 형식을 따랐다</td></tr><tr><td>middleware</td><td><code>proxy</code>로 바꾸지 않았다(4절)</td></tr></tbody>
</table>
</div>

Turbopack 전환의 부수 효과도 기록되어 있다\. webpack에서 Pretendard CSS 파싱이 stack 초과로 깨지던 로컬 ` next build `가 이때 처음 통과했다\.

검증 기록은 lint, typecheck, Jest, 로컬 build, structure 검사, Playwright E2E 70개, OpenNext ` build:dev `, 로컬 Worker 미리보기에서 ` / ` 200·세션 없는 보호 화면 307·보호 API 401·` ?url ` SVG asset 200이었다\. 실기기와 실제 Cloudflare 배포는 merge 후 확인으로 남겼다\.

iOS 최소 지원 버전도 Next 16과 묶여 있다\. WKWebView 엔진이 OS에 묶이므로 Next\.js 16의 공식 지원 브라우저\(Safari 16\.4\+\)에 맞춰 iOS 16\.4로 정했다\.

### 3\. 설정 파일

#### ` next.config.ts `

```typescript
const SVG_URL_QUERY = /[?&]url(?=&|$)/;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.{PREFIX}_E2E === '1' ? '.next-e2e' : '.next',
  // 개발 서버는 다른 origin의 HMR을 막고, 막히면 클라이언트가 페이지를 계속 새로 고친다.
  allowedDevOrigins: ['10.*.*.*', '172.*.*.*', '192.168.*.*'],
  transpilePackages: [/* shared, design-system, stackflow-kit */],
  turbopack: {
    rules: {
      '*.svg': [
        { condition: { query: SVG_URL_QUERY }, type: 'asset' },
        { condition: { not: { query: SVG_URL_QUERY } }, loaders: [/* @svgr/webpack + svgo override */], as: '*.js' },
      ],
    },
  },
};
```

- ` ?url `로 가져오는 SVG는 파일 URL\(asset\), 나머지는 SVGR React 컴포넌트다\.
- svgo override 중 ` convertShapeToPath: false `는 Figma diamond gradient\(날씨 아이콘\)가 뒤집힌 rect 4장으로 내보내지는데 path로 합치면 뒤집기가 사라져 흰색으로 렌더되기 때문이다\.
- ` distDir ` 분기는 E2E 전용 빌드가 개발 서버의 ` .next `와 충돌하지 않게 한다\. 「WebView 하이브리드 앱의 테스트 계층 설계」에서 다뤘다\.

#### ` open-next.config.ts `와 ` wrangler.jsonc `

OpenNext 설정은 기본값 그대로다\.

```typescript
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
export default defineCloudflareConfig();
```

```json
{
  "main": ".open-next/worker.js",
  "compatibility_flags": ["nodejs_compat"],
  "workers_dev": true,
  "preview_urls": false,
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "observability": { "enabled": true },
  "env": {
    "dev": {
      "workers_dev": true,
      "preview_urls": false,
      "vars": { "API_BASE_URL": "<API 주소>" }
    }
  }
}
```

` env.dev.vars `에는 공개되어도 되는 API 주소 하나만 둔다\. 배포된 dev Worker의 런타임 값은 이 파일이 단일 기준이며 GitHub Variable로 전달하지 않는다\. 주소를 바꾸려면 이 파일을 고쳐 배포한다\. secret은 여기에 두지 않는다\.

### 4\. ` middleware.ts `를 ` proxy `로 바꾸지 않는다

Next 16은 ` middleware.ts `에 deprecated 경고를 띄우고 ` proxy `로의 codemod를 안내한다\. 하지만 ` proxy `는 Node 런타임 전용이고 OpenNext Cloudflare는 Node 미들웨어를 지원하지 않는다\. 그래서 Edge 미들웨어로 둔다\. 이 판단은 업그레이드 커밋 본문과 Web workspace 규칙 문서\(` web/AGENTS.md `\)에 함께 남겼다\. 다음 Agent나 사람이 경고를 보고 codemod를 돌리지 않게 하기 위해서다\.

#### ` src/ ` 밖의 middleware는 조용히 죽는다

초기에는 middleware가 Web workspace 루트에 있었다\. Next는 ` src ` 디렉터리를 쓰는 프로젝트에서 루트의 middleware를 읽지 않는다\. 그 결과 ` /api/protected ` 가드가 빌드 산출물에 실리지 않은 채 죽어 있었고, 빌드도 경고 없이 통과했다\. 파일을 ` web/src/middleware.ts `로 옮기고, 빌드 산출물의 ` middleware-manifest `에서 matcher가 실렸는지 확인했다\. integration 테스트와 비인증 deep link E2E도 같이 넣었다\.

#### middleware가 하는 일

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // cookie 유무만 본다. 유효성은 BE가 판정하고, 만료된 세션은 보호 API의 401이 정리한다.
  const hasSession = Boolean(/* access cookie */) || Boolean(/* refresh cookie */);

  if (!hasSession) {
    if (!pathname.startsWith('/api/')) {
      const homeUrl = request.nextUrl.clone(); // redirect는 절대 URL만 받는다. host·protocol 유지
      homeUrl.pathname = '/';
      homeUrl.search = '';
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.json({ code: 'SESSION_EXPIRED', message: '...' }, { status: 401 });
  }

  const requestHeaders = new Headers(request.headers);
  // 쿼리까지 넘겨야 새로고침·딥링크에서 activity의 선택 param이 복원된다.
  requestHeaders.set('x-{prefix}-request-path', `${pathname}${request.nextUrl.search}`);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/api/protected/:path*', '/body-analysis', '/body-analysis/:path*', '/closet', '/closet/:path*', '/my-page', '/my-page/:path*'],
};
```

catch\-all page는 이 header를 StackFlow ` initialContext `로 넘겨, 서버 렌더링 시점에도 요청 경로의 Activity를 그린다\.

```typescript
export default async function StackPage() {
  const requestPath = (await headers()).get('x-{prefix}-request-path');
  return <Stack initialContext={requestPath ? { req: { path: requestPath } } : undefined} />;
}
```

로그인·가입·세션 bootstrap\(` /api/auth/* `\)은 cookie 없이 호출해야 하므로 matcher에 넣지 않는다\. matcher 밖의 경로에서는 header가 없고, page는 ` initialContext `를 넘기지 않는다\.

### 5\. 빌드·배포 script

```json
"build:dev": "node ../scripts/run-with-envfile.mjs .env.dev opennextjs-cloudflare build --env dev",
"build:prd": "node ../scripts/run-with-envfile.mjs .env.prd next build",
"assert-dev-branch": "[ \"${GITHUB_REF_NAME:-$(git branch --show-current)}\" = dev ] || { echo '...'; exit 1; }",
"deploy:dev": "pnpm run assert-dev-branch && pnpm run build:dev && node ../scripts/run-with-envfile.mjs .env.dev opennextjs-cloudflare deploy --env dev",
"deploy:dev:ci": "pnpm run assert-dev-branch && opennextjs-cloudflare build --env dev && opennextjs-cloudflare deploy --env dev",
"upload:dev": "pnpm run assert-dev-branch && pnpm run build:dev && node ../scripts/run-with-envfile.mjs .env.dev opennextjs-cloudflare upload --env dev",
"preview:dev": "pnpm run build:dev && node ../scripts/run-with-envfile.mjs .env.dev opennextjs-cloudflare preview --env dev",
"cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
```

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">Script</th><th scope="col">용도</th><th scope="col">차이</th></tr></thead>
<tbody><tr><td><code>deploy:dev</code></td><td>로컬 수동 배포</td><td><code>.env.dev</code>를 로드해 빌드·배포</td></tr><tr><td><code>deploy:dev:ci</code></td><td>GitHub Actions 배포</td><td>CI에는 env 파일이 없어 envfile loader를 거치지 않는다</td></tr><tr><td><code>upload:dev</code></td><td>배포 없이 새 Worker 버전만 업로드</td><td>처음에는 브랜치 확인이 없어 다른 브랜치에서도 실행됐다. 나중에 <code>assert-dev-branch</code>를 붙였다</td></tr><tr><td><code>preview:dev</code></td><td>로컬 Worker 미리보기</td><td>브랜치 제한 없음</td></tr><tr><td><code>build:prd</code></td><td>prd 빌드</td><td>별도 배포 구성 전까지 Next 빌드만 수행</td></tr></tbody>
</table>
</div>

` assert-dev-branch `는 CI에서는 ` GITHUB_REF_NAME `, 로컬에서는 현재 Git 브랜치를 본다\. ` run-with-envfile.mjs `는 Node 내장 ` parseEnv `로 env 파일을 읽어 shell 값을 덮어쓴다\. ` process.loadEnvFile `은 우선순위가 반대라 쓰지 않는다고 주석에 적혀 있다\. env 파일이 없으면 팀 secret manager 값으로 만들라는 메시지와 함께 실패한다\.

` cf-typegen `이 만드는 ` cloudflare-env.d.ts `는 gitignore 대상이다\. Next 16 flat ESLint config가 ` .gitignore `를 읽지 않아 이 파일이 있으면 lint가 경고 0 기준으로 실패했고, 그래서 ESLint ` ignores `에도 넣었다\.

### 6\. dev 자동 배포 workflow

` .github/workflows/deploy-web.yml `은 ` dev ` 브랜치 push와 수동 실행\(` workflow_dispatch `\)에서만 돈다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">설정</th><th scope="col">값</th></tr></thead>
<tbody><tr><td>path filter</td><td>workflow 자신, <code>.github/actions/**</code>, 루트 manifest·lockfile·workspace 설정, <code>scripts/**</code>, <code>packages/shared/**</code>, <code>packages/design-system/**</code>, <code>web/**</code></td></tr><tr><td>concurrency</td><td>고정 그룹, <code>cancel-in-progress: true</code></td></tr><tr><td>environment</td><td>GitHub Environment <code>dev</code></td></tr><tr><td>permissions</td><td><code>contents: read</code></td></tr></tbody>
</table>
</div>

```mermaid
flowchart TD
    A[checkout, persist-credentials: false] --> B[private kit 인증]
    B --> C[toolchain 설치]
    C --> D["pnpm install --filter &lt;web 패키지&gt;..."]
    D --> E[private 의존성 자격 증명 삭제]
    E --> F[structure:check]
    F --> G[Web Jest]
    G --> H[Web typecheck]
    H --> I[Playwright 브라우저 설치]
    I --> J[Chromium·WebKit E2E]
    J --> K["deploy:dev:ci (CLOUDFLARE_API_TOKEN은 이 단계에만)"]
```

설계상 눈여겨볼 점은 셋이다\.

- <strong>설치 범위 제한\.</strong> 초기 배포 job이 App workspace의 patch postinstall까지 실행해 React Native 패치 대상 누락으로 설치가 중단됐다\. 그래서 Web과 그 의존 workspace만 설치한다\.
- <strong>토큰 노출 범위 최소화\.</strong> ` CLOUDFLARE_API_TOKEN `은 배포 단계의 ` env `로만 넘긴다\. job env로 올리면 설치 lifecycle script, 테스트, E2E가 읽을 수 있다\. private 의존성용 토큰은 설치 직후 runner의 Git 설정과 함께 지운다\.
- <strong>배포 직전 재검증\.</strong> PR 검증이 merge를 막지 못하는 저장소 조건이라, 배포 workflow가 구조 검사와 테스트·E2E를 다시 돌린 뒤에만 배포한다\. 이 배경은 AI Agent 지원 체계 글에서 다뤘다\.

배포 성공 여부는 GitHub Actions와 Cloudflare Workers 대시보드에서 확인한다\.

### 7\. 환경 변수

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">위치</th><th scope="col">역할</th></tr></thead>
<tbody><tr><td><code>web/env.d.ts</code></td><td>Web이 읽는 환경 변수 타입. 현재 서버 전용 <code>API_BASE_URL</code> 하나</td></tr><tr><td><code>web/.env.local</code>·<code>.env.dev</code>·<code>.env.prd</code></td><td>로컬 실행·빌드용. Git에 없고 팀 secret 값으로 만든다</td></tr><tr><td><code>wrangler.jsonc</code> <code>env.dev.vars</code></td><td>배포된 dev Worker의 런타임 값</td></tr><tr><td>GitHub Environment <code>dev</code></td><td><code>CLOUDFLARE_API_TOKEN</code> secret</td></tr></tbody>
</table>
</div>

```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    /** 서버 전용 API base URL */
    API_BASE_URL?: string;
  }
}
```

Web 코드는 ` process.env.API_BASE_URL `을 env 모듈 한 곳에서 읽고, 서버 route는 값이 없으면 500과 &quot;not configured&quot; 메시지를 돌려준다\. repository harness는 ` env.d.ts `, ` wrangler.jsonc `의 ` vars `, workflow가 넘기는 환경 변수가 실제 runtime 코드에서 읽히는지 검사한다\. 사용처를 지우면 선언도 지워야 ` structure:check `를 통과한다\.

환경은 local·dev·prd로 나뉘지만 Cloudflare 자동 배포 대상은 dev뿐이다\. prd는 환경 구성과 로컬 빌드만 있고, App의 prd 빌드도 당분간 dev Web·API에 연결한다\.

### 8\. WebView 개발 환경에서 만난 dev 서버 문제

Next 16 dev 서버는 시작한 hostname 밖 origin에서 오는 ` /_next/* ` dev 리소스\(JS chunk, HMR\) 요청을 기본으로 막는다\. WebView 개발 환경에서는 이 기본값이 두 번 문제가 됐다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">시점</th><th scope="col">증상</th><th scope="col">원인</th></tr></thead>
<tbody><tr><td>업그레이드 직후</td><td>LAN 실기기 WebView가 HTML만 받고 JS가 막힘. dev 로그에 <code>Blocked cross-origin request to Next.js dev resource /_next/hmr</code></td><td>실기기는 Mac의 LAN IP로 <code>--hostname 0.0.0.0</code> dev 서버에 붙는다</td></tr><tr><td>이후</td><td>Android 에뮬레이터 WebView가 약 80초마다 전체 새로고침을 반복하며 로딩 스피너에서 벗어나지 못함. iOS 시뮬레이터는 정상</td><td>에뮬레이터는 <code>10.0.2.2</code>로 접속해 HMR 연결이 거부되고, Next 클라이언트가 새로고침을 반복</td></tr></tbody>
</table>
</div>

해결은 ` allowedDevOrigins `에 사설 IP 대역을 넣는 것이다\.

```typescript
allowedDevOrigins: ['10.*.*.*', '172.*.*.*', '192.168.*.*'],
```

특정 IP가 아니라 대역으로 둔 이유는 커밋에 적혀 있다\. 네트워크가 바뀌어도 앱 재빌드 외에 설정을 고칠 필요가 없게 하기 위해서다\. 이 설정은 dev 서버에만 적용되고 production build와 OpenNext 배포에는 영향이 없다\. 에뮬레이터 수정은 앱 재실행 후 100초 동안 차단 로그 0건과 로그인 화면 렌더로 확인했고, 이 시점에 LAN 실기기 재확인은 하지 않았다고 기록되어 있다\.

같은 맥락에서 dev 서버를 다른 포트로 띄우면 App 쪽 ` MOBILE_WEB_APP_URL `도 맞춰야 한다\. App은 이 값을 빌드 타임에 바인딩한다\.

#### Wrangler 생성 타입과 DOM 충돌

` pnpm run cf-typegen `이 만드는 ` web/cloudflare-env.d.ts `는 Git 제외 대상이다\. Web의 ` **/*.ts ` 포함 범위에 이 파일까지 들어오면 생성된 전역 선언과 DOM 타입이 충돌해 typecheck·E2E용 Next build가 실패할 수 있었다\. 현재 Web 코드는 ` CloudflareEnv `를 소비하지 않으므로 ` web/tsconfig.json `의 ` exclude `에 ` cloudflare-env.d.ts `를 넣었다\(` 222a9fb `\)\. 파일을 생성한 상태에서도 typecheck와 E2E 빌드가 가능하도록 한 설정이며, 파일을 매번 수동으로 치우는 운영 절차가 아니다\.

### 9\. deep link hydration과 popstate

#### hydration 오류

하위 화면을 deep link로 열면 route의 ` defaultHistory `가 부모 화면을 아래에 깐다\. 이때 전환을 함께 쌓으면 전환 상태가 요청 시각으로 정해져, 서버\(요청 시각\)와 브라우저\(hydration 시각\)의 basic\-ui 전환 시간 CSS 변수가 달라졌다\. 결과는 ` Hydration failed `였다\.

해결은 두 단계를 거쳤다\.

1. 첫 시도: 탭 루트만 서버에서 그리고 하위 화면은 브라우저에서만 그렸다\. 그러자 Next가 history를 패치한 뒤 StackFlow가 첫 렌더에서 history를 써서 ` Cannot update a component (Router) while rendering Stack ` 오류가 새로 났다\. 이 변경은 되돌렸다\.
1. 최종: ` defaultHistory `에 ` skipDefaultHistorySetupTransition: true `를 켜 서버와 브라우저가 같은 idle 상태로 그리게 했다\. 새로고침·deep link에서 부모 화면이 밀려 들어오는 전환도 사라졌다\.

이 수정과 함께 production 빌드의 minified hydration 오류\(` #418 `·` #423 `·` #425 `\)까지 검사하는 E2E를 넣었고, 옵션을 끄면 실패하는 것을 확인했다\.

#### popstate ` __NA ` 우회

Next App Router는 자신이 쓰지 않은\(내부 표식 ` __NA `가 없는\) history 항목으로 ` popstate `가 오면 페이지를 새로 고친다\. ` defaultHistory ` 항목은 Next가 history를 패치하기 전에 쓰여 표식이 없다\. 그래서 ` stackflow.ts `가 모듈 로드 시 capture 단계 리스너로 StackFlow 항목에 표식을 붙인다\.

```typescript
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (event) => {
    const state = event.state as { __NA?: boolean; usr?: { _TAG?: string } } | null;
    if (state?.usr?._TAG === '@stackflow/plugin-history-sync' && !state.__NA) state.__NA = true;
  }, { capture: true });
}
```

Next 내부 표식에 기대는 우회이므로, 코드 주석에 Next를 올릴 때 deep link E2E가 깨지면 여기부터 보라고 적어 두었다\. 자세한 흐름은 StackFlow 내비게이션 글에서 다뤘다\.

### 10\. Agent와 Next 16의 문서 차이

` web/AGENTS.md ` 끝에는 ` nextjs-agent-rules ` 블록이 있다\. &quot;이 Next\.js는 학습 데이터와 다를 수 있으니 ` node_modules/next/dist/docs/ `의 가이드를 먼저 읽으라&quot;는 내용이고, ` next dev `가 실행될 때마다 다시 써 넣는다\. diff에서 지워도 다음 ` next dev `에서 다시 생기므로, 업그레이드 커밋에서 이 블록을 함께 커밋해 작업 트리를 깨끗하게 유지했다\. Next 16에서 바뀐 API\(` proxy `, Turbopack 기본, ESLint flat config\)를 Agent가 이전 버전 지식으로 고치지 않게 하는 장치다\.

### 현재 제약

- ` middleware.ts `는 Next 16에서 deprecated 경고를 낸다\. OpenNext Cloudflare가 Node 미들웨어를 지원하기 전까지 ` proxy `로 옮길 수 없다\.
- Cloudflare 자동 배포는 dev 하나뿐이다\. prd 배포 구성은 없고, App prd도 dev Web·API를 본다\.
- 배포 workflow는 path filter 밖의 변경\(문서·skill만 바꾼 push\)에는 돌지 않는다\.
- popstate 우회는 Next 내부 표식에 의존하므로 Next 업그레이드마다 deep link 복원을 회귀 검증해야 한다\.
- ` allowedDevOrigins ` 대역 설정 이후 LAN 실기기 재확인 기록은 없다\.
- 브라우저 E2E는 Worker 런타임이 아니라 로컬 ` next start `에서 돈다\. Worker 위 동작은 업그레이드 때 로컬 Worker 미리보기로 확인한 기록이 있을 뿐 자동 검증은 없다\.

### 참고

- Next\.js 16 업그레이드 가이드, ` allowedDevOrigins `·Turbopack ` rules ` 공식 문서
- OpenNext Cloudflare 공식 문서
- Wrangler 설정\(` vars `, ` assets `, ` compatibility_flags `\) 공식 문서
- 관련 글: StackFlow 기반 WebView 내비게이션 설계, Mono\-repo에 AI Agent 작업 지원 체계 구축하기, WebView 하이브리드 앱의 테스트 계층 설계, 프론트엔드 로컬 개발 환경 설정

### 구현 근거와 검토 범위

2026\-11\-11, FE commit ` 645a584 ` 기준으로 코드·설정과 관련 변경 이력을 대조했다\. 근거: ` web/tsconfig.json `, ` web/package.json `\. 문서에 인용한 이전 검증 기록과 이번 검토를 구분하며, 이번 작업에서 앱·브라우저 런타임 테스트를 재실행하지 않았다\.

### 관련 구현 문서

[Next\.js API route를 BFF로 둔 인증 설계](<https://app.notion.com/p/4150d0f75cd68132974dfd5fed689c7d>)

[WebView 하이브리드 앱의 테스트 계층 설계](<https://app.notion.com/p/4150d0f75cd681ddaf86eac2325c2082>)

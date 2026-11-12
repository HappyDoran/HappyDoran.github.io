---
schemaVersion: 2
title: "React Native WebView와 Next.js의 런타임·기능 경계 설계"
description: "React Native WebView shell과 Next.js 콘텐츠를 함께 운영할 때는 런타임 경계와 기능 소유권을 먼저 정해야 한다. 플랫폼 기능·화면·서버 요청을 분리하면서 공통 계약으로 연결하는 아키텍처를 살펴본다."
tags: ["React Native", "Next.js", "아키텍처", "상태 관리"]
publishedAt: "2026-08-03T08:49:00.000Z"
updatedAt: "2026-11-12T03:50:00.000Z"
manuscriptPages: 35
---

React Native WebView shell과 Next\.js 콘텐츠를 함께 운영할 때는 런타임 경계와 기능 소유권을 먼저 정해야 한다\. 플랫폼 기능·화면·서버 요청을 분리하면서 공통 계약으로 연결하는 아키텍처를 살펴본다\.

이 글은 전체 책임 지도를 다룬다\. 각 기능의 구체 구현은 관련 글로 분리하며, 디렉터리·이벤트·변수명·범위 값은 구성 예시다\.

### 1\. 기술 목표

- Web UI와 native capability가 서로의 변경에 끌려가지 않도록 경계를 나눈다\.
- App과 Web은 각자 실행할 수 있게 두고, 검증은 루트에서 한 번에 한다\.
- API, bridge, native module, storage 같은 신뢰 경계의 값은 런타임 schema로 검증한다\.
- 두 런타임이 주고받는 계약은 한 곳에서 정의해 양쪽이 같은 schema로 검증한다\.
- feature 변경이 shared나 앱 bootstrap으로 번지지 않게 한다\.
- 규칙은 문서에만 두지 않고 가능한 만큼 스크립트·타입·테스트로 강제한다\.

### 2\. 런타임 경계

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">런타임</th><th scope="col">책임</th></tr></thead>
<tbody><tr><td>React Native App</td><td>WebView host, 소셜 로그인 SDK, 위치, safe area, keypoint 카메라, 이미지 분할·인페인팅 실행, hardware back, 외부 URL 처리, 바이너리 업로드</td></tr><tr><td>Next.js Web</td><td>Activity UI, StackFlow 내비게이션, API route(BFF), 서버 상태, native bridge 소비</td></tr><tr><td>Native iOS</td><td>UIKit, AVFoundation, Vision, ONNX Runtime 기반 platform adapter</td></tr><tr><td>Native Android</td><td>View System, CameraX, ML Kit(pose·subject segmentation), ONNX Runtime 기반 platform adapter</td></tr><tr><td><code>packages/shared</code></td><td>App·Web이 함께 쓰는 bridge token, payload schema, 추론 타입</td></tr><tr><td><code>packages/design-system</code></td><td>Web 공통 UI primitive, SVG React component, 색상 token, Storybook</td></tr><tr><td>외부 <code>navigation-core</code></td><td>navigation lock, 안전한 action, 스프링 swipe-back, screen lifecycle</td></tr><tr><td>루트 workspace</td><td>pnpm workspace, 단일 lockfile, Turborepo task orchestration</td></tr></tbody>
</table>
</div>

```text
[React Native WebView Shell]
  ├─ auth / location / safe-area / pose-camera / cutout native adapters
  ├─ WebView controller: envelope 검증 → feature handler 위임
  └─ hardware back → Web으로 이벤트 위임
          │   (@example/shared 계약으로 양방향 검증)
          ▼
[Next.js WebView Content]
  ├─ StackFlow Activity (navigation-core + Web adapter)
  ├─ feature state / query / schema
  ├─ API route (HttpOnly cookie 인증 proxy)
  └─ generic HTTP client
          │
          ▼
[External HTTP APIs and object storage]
```

#### 일반 브라우저와 기능별 진입 경계

App 밖에서도 사진 선택·MediaPipe 포즈 검출·N개 keypoint 조정으로 같은 캡처 계약을 만들고, 메모리 사진을 사전서명 URL로 직접 PUT할 수 있다\. 네이티브 실시간 카메라·권한 처리는 App에 남는다\. 일반 브라우저 내비게이션은 앱 adapter가 ` animate: false `로 처리한다\.

인증 진입 UI와 공개 결과 조회는 별도 책임으로 나눈다\. 분석 내역의 대표 지정·선택 삭제는 로그인 리소스 정책을 따르고, 공개 공유는 별도 서버 페이지에서 공개 API만 소비하도록 구성한다\.

### 3\. Mono\-repo 경계

```text
.
├─ app/                      # React Native package와 iOS/Android 프로젝트
├─ web/                      # Next.js package와 Cloudflare 배포 설정
├─ packages/shared/          # App·Web 공통 bridge·도메인 schema/type
├─ packages/design-system/   # 공통 UI·아이콘·색상 token, Storybook
├─ scripts/                  # 환경별 실행, 구조·문서 검증 script
├─ tests/unit/               # 저장소 harness 테스트
├─ docs/                     # 아키텍처·가이드·runbook
├─ .github/                  # PR 검증, 배포 workflow, composite action
├─ package.json              # packageManager와 공통 turbo task
├─ pnpm-workspace.yaml       # workspace, catalog, install script 허용, patch
├─ pnpm-lock.yaml            # 단일 lockfile
└─ turbo.json                # task graph
```

루트는 런타임 의존성을 갖지 않는다\. 의존성과 framework 설정은 해당 workspace가 소유하고, workspace별 lockfile은 만들지 않는다\. pnpm isolated 설치를 쓰기 때문에 각 workspace는 import하는 패키지를 자기 ` package.json `에 직접 선언해야 한다\.

### 4\. 축소형 FSD

App과 Web의 TypeScript 소스는 같은 의존 방향을 쓴다\.

```text
app → features → shared
```

- ` app `: bootstrap, provider, route·Activity 조립
- ` features `: 기능이 소유하는 component, hook, state, schema, request, constant, type, utility
- ` shared `: 도메인과 무관한 transport, HTTP client, layout, navigation adapter, storage wrapper

feature끼리는 상대 slice의 공개 진입점\(` index.ts `, 서버 전용이면 ` server.ts `\)으로만, 그리고 한 방향으로만 import한다\. 둘 다 관계를 소유하지 않으면 ` app ` layer에서 조립한다\.

` entities `와 ` widgets `는 같은 도메인 모델이 여러 feature에서 독립적으로 반복되거나 route 조립이 실제로 복잡해졌을 때만 추가한다\.

#### workspace ` shared `와 ` packages/shared `의 차이

두 이름이 비슷하지만 책임이 다르다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">위치</th><th scope="col">소유 범위</th></tr></thead>
<tbody><tr><td><code>web/src/shared</code>, <code>app/src/shared</code></td><td>해당 런타임 안에서 도메인과 무관한 인프라</td></tr><tr><td><code>packages/shared</code></td><td>App ↔ Web 사이의 도메인 계약(token, payload schema, 타입)</td></tr></tbody>
</table>
</div>

두 런타임이 같은 계약을 검증해야 하므로 cross\-runtime 도메인 계약만 공통 패키지로 올린다\. 한 런타임에서만 쓰는 도메인 개념은 해당 feature에 남긴다\.

### 5\. Web 구조

```text
web/src/
├─ app/
│  ├─ [[...stack]]/          # catch-all page, StackFlow 설정, 여러 feature를 조합하는 Activity
│  ├─ api/                   # 인증 proxy, 공개 API, /api/protected/* 보호 API
│  ├─ app-providers.tsx
│  └─ layout.tsx
├─ features/                 # auth, home, image-analysis, assets, account, pose-camera, safe-area, bottom-tabs …
├─ shared/                   # api, bridge, stackflow adapter, components, lib, schemas
├─ middleware.ts             # 보호 경로 guard, 요청 경로 전달
└─ public/                   # 도메인별 정적 asset
```

catch\-all route는 StackFlow ` <Stack /> `만 렌더링한다\. Activity와 route·plugin 등록은 app layer에서 조립하고, 실제 화면 UI는 feature가 소유한다\. 하나의 Activity가 여러 feature를 조합하면 ` app/[[...stack]]/stackflow/activities `에 둔다\.

범용 HTTP 인프라는 ` shared/api `, 도메인 요청은 ` features/{feature}/api `에 둔다\. 요청 책임이 여러 폴더로 갈라지지 않게 api를 공개 규칙으로 정하고, 허용 폴더와 import 방향을 구조 검사로 연결한다\.

### 6\. App 구조

```text
app/src/
├─ app/                      # App.tsx: SafeAreaProvider, StatusBar, WebViewScreen 마운트
├─ features/                 # auth, image-editor, location, pose-camera, safe-area, webview
└─ shared/                   # 앱 버전 상수, 전역 ambient 타입
```

` features/webview `가 URL 결정, 외부 URL 처리, envelope 파싱·dispatch, hardware back을 소유한다\. 모든 web → native 메시지는 WebView controller 한 곳에서 라우팅하고, 각 native 기능의 실행은 해당 feature handler에 위임한다\. feature가 WebView 이벤트를 직접 구독하지 않는다\.

### 7\. Native platform 구조

React의 FSD를 native 소스에 복제하지 않는다\. iOS와 Android는 책임 layer를 먼저 두고 그 아래 도메인을 둔다\.

```text
Bridge/{Domain}   → JavaScript에 노출하는 얇은 module
Manager/{Domain}  → SDK lifecycle, queue, session, 변하는 추적 상태
Helper/{Domain}   → 매핑, 정규화, 기하 계산, 정책
Model/{Domain}    → native 내부 모델과 bridge 결과 모델
View/{Domain}     → native UI와 직접 상호작용
```

bootstrap 클래스는 등록과 lifecycle 전달만 맡는다\. 카메라 session 운영을 Bridge나 View에 넣지 않는다\. ` Features/ `, ` Platform/ ` 같은 디렉터리를 별도 layer로 추가하기 전에 플랫폼 책임과 중복되는지 확인한다\.

keypoint 카메라처럼 RN native view의 명령·이벤트 이름을 세 언어가 공유해야 하는 계약의 예시는 JSON 원본 하나에서 TypeScript·Kotlin·Swift 상수를 생성하고, 생성물이 원본과 어긋나면 구조 검사가 실패한다\.

### 8\. Native\-Web Bridge

```typescript
type BridgeMessage<TPayload = unknown> = {
  type: string;
  payload?: TPayload;
  source: 'native' | 'web';
  timestamp: string;
};
```

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">위치</th><th scope="col">소유</th></tr></thead>
<tbody><tr><td><code>packages/shared</code></td><td>envelope schema, 도메인별 token·payload schema·타입</td></tr><tr><td><code>web/src/shared/bridge</code></td><td>범용 전송·구독 primitive</td></tr><tr><td><code>app/src/features/webview</code></td><td>envelope 파싱과 dispatch</td></tr><tr><td>각 feature</td><td>발신 request와 수신 handler</td></tr></tbody>
</table>
</div>

native → web 메시지는 ` example:native-message ` CustomEvent로만 전달한다\. Web은 ` window `의 ` message ` 이벤트를 열지 않는다\. 범용 message 수신 경로를 줄이기 위해서다\. 이후 envelope·source·payload 검증도 함께 수행한다\.

수신 순서:

1. JSON envelope parse \(` bridgeMessageSchema `\)
1. ` source `와 event type 확인 — 상대 런타임에서 온 것이 아니면 버림
1. 도메인 payload ` safeParse `
1. native SDK·module 또는 Web state 실행
1. 결과 message dispatch

#### Hardware back

Android hardware back은 ` window.history.back() `을 주입하지 않는다\. App은 ` native:back-press ` 이벤트를 Web에 보내고, Web은 버튼 pop과 같은 경로\(navigation lock 포함\)로 처리한다\. 주입 방식은 Web의 lock을 우회해 전환 중 연타에서 이중 pop을 만들었다\.

App은 Web이 보내는 ` web:stack-state.canGoBack `을 기준으로 이벤트를 위임할지, 앱을 종료할지 정한다\. Web이 이 메시지를 한 번이라도 보냈다면 WebView 자체의 navigation state는 무시하고, 그 전까지만 fallback으로 쓴다\.

### 9\. API와 상태 관리

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">상태</th><th scope="col">도구</th><th scope="col">원칙</th></tr></thead>
<tbody><tr><td>컴포넌트 지역 UI</td><td><code>useState</code>, <code>useReducer</code></td><td>화면 안에 둔다</td></tr><tr><td>feature 클라이언트 작업 상태</td><td>Zustand</td><td><code>features/{feature}/stores/*.state.ts</code></td></tr><tr><td>서버 상태</td><td>TanStack Query</td><td>query cache를 source of truth로 쓴다</td></tr><tr><td>경계 계약</td><td>Zod</td><td>API·IPC·native·storage 값을 parse</td></tr></tbody>
</table>
</div>

서버 응답을 Zustand에 복제하지 않는다\. 무효화 시점이 두 곳이 되어 화면마다 다른 값이 남기 때문이다\. 사용자가 편집 중인 draft처럼 서버 값과 의도적으로 갈라지는 상태만 예외로 둔다\.

#### Next API route를 BFF로 둔 이유

- 로그인·refresh로 받은 토큰은 HttpOnly persistent cookie에만 저장하고, 브라우저에는 ` { userId } ` 같은 공개 세션 값만 준다\. 토큰은 browser storage·URL·로그에 남지 않는다\.
- 보호 API는 ` /api/protected/* ` 아래에 두고 middleware가 cookie 유무로 1차 guard를 건다\. cookie 유효성 판정은 백엔드 몫이다\.
- access token이 만료되면 서버 client가 refresh 후 원 요청을 한 번 재시도한다\. 회전형 refresh token이 동시에 쓰이지 않도록 refresh는 single\-flight로 합친다\.
- refresh가 거부되면 ` 401 SESSION_EXPIRED `로 정규화하고 cookie와 query cache의 공개 세션을 함께 지운다\. 일시 오류\(5xx, 네트워크\)는 cookie를 지우지 않고 오류를 전달한다\.
- 백엔드 시각에 timezone이 없으면 공통 schema가 UTC로 확정해 정규화한다\.

OpenAPI 생성 코드를 사용하려면 상태 enum과 응답 구조가 확정돼야 한다\. 그 전에는 feature의 수기 Zod schema를 명시적인 계약으로 관리하고, 생성기로 전환할 때 실제 응답과 대조한다\.

### 10\. Safe Area와 layout

Native ` SafeAreaView `는 좌우 inset만 처리한다\. top/bottom inset은 Web이 직접 다룬다\.

1. App이 콘텐츠 로드 전에 ` window.__EXAMPLE_INITIAL_SAFE_AREA__ ` 전역을 주입한다\.
1. Web ` <head> `의 동기 bootstrap script가 이 값\(없으면 localStorage 캐시\)을 CSS 변수 ` -example-safe-area-top/bottom `에 반영한다\. 첫 페인트 깜빡임을 막기 위해서다\.
1. 회전·포그라운드 복귀 등으로 값이 바뀌면 ` native:safe-area ` 이벤트로 다시 보낸다\.

bootstrap script는 zod를 쓸 수 없어 타입·범위\(예시 0~120\)를 직접 검증한다\. 화면 외곽은 ` Layout.Content `·` Layout.Bottom `의 ` safeAreaVariant `로 지정하고, ` StackScreen `은 AppBar 높이와 safe\-area top을 합산해 콘텐츠 offset을 계산한다\.

비슷한 맥락으로 Web은 화면 맨 위의 불투명 배경색이 바뀔 때마다 ` web:page-background `를 보내고, App은 그 색을 WebView 바탕\(위·아래 바운스 영역\)에 쓴다\.

### 11\. 환경과 배포 경계

App과 Web은 ` local `, ` dev `, ` prd ` 환경 파일을 각각 로드한다\. 환경 파일은 Git에 넣지 않고 팀 secret manager 값으로 로컬에서 만든다\. App 환경 값은 ` react-native-config `로 빌드 시점에 바인딩되므로 바꾸면 재빌드해야 한다\.

Web 배포 대상으로 OpenNext·Cloudflare Workers를 선택할 수 있다\. 실행·빌드 명령과 자동 배포 파이프라인은 별개이므로 local·dev·prd의 Web·API 주소와 배포 범위를 함께 문서화한다\.

### 12\. 검증 기준

```bash
pnpm run lint
pnpm run structure:check
pnpm run test
pnpm run test:e2e
pnpm run typecheck
pnpm run build
```

` structure:check `는 폴더·파일 규칙과 함께 FSD 역방향 import, feature 간 순환 import, 테스트 배치, bridge token 인덱스 누락, 알려진 신뢰 경계의 검증 marker, 선언만 남은 환경 변수까지 검사한다\.

변경 시 확인:

- [ ] shared가 feature·app을 import하지 않는가
- [ ] feature가 app을 import하지 않고, 다른 feature는 공개 진입점으로 한 방향만 import하는가
- [ ] cross\-runtime 계약이 ` packages/shared `에, 단일 런타임 도메인 계약이 feature에 있는가
- [ ] bridge·API·native 결과·storage 복원 값을 런타임 schema로 검증하는가
- [ ] Activity 등록, params 타입, URL route가 함께 바뀌었는가
- [ ] native module의 method, nullable 동작, result key가 두 플랫폼에서 일치하는가
- [ ] hardware back·swipe·버튼 pop이 같은 lock 경로를 지나는가
- [ ] 문서의 완료 상태와 실제 구현\(mock 여부, 배포 범위\)이 일치하는가

### 정리

- 네이티브 기능 실행과 Web UI·서버 상태의 소유권을 나눈다\.
- 공통 계약·범용 transport·feature handler를 분리한다\.
- 인증·파일·화면 전환의 신뢰 경계를 타입과 런타임 검증으로 연결한다\.
- 자동 검사 범위와 플랫폼·배포 검증 범위를 구분한다\.

### 관련 글

- React Native·Next\.js에서 축소형 FSD의 책임과 의존 경계 정하기
- pnpm 모노레포의 workspace와 축소형 FSD 구현
- Native\-Web 브리지의 메시지 계약과 보안
- Next\.js BFF의 HttpOnly cookie 인증 설계
- WebView의 Safe Area와 바운스 배경색 동기화
- WebView 하이브리드 앱의 테스트 계층과 검증 경계

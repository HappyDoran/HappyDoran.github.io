---
schemaVersion: 2
title: "StackFlow 기반 WebView: stackflow-kit 패키지 분리 배경과 설계"
description: "문서 목적"
category: "미분류"
categorySlug: "uncategorized"
tags: ["React", "아키텍처", "개발 도구"]
publishedAt: "2026-11-01T03:51:00.000Z"
updatedAt: "2026-11-10T15:32:00.000Z"
manuscriptPages: 37
---

### 문서 목적

Web 앱 안에 있던 StackFlow 공통 로직\(navigation lock, 안전한 action, 스프링 swipe\-back, screen lifecycle\)을 런타임과 무관한 독립 패키지로 분리한 배경과 설계를 정리한다\. 무엇을 패키지로 옮기고 무엇을 앱에 남겼는지, 앱이 패키지를 어떻게 소비·인증·검증하는지, 패키지를 어떻게 갱신하는지를 현재 구현 기준으로 다룬다\.

> 표기: 패키지 scope는 ` @scope `로 바꿔 적었다\.

### 1\. 분리한 배경

내비게이션 설계와 swipe\-back을 다듬으면서 ` web/src/shared/stackflow `에는 다음 코드가 쌓였다\.

- 같은 frame의 중복 action을 막는 token 기반 navigation lock
- lock을 거치는 ` push `·` replace `·` replaceTab `·` pop `
- 스프링 물리 기반 swipe\-back과 뒤 화면 패럴랙스
- 전환 위치, dim, touch 차단, idle 복귀 시 lock 해제를 담당하는 화면 셸
- AppBar, Layout, Tailwind class, Native\-Web bridge

이 가운데 앞의 네 가지는 앱 도메인과 무관했고, 나머지 하나만 앱 고유였다\. 한 폴더에 섞여 있으면서 다음 문제가 생겼다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">문제</th><th scope="col">내용</th></tr></thead>
<tbody><tr><td>테스트 소유</td><td>lock·swipe의 정밀한 동작 테스트와 앱 화면 테스트가 한 저장소에 섞여, 무엇이 엔진의 계약이고 무엇이 앱 배선인지 구분되지 않았다</td></tr><tr><td>경계 오염</td><td>화면 셸 안에서 native bridge로 stack 상태를 직접 보내, 일반 브라우저나 다른 host에서 재사용할 수 없었다</td></tr><tr><td>디자인 결합</td><td>AppBar·디자인 시스템이 셸에 박혀 있어 다른 앱이 쓰려면 디자인까지 따라와야 했다</td></tr><tr><td>회귀 범위</td><td>lock·swipe를 고치면 앱 전체 PR이 되어, 내비게이션 변경의 회귀 범위를 분리해 보기 어려웠다</td></tr><tr><td>재사용</td><td>같은 문제를 겪는 다른 WebView 앱에서 쓰려면 코드를 복사해야 했다</td></tr></tbody>
</table>
</div>

그래서 &quot;런타임과 디자인을 모르는 내비게이션 엔진&quot;과 &quot;앱이 주입하는 UI·bridge&quot;를 나누기로 했다\.

### 2\. 분리 원칙

1. **런타임 비의존**: 패키지는 WebView, React Native, bridge를 모른다\. host 연동은 adapter 계약으로만 주입받는다\.
1. **디자인 비의존**: AppBar, layout, CSS framework를 포함하지 않는다\. render prop과 class 주입 지점만 연다\.
1. **설정은 앱이 소유**: 패키지는 provider나 ` stackflow() ` 설정을 감싸지 않는다\. Activity·route·plugin 조립은 앱에 남긴다\.
1. **동작 테스트는 패키지가 소유**: lock·swipe·화면 셸의 동작 회귀는 패키지 저장소 CI가 잡고, 앱은 adapter 배선만 테스트한다\.
1. **좁은 공개 API**: 내부 store는 노출하지 않는다\. 읽기 전용 상태와 제한된 명령만 공개한다\.

### 3\. 무엇을 옮기고 무엇을 남겼나

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">책임</th><th scope="col">위치</th></tr></thead>
<tbody><tr><td>navigation lock, guarded action, swipe-back, screen lifecycle과 동작 테스트</td><td>외부 <code>stackflow-kit</code> 저장소</td></tr><tr><td>전환 시간·스프링 상수·곡선(<code>styles.css</code>)·패럴랙스 비율</td><td>외부 <code>stackflow-kit</code> 저장소</td></tr><tr><td>Activity·params registry·route·history sync 등록</td><td>앱 <code>app/[[...stack]]/stackflow/config/stackflow.ts</code></td></tr><tr><td>AppBar·Layout·safe area 조립</td><td>앱 <code>shared/stackflow/components/stack-screen.tsx</code></td></tr><tr><td>Native back 구독·stack 상태 발행</td><td>앱 <code>shared/stackflow/runtime/native-stackflow-runtime-adapter.ts</code></td></tr><tr><td>kit에 없는 앱 전용 동작(<code>popTo</code>)</td><td>앱 <code>shared/stackflow/hooks/use-stack-navigation.ts</code></td></tr></tbody>
</table>
</div>

### 4\. 패키지 공개 API

```text
@scope/stackflow-kit
  ├─ StackScreen, StackScreenProps, StackScreenRenderContext, StackScreenClassNames
  ├─ useStackNavigation, ActivityName, ActivityParams, NavigationOptions
  ├─ useSpringSwipeBack
  ├─ StackflowRuntimeAdapter, StackState
  ├─ STACK_TRANSITION_DURATION_MS, STACK_TRANSITION_EASING, PARALLAX_OFFSET_RATIO
  └─ StackActivityRegistry (module augmentation 대상)
@scope/stackflow-kit/navigation-lock   # React hook 밖에서 같은 lock을 써야 할 때
@scope/stackflow-kit/styles.css        # 화면 기본 스타일과 스프링 linear() 곡선
```

#### Activity 타입 registry

패키지는 Activity 이름을 모른다\. 앱이 module augmentation으로 채운다\.

```typescript
declare module '@scope/stackflow-kit' {
  interface StackActivityRegistry {
    HomeActivity: Record<string, never>;
    DetailActivity: { itemId: string };
  }
}
```

이렇게 하면 ` push(&#39;DetailActivity&#39;, { itemId }) `의 이름과 params가 앱의 registry 기준으로 타입 검사된다\. 패키지는 provider를 추가하지 않고, 앱이 기존 ` stackflow() ` 설정에 ` transitionDuration: STACK_TRANSITION_DURATION_MS `만 넘긴다\.

#### 화면 셸: render prop 주입

```typescript
<StackScreen
  renderHeader={({ isRoot, isTransitioning, pop }) => <AppBar ... />}
  renderContent={(children) => <Layout>{children}</Layout>}
  classNames={{ root: 'safe-area' }}
  contentStyle={{ marginTop: APP_BAR_OFFSET }}
  preventSwipeBack={preventSwipeBack}
  runtimeAdapter={runtimeAdapter}
>
  {children}
</StackScreen>
```

위치·크기·dim·전환은 패키지가 inline style로 소유하고, 앱은 class와 render prop으로 UI만 더한다\. ` renderHeader `는 ` isRoot `, ` isTransitioning `, lock을 거치는 ` pop `을 받으므로 앱 AppBar가 lock을 우회할 수 없다\.

#### Runtime adapter 계약

```typescript
export type StackflowRuntimeAdapter = {
  publishStackState?: (state: { canGoBack: boolean }) => void;
  subscribeBackPress?: (handler: () => void) => () => void;  // 구독 해제 함수 반환
};
```

adapter를 주입하지 않으면 일반 브라우저처럼 동작한다\. WebView 앱은 bridge로 이 두 함수를 구현한다\.

```typescript
export const nativeStackflowRuntimeAdapter = {
  publishStackState: (state) => postMessageToNative(WEB_STACK_STATE, state),
  subscribeBackPress: (handler) =>
    subscribeNativeMessages((message) => {
      if (message.type === NATIVE_BACK_PRESS) handler();
    }),
} satisfies StackflowRuntimeAdapter;
```

최상단 화면만 stack 상태를 발행하고 back 이벤트를 구독한다\. back 이벤트는 ` preventSwipeBack `·root·swipe 중이면 무시하고, 아니면 lock을 거치는 ` pop() `으로 간다\.

### 5\. 앱 쪽 의존 방향

```text
web features
  → @/shared/stackflow (barrel)
  → Web StackScreen adapter
  → @scope/stackflow-kit StackScreen + runtime 계약
  → @stackflow/react

web app config
  → feature Activities
  → @scope/stackflow-kit 상수·타입
```

화면 코드는 barrel만 쓴다\. barrel이 ` StackScreen `\(앱 adapter\)과 ` useStackNavigation `\(kit \+ 앱 확장\)의 출처 차이를 흡수하므로, kit을 교체하거나 앱이 기능을 덧붙여도 화면 코드는 바뀌지 않는다\. 설정·테스트처럼 barrel에 없는 심볼만 패키지에서 직접 가져온다\. 패키지 내부 경로 import는 금지한다\.

React와 StackFlow는 앱과 같은 인스턴스를 써야 한다\. lock store와 StackFlow context가 둘로 갈리면 보호가 무의미해지므로 ` react `, ` @stackflow/react `, ` @stackflow/react-ui-core `는 peer dependency로 둔다\.

#### 앱이 덧붙인 확장: ` popTo `

kit에는 여러 화면을 전환과 함께 한 번에 닫는 동작이 없다\. 앱은 ` popTo(activityName) `을 추가했다\.

- stack에서 해당 Activity를 찾아 그 위의 화면 수만큼 ` pop(count) `한다\. 맨 위 화면만 밀려나는 pop 전환을 쓴다\.
- 없으면\(deep link로 root가 된 화면\) ` replaceTab `으로 대체한다\.
- kit의 ` navigationLock.acquire() `로 같은 lock을 잡고, idle 복귀 때 kit ` StackScreen `이 푼다\.

화면 코드에서 ` useActions() `를 쓰는 유일한 예외이며, 같은 lock을 공유하므로 이중 pop 문제를 다시 만들지 않는다\. 다른 앱에서도 필요해지면 kit으로 올릴 후보다\.

### 6\. 배포 방식: 레지스트리 대신 고정 commit

패키지는 npm 레지스트리에 publish하지 않고, private Git 저장소의 **40자 commit SHA**로 설치한다\.

```json
{
  "dependencies": {
    "@scope/stackflow-kit": "github:<org>/stackflow-kit#<40자 commit SHA>"
  }
}
```

- branch나 tag 같은 mutable ref는 쓰지 않는다\. 같은 lockfile이 언제나 같은 코드를 설치해야 한다\.
- 패키지는 ` prepack `에서 TypeScript를 build한다\. pnpm 10은 허용 목록에 없는 의존성의 install script를 실행하지 않으므로, 같은 SHA를 ` pnpm-workspace.yaml `의 ` onlyBuiltDependencies `에 올린다\. 두 SHA가 다르면 build 없이 빈 패키지가 설치된다\.
- 저장소 harness가 SHA 형식, 두 SHA의 일치, 앱 저장소에 로컬 ` packages/stackflow-kit ` 사본이 다시 생기지 않았는지를 검사한다\.

#### 두 저장소

같은 초기 구현에서 두 저장소가 출발했고 이후 독립적으로 변경될 수 있다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">저장소</th><th scope="col">역할</th></tr></thead>
<tbody><tr><td>private 저장소</td><td>제품 앱이 소비하는 배포본. source, 동작 테스트, build. publish workflow 없음</td></tr><tr><td>public 저장소</td><td>향후 npm 공개 배포용. 공개 README, fixture, publish workflow와 release 계약. 현재 publish는 중단</td></tr></tbody>
</table>
</div>

#### 분리 단계

한 번에 저장소를 옮기지 않고, 각 단계마다 앱의 전체 검증\(lint, structure, typecheck, test, build, E2E\)을 통과시키며 다섯 단계로 나눴다\.

1. **workspace 패키지로 추출**: lock, 안전한 action, 스프링 swipe를 같은 저장소의 ` packages/stackflow-kit `으로 옮기고 Web은 public export만 쓰게 했다\. 패키지가 앱 코드를 import하지 못하도록 harness 검사를 함께 넣었다\.
1. **runtime adapter 경계 분리**: 화면 lifecycle과 최소 DOM 구조를 패키지로 옮기고, AppBar·Layout·스타일은 render prop으로 주입하게 했다\. 패키지 기본값은 bridge 없는 브라우저 동작이고, Web adapter가 stack 상태 발행과 native back 이벤트를 기존 guarded pop 경로에 연결한다\.
1. **배포 계약 안정화**: Activity별 params 타입 registry와 제한된 lock API를 공개하고, ESM·declaration 산출물, CSS export를 구성했다\. 실제 tarball을 Next\.js·Vite fixture에 설치해 검증하는 단계를 CI에 넣었다\.
1. **외부 저장소로 소비 전환**: private 배포본과 public 공개 준비본의 역할을 나누고, Web이 private 저장소의 검증된 commit을 직접 설치하게 바꿨다\. CI에 읽기 전용 secret을 추가했다\.
1. **source 소유권 완전 분리**: 앱 저장소의 로컬 사본과 패키지 전용 검증을 지우고, commit 소비 계약과 인증 운영 문서만 남겼다\. 이때 처리 화면에 남아 있던 raw ` useActions ` 호출도 kit navigation으로 바꿔, 전환 중 도착한 결과는 idle까지 보류하고 화면을 떠난 뒤 늦게 온 결과는 버리게 했다\.

#### 버전 정책

- SemVer\. ` 0.x ` 동안 호환되지 않는 공개 API 변경은 minor, 호환되는 수정은 patch를 올린다\.
- 변경 내역은 패키지 저장소의 GitHub Release가 소유하고, 별도 CHANGELOG를 중복 유지하지 않는다\.
- 안정화 후 ` 1.0.0 `부터 공개 API 호환성을 보장한다\.

### 7\. Private 의존성 인증

#### 로컬

lockfile은 의존성을 SSH Git URL로 기록한다\. 저장소 읽기 권한이 있는 SSH key를 쓰거나, PAT를 쓴다면 한 번만 설정한다\.

```bash
git config --global url."<https://<PAT>@github.com/>".insteadOf "git@github.com:"
```

권한이 없으면 ` pnpm install `이 ` Repository not found `로 실패한다\.

#### CI

PR 검증, App·shared 검증, Web 배포 세 workflow가 repository secret으로 받은 읽기 전용 fine\-grained token\(대상 저장소 하나, ` Contents: read `\)을 쓴다\.

1. checkout의 ` persist-credentials `를 끈다\.
1. composite action이 SSH Git URL을 token이 담긴 HTTPS URL로 치환한다\.
1. ` pnpm install --frozen-lockfile `
1. **설치 직후 **` $HOME/.gitconfig `**를 지운다**\(` if: always() `\)\.

4번이 핵심이다\. 이 단계가 없으면 이후의 test·build·E2E, 즉 PR이 작성한 코드가 token을 읽을 수 있다\. 설치 단계의 lifecycle script는 여전히 token 사정권 안이므로 PR의 ` package.json ` 변경은 리뷰에서 확인한다\. secret을 받지 못하는 fork·Dependabot PR은 인증 단계에서 원인을 출력하고 실패한다\.

### 8\. 테스트 소유권

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">대상</th><th scope="col">소유</th></tr></thead>
<tbody><tr><td>lock, guarded action, swipe 판정·스프링, <code>StackScreen</code> lifecycle, <code>styles.css</code> 곡선 일치</td><td>패키지 저장소 (jsdom 동작 테스트)</td></tr><tr><td>배포 산출물이 실제 Next.js 앱에서 동작하는지</td><td>패키지 저장소 (tarball을 Next.js fixture에 설치하는 검증)</td></tr><tr><td>runtime adapter 주입, AppBar back 버튼, close-only variant</td><td>앱 <code>stack-screen</code> integration 테스트</td></tr><tr><td>bridge token 연결</td><td>앱 runtime adapter integration 테스트</td></tr><tr><td>Activity 이름·params 타입 계약</td><td>앱 type 테스트</td></tr><tr><td>새로고침·deep link route</td><td>앱 브라우저 E2E</td></tr></tbody>
</table>
</div>

앱은 kit의 동작을 다시 테스트하지 않는다\. 같은 동작을 두 곳에서 테스트하면 한쪽만 고쳐지는 순간 서로 다른 기대값을 갖게 된다\.

### 9\. 패키지 갱신 절차

1. 패키지 저장소에서 typecheck, 동작 테스트, 패키지 산출물 검증을 통과시킨다\.
1. 앱에서 쓸 commit SHA를 확정한다\.
1. ` web/package.json `의 의존성과 ` pnpm-workspace.yaml `의 ` onlyBuiltDependencies `를 새 SHA로 바꾸고 ` pnpm install `로 루트 lockfile을 갱신한다\.
1. ` pnpm install --frozen-lockfile `, 루트 lint·test·typecheck·build·structure 검사, 브라우저 E2E를 실행한다\.
1. PR에서 CI가 private 의존성 설치와 전체 검증을 통과하는지 확인한다\.
1. 아래 수동 회귀 지점을 실기기에서 확인한다\.

### 10\. 회귀 지점

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">위험</th><th scope="col">자동 검증</th><th scope="col">수동 확인</th></tr></thead>
<tbody><tr><td>React·StackFlow 중복 인스턴스</td><td>typecheck, production build</td><td>—</td></tr><tr><td>같은 frame 중복 push/pop</td><td>패키지 navigation 테스트</td><td>빠른 연속 탭</td></tr><tr><td>swipe와 버튼 pop 경합</td><td>패키지 swipe 테스트</td><td>iOS WebView swipe</td></tr><tr><td>hardware back 경로 이탈</td><td>앱 <code>stack-screen</code> adapter 주입 테스트</td><td>Android hardware back</td></tr><tr><td>Activity 등록부 3곳 불일치</td><td>설정 파일의 타입 단언</td><td>—</td></tr><tr><td>새로고침·deep link route 유실</td><td>브라우저 E2E</td><td>WebView deep link 복원</td></tr><tr><td>로컬 source 사본 재도입, mutable ref 고정</td><td><code>structure:check</code></td><td>—</td></tr><tr><td>push·pop·swipe 곡선 불일치, 뒤 화면 패럴랙스 지연</td><td>패키지 <code>StackScreen</code>·swipe 테스트, 곡선 일치 테스트</td><td>iOS 실기기 push·pop·swipe</td></tr><tr><td>WKWebView 60fps 상한 복귀</td><td>—</td><td>ProMotion 실기기 rAF/s 120</td></tr></tbody>
</table>
</div>

### 11\. 분리 후 효과와 한계

효과:

- 앱 PR은 adapter 배선만 검증하고, 내비게이션 엔진의 회귀는 패키지 CI가 따로 잡는다\.
- 내비게이션 변경이 commit SHA 교체라는 하나의 명시적 단위가 되어, 무엇이 언제 바뀌었는지 lockfile diff로 드러난다\.
- bridge와 디자인 시스템이 엔진에서 빠져, 일반 브라우저나 다른 host에서도 같은 엔진을 쓸 수 있다\.

한계:

- private Git 의존성이라 로컬·CI 모두 인증이 필요하고, 인증 설정이 CI 보안 경계의 일부가 됐다\.
- 패키지 변경을 앱에서 확인하려면 SHA를 바꾸고 설치를 다시 해야 해서 왕복이 길다\.
- 뒤 화면 탐색은 여전히 StackFlow renderer의 DOM 구조에 의존한다\.
- 앱 확장\(` popTo `\)처럼 kit 바깥에서 같은 lock을 잡는 코드는 저수준 lock API 계약에 기댄다\.

### 참고

- 관련 글: StackFlow 기반 WebView 내비게이션 설계, 커스텀 Swipe\-back 구현 배경 및 설계

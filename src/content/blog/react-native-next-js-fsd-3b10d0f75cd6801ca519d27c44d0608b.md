---
schemaVersion: 2
title: "React Native·Next.js에서 축소형 FSD의 책임과 의존 경계 정하기"
description: "기능 중심 폴더를 적용할 때 모든 FSD layer를 먼저 만들면 사용하지 않는 추상화와 이동 비용이 늘어날 수 있다. React Native와 Next.js에 공통으로 적용할 수 있는 세 layer 구조를 예로 들어, feature 소유권과 확장 시점을 정리한다."
tags: ["React Native", "Next.js", "아키텍처"]
publishedAt: "2026-08-03T08:48:00.000Z"
updatedAt: "2026-11-12T03:49:00.000Z"
manuscriptPages: 25
---

기능 중심 폴더를 적용할 때 모든 FSD layer를 먼저 만들면 사용하지 않는 추상화와 이동 비용이 늘어날 수 있다\. React Native와 Next\.js에 공통으로 적용할 수 있는 세 layer 구조를 예로 들어, feature 소유권과 확장 시점을 정리한다\.

이 글은 구조를 선택하는 이유와 경계에 집중한다\. 폴더명·suffix·검사 항목은 규칙의 예시이며 공식 FSD의 필수 규약으로 해석하지 않는다\.

### 세 layer로 시작하는 이유

기능 소유권과 의존 방향을 먼저 정하려면 ` app `, ` features `, ` shared ` 세 layer로 시작할 수 있다\. 아래는 전체 FSD를 도입하기 전에 적용할 수 있는 축소 규칙의 예시다\.

- 구조보다 책임을 먼저 나눈다\.
- 실제 파일이 있는 디렉터리만 만든다\. 빈 폴더를 검사 대상으로 삼으면 사용하지 않는 구조가 늘어나는 것을 줄일 수 있다\.
- ` entities `, ` widgets `는 재사용 압력이 확인되기 전에는 만들지 않는다\.
- 의존 방향은 ` app → features → shared `로 고정한다\.

```text
package/src/
├─ app/       # bootstrap and assembly
├─ features/  # feature-owned implementation
└─ shared/    # domain-independent infrastructure
```

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">방향</th><th scope="col">허용 여부</th></tr></thead>
<tbody><tr><td><code>app</code> → <code>features</code>, <code>shared</code></td><td>허용</td></tr><tr><td><code>features</code> → <code>shared</code></td><td>허용</td></tr><tr><td><code>features</code> → 다른 <code>features</code></td><td>상대의 <code>index.ts</code>·<code>server.ts</code> 진입점으로, 한 방향만 허용</td></tr><tr><td><code>features</code> → <code>app</code></td><td>금지</td></tr><tr><td><code>shared</code> → <code>features</code>, <code>app</code></td><td>금지</td></tr></tbody>
</table>
</div>

두 feature가 서로를 import해야 한다면 어느 쪽도 관계를 소유하지 않는다는 신호다\. 이때는 ` app ` layer에서 조립한다\.

### features

feature는 UI뿐 아니라 그 기능의 상태, 런타임 계약, 요청, utility까지 함께 소유한다\.

```text
features/{feature}/
├─ components/
├─ hooks/
├─ stores/       # *.state.ts
├─ schemas/      # *.schema.ts
├─ api/          # *.query.ts, *.mutation.ts, *.request.ts
├─ constants/    # *.constant.ts
├─ types/        # *.type.ts
├─ utils/        # *.utils.ts
├─ index.ts      # 공개 진입점
└─ server.ts     # (선택) Next API route 전용 진입점
```

필요한 책임 폴더만 만든다\. ` model `, ` apis `, ` queries `, ` services `, ` config `, ` interfaces `, ` errors `는 이 예시 구조에 포함하지 않는다\. 어댑터와 서버 요청은 ` api/ `로 모아 요청 책임의 위치를 하나로 만든다\.

### components/

Activity, screen, section과 feature 전용 UI를 둔다\. I/O 계약과 영속화 로직을 component에 직접 구현하지 않는다\.

### hooks/

구독, UI 이벤트, store와 요청의 조합을 둔다\. 여러 feature에서 재사용되는 도메인 무관 hook만 shared 이동을 검토한다\.

### stores/

Zustand와 local·session 상태를 둔다\. 서버 응답을 query cache와 store에 중복 저장하지 않는다\. 사용자가 편집 중인 draft처럼 서버 값과 의도적으로 갈라지는 작업 상태만 예외다\.

### schemas/

API, IPC, native module, storage 경계의 Zod schema를 둔다\. 외부 값은 typed value로 쓰기 전에 ` safeParse ` 또는 ` parse `한다\.

단, App과 Web이 함께 검증해야 하는 bridge 계약은 feature가 아니라 ` packages/shared `가 소유한다\. 한쪽 런타임만 쓰는 도메인 schema만 feature에 둔다\.

### types/

` z.infer `, type alias, interface를 둔다\. 런타임 schema와 type\-only export를 분리한다\.

### constants/

event token, storage key, option 목록, 순서가 의미를 갖는 식별자 집합을 둔다\. 런타임 계약에서 배열 순서가 의미를 가지면 constant를 단일 출처로 쓴다\.

### api/

서버 요청, native SDK·module 요청, bridge 요청을 둔다\. query뿐 아니라 mutation과 imperative 요청을 포함하므로 이름을 ` api/ `로 통일한다\. 이 폴더에는 query hook뿐 아니라 mutation과 imperative bridge 요청도 함께 들어간다\.

- 서버 상태: 요청 함수와 TanStack hook을 ` .query.ts ` 또는 ` .mutation.ts `에 함께 둔다\.
- imperative native·bridge 요청: ` .request.ts `
- 순수 payload 변환은 ` utils/ `가 소유한다\.
- ` .api.ts ` 같은 별도 계층을 만들지 않는다\.
- UI는 raw 서버 요청을 직접 호출하지 않는다\.

### utils/

feature 내부의 순수 계산과 formatting만 둔다\. lifecycle, I/O, 변하는 상태를 utility 뒤에 숨기지 않는다\.

### 공개 진입점

다른 slice는 ` index.ts `로만 가져온다\. 일반 barrel이 client/server 경계를 넘으면 런타임별 진입점\(` server.ts `\)을 따로 둔다\. 예를 들어 Next API route는 ` features/auth/server.ts `만 import해 client 전용 모듈이 서버 번들에 섞이지 않게 한다\.

### shared

도메인과 무관한 인프라와 primitive만 둔다\.

```text
shared/
├─ api/         # generic HTTP client, 서버 client, auth cookie, protected route helper
├─ bridge/      # 범용 envelope 전송·구독
├─ stackflow/   # 외부 navigation 패키지와 앱 UI를 잇는 adapter
├─ lib/         # env, query client, 공용 hook, 순수 helper
├─ components/  # 재사용 UI와 layout
├─ schemas/     # 도메인 무관 공통 schema (예: 서버 시각 정규화)
└─ types/       # 전역 선언
```

도메인 payload, event token, schema, 요청 helper는 여러 파일에서 쓰더라도 owning feature에 남긴다\. 두 런타임이 공유하는 계약은 workspace ` shared `가 아니라 ` packages/shared `로 간다\.

### app

framework entry와 여러 feature의 조립만 맡는다\.

- React Native: root component와 provider
- Next\.js: layout, provider, API route, middleware, StackFlow Activity·route 등록, 여러 feature를 조합하는 Activity

feature 하나로 끝나는 Activity UI와 도메인 상태는 app layer에 두지 않는다\.

### Native platform 패턴

Native 소스는 FSD가 아니라 platform adapter 책임으로 구성한다\.

```text
Bridge → Manager → Helper → Model → View
```

- Bridge: method 노출과 결과 변환
- Manager: SDK lifecycle과 비동기 작업
- Helper: stateless 계산과 정책
- Model: 내부·bridge 데이터
- View: platform UI와 직접 입력

bootstrap 클래스에는 도메인 구현을 넣지 않는다\. iOS는 ` Bridge/{Domain} `, Android는 소문자 ` bridge/{domain} `처럼 플랫폼 관례를 따르고, ` Features/ `·` Platform/ ` 같은 React식 디렉터리는 검사 규칙에서 제한할 수 있다\.

### 네이밍

- 파일·디렉터리: ` kebab-case `
- component·type: ` PascalCase `
- hook: ` use ` \+ ` camelCase `
- 함수: ` camelCase `
- 상수: ` SCREAMING_SNAKE_CASE `
- 상태: ` .state.ts `
- schema: ` .schema.ts `
- 타입: ` .type.ts `
- 상수 파일: ` .constant.ts `
- 요청: ` .query.ts `, ` .mutation.ts `, ` .request.ts `
- utility: ` .utils.ts `
- 테스트: workspace ` tests/ ` 아래 ` .test.ts(x) `, E2E는 ` .spec.ts `

framework가 정한 파일 이름과 native 플랫폼 관례는 해당 규칙을 우선한다\.

### 금지 패턴과 이유

규칙에 이유를 같이 적지 않으면 다음 작업자가 &quot;정리 가능한 중복&quot;으로 보고 되돌린다\. 제한 항목마다 이유와 허용 예외를 함께 문서화해야 한다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">금지</th><th scope="col">이유</th><th scope="col">허용 예외</th></tr></thead>
<tbody><tr><td>모든 컴포넌트에 <code>&#39;use client&#39;</code></td><td>서버 컴포넌트로 남길 수 있는 트리가 사라지고 번들이 커진다</td><td>hook·이벤트 핸들러·브라우저 API를 쓰는 모듈</td></tr><tr><td>단순 CRUD에 repository/use-case/interface 계층</td><td>구현이 하나뿐인 인터페이스는 호출 추적만 늘린다</td><td>실제 구현이 2개 이상이거나 런타임이 갈리는 경계</td></tr><tr><td><code>.svg?react</code>, feature별 SVG wrapper</td><td>같은 아이콘이 다른 이름으로 복제되고 번들러 설정에 기대게 된다</td><td>없음 — design system 아이콘으로 등록</td></tr><tr><td>token이 있는 색을 리터럴 hex로</td><td>token과 화면 값이 갈라진다</td><td>token에 없는 디자인 값은 리터럴 그대로 (억지 token 신설 금지)</td></tr><tr><td>입력·bridge payload·storage 값을 검증 없이 사용</td><td>Web 측 버그가 native 권한 호출로 번진다</td><td>zod를 쓸 수 없는 <code>&lt;head&gt;</code> 동기 script는 수동 검증</td></tr><tr><td>서버 응답을 Zustand에 복제</td><td>무효화 시점이 두 곳이 된다</td><td>편집 중 draft</td></tr><tr><td>화면에서 StackFlow <code>useActions().pop()</code> 직접 호출</td><td>navigation lock을 우회해 이중 pop이 재현된다</td><td>lock 토큰을 소유·해제하는 내부 경로</td></tr></tbody>
</table>
</div>

### 확장 판단

` entities ` 도입 조건:

- 같은 도메인 type·store·mapper·불변식을 세 개 이상의 feature가 독립적으로 사용
- feature 소유가 인위적으로 느껴질 정도로 shared에 도메인 타입이 쌓임
- mapper와 도메인 helper가 반복 구현됨

` widgets ` 도입 조건:

- route entry가 여러 feature를 반복 조립해 읽기 어려움
- 독립 조립 로직을 가진 화면 영역이 재사용됨
- feature 디렉터리가 전체 페이지 조립까지 소유하게 됨

대칭이나 예상 재사용만으로는 어느 layer도 추가하지 않는다\. 여러 feature를 조합하는 Activity는 framework 진입점의 조립 영역에 둘 수 있다\. 반복 조립의 부담이 실제로 생길 때 별도 layer를 검토한다\.

### 검증

다음 항목을 구조 검사로 강제할 수 있다\. 검사 script의 존재만으로 모든 의미적 책임 경계가 검증되는 것은 아니다\.

- [ ] 역방향 import가 없는가
- [ ] 다른 feature를 공개 진입점으로 한 방향만 import하는가
- [ ] feature에 ` model `·` apis `·` queries `·` services ` 폴더가 생기지 않았는가
- [ ] shared가 도메인 계약을 소유하지 않는가
- [ ] 요청과 query hook이 같은 ` api/ ` 파일에 있는가
- [ ] suffix와 공개 ` index.ts `가 일관적인가
- [ ] 소스 폴더 안에 테스트가 없는가
- [ ] native 소스가 React 디렉터리 패턴을 복제하지 않는가

### 정리

- app은 조립, features는 기능, shared는 도메인 무관 기반을 소유한다\.
- 서버 상태와 작업 상태, 공통 런타임 계약과 단일 feature 계약을 나눈다\.
- 의존 방향·공개 진입점·예외 이유를 함께 검사한다\.
- entities와 widgets는 반복 소유권과 조립 부담이 확인될 때 추가한다\.

### 관련 글

- pnpm 모노레포의 workspace와 축소형 FSD 구현
- React Native·Next\.js 모노레포의 로컬 개발 환경
- 모노레포의 런타임·의존성 버전 관리
- 모노레포의 AI Agent 문서·검증 체계 설계

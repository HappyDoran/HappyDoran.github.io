---
schemaVersion: 2
title: "React에서 Mobile UX를 위한 Stackflow 도입 고민"
description: "기존의 웹 라우팅(Next.js 등)은 URL 변경 → 페이지 교체(Unmount/Mount) 방식을 사용한다. 이는 데스크탑 웹에서는 적합하지만, 모바일 앱 특유의 화면이 겹치며 쌓이는 느낌은 주지 못한다. Stackflow는 브라우저 위해서 가상의 스택(Stack)을 구현해서 사용자에게 Mobile UX 경험을 제공한다."
tags: ["React", "아키텍처", "상태 관리"]
publishedAt: "2026-01-10T09:25:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 15
---

### 1\. 개요

기존의 웹 라우팅\(Next\.js 등\)은 URL 변경 → 페이지 교체\(Unmount/Mount\) 방식을 사용한다\. 이는 데스크탑 웹에서는 적합하지만, 모바일 앱 특유의 <strong>화면이 겹치며 쌓이는 느낌</strong>은 주지 못한다\. Stackflow는 브라우저 위해서 가상의 스택\(Stack\)을 구현해서 사용자에게 Mobile UX 경험을 제공한다\.

---

### 2\. Stackflow란 무엇인가?

#### 2\.1\. 정의 및 출처

JS 환경\(React\)에서 iOS/Android 네이티브 앱과 동일한 화면 전환 및 스택 네비게이션 경험을 구현해주는 라이브러리이다\. <strong>🥕당근 프론트엔드 팀</strong>에서 개발 및 오픈소스로 공개하였으며, 당근마켓 앱 내의 수많은 웹뷰 페이지들이 다음을 기반으로 동작한다\.

` → 부분적으로나마 스택의 개념을 사용할 수 있다는 것을 뜻한다. `

---

### 3\. Technical Deep Dive\(핵심 기술 분석\)

Stackflow는 단순한 애니메이션 라이브러리가 아닌, <strong>상태 기반의 네비게이션 시스템</strong>이다\. 그 핵심 원리는 다음과 같다\.

#### 3\.1\. 마이크로 커널 &amp; 플러그인 아키텍처 \(Micro\-kernel &amp; Plugin System\)

Stackflow의 Core\(` @stackflow/core `\)는 매우 경량화되어 있으며, 오직 &\#39;스택의 상태\(State\)&\#39;만을 관리한다\. 실제 화면을 그리고, URL을 바꾸는 기능은 모두 <strong>플러그인</strong>에게 위임한다\.

```javascript
// 📄 src/stackflow/stackflow.ts
import { stackflow } from "@stackflow/react";

export const { Stack, useFlow } = stackflow({
  // Core는 상태만 관리하고, 실제 동작은 플러그인이 담당함
  plugins: [
    basicRendererPlugin(), // 1. 화면 그리기 & 애니메이션 담당
    historySyncPlugin({    // 2. 브라우저 URL 동기화 담당
      routes: {
        HomeActivity: "/",
        DetailActivity: "/detail/:id",
      },
    }),
  ],
});
```

<strong>Renderer Plugin: </strong>Core의 상태를 구독하여 실제 DOM을 렌더링하고, CSS ` transform `을 이용해 화면 전환\(Transition\) 애니메이션을 처리한다\.

<strong>History Sync Plugin:</strong> Stackflow의 내부 상태와 브라우저의 History API를 양방향으로 동기화한다\. 이 덕분에 SPA\(Single Page Application\)임에도 불구하고 뒤로가기 버튼과 새로고침이 정상 작동한다\.

#### 3\.2\. DOM 보존과 메모리 관리 \(Stack Context\)

일반적인 웹 라우터와 가장 차별화되는 지점이다\.

<strong>기존 라우터\(Next\.js\):</strong> 페이지 A → B 이동 시, A 컴포넌트는 <strong>Unmount</strong>된다\. 뒤로가기 시 A를 다시 처음부터 그린다\.

<strong>Stackflow:</strong> 페이지 A → B 이동 시, A 컴포넌트는 <strong>Inactive\(비활성\)</strong> 상태로 DOM에 남아있고, B가 그 위에 <strong>Active\(활성\)</strong> 상태로 쌓인다\.

- <strong>이점:</strong> 뒤로가기\(` pop `\) 시 이전 화면이 <strong>0ms</strong>의 속도로 즉시 나타나며, 스크롤 위치와 입력하던 데이터가 <strong>100% 보존</strong>된다\.

```javascript
// 🆚 라우팅 방식 차이 비교

// 1. Next.js App Router (페이지 교체)
// '/home' -> '/detail' 이동 시
CurrentRender = <Detail />; // ❌ Home은 메모리에서 사라짐 (Unmount)

// 2. Stackflow (스택 적층)
// 'HomeActivity' -> 'DetailActivity' 이동 시
StackState = [
  { name: 'HomeActivity', status: 'Inactive' }, // 🟢 살아있음 (DOM 보존)
  { name: 'DetailActivity', status: 'Active' }, // 🔵 현재 보이는 화면
];
```

#### 3\.3\. Activity Lifecycle

React 컴포넌트의 생명주기와 별개로, Stackflow만의 화면 생명주기가 존재한다\.

- ` useActivity() ` 훅을 통해 현재 화면이 ` Active `인지 ` Inactive `인지 감지할 수 있다\.
- 이를 통해 화면이 다시 포커스될 때 데이터를 갱신\(` refetch `\)하거나, 비활성 상태일 때 불필요한 리소스를 정지시키는 등의 최적화가 가능하다\.

```javascript
import { useActivity } from "@stackflow/react";

const MyActivity = () => {
  const { isActive } = useActivity(); // 현재 화면이 활성 상태인지 감지

  useEffect(() => {
    if (isActive) {
      analytics.log("view_screen"); // 🟢 다시 돌아올 때마다 로깅
      refetch(); // 🟢 데이터 최신화
    } else {
      videoPlayer.pause(); // ⚪ 다른 화면으로 덮이면 영상 일시정지
    }
  }, [isActive]);

  return <div>...</div>;
};
```

---

### 4\. Next\.js App Router vs Stackflow 비교


기존의 파일 시스템 기반 라우팅\(App Router\)과 Stackflow 도입 후의 차이점을 비교한다\.

<div class="notion-table-wrap">
<table>
<tbody><tr><td><strong>비교 항목</strong></td><td><strong>Next.js App Router (AS-IS)</strong></td><td><strong>Stackflow (TO-BE)</strong></td></tr><tr><td><strong>라우팅 기준</strong></td><td><strong>URL 경로 중심</strong> (File-system Routing)</td><td><strong>Activity 이름 중심</strong> (Stack-based Routing)</td></tr><tr><td><strong>화면 전환</strong></td><td>페이지 교체 (새로 그리기, 깜빡임 발생)</td><td><strong>페이지 적층</strong> (슬라이드 애니메이션, 부드러움)</td></tr><tr><td><strong>뒤로가기 경험</strong></td><td>스크롤 초기화, 상태 소실 (별도 캐싱 필요)</td><td><strong>이전 상태 완벽 복원</strong> (스크롤/입력값 유지)</td></tr><tr><td><strong>데이터 페칭</strong></td><td><strong>Server Component</strong> (<code>async/await</code>) 중심</td><td><strong>Client Component</strong> (<code>useQuery</code>) 중심</td></tr><tr><td><strong>레이아웃 구조</strong></td><td>중첩 레이아웃 (<code>layout.tsx</code>)</td><td><code>AppScreen</code> 및 래퍼 컴포넌트(<code>MainTabLayout</code>)</td></tr></tbody>
</table>
</div>

<strong>핵심 효용:</strong>
모바일 환경에서 웹사이트가 아닌 ` 앱을 사용하는 듯한 사용자 경험(UX) `을 제공한다\. 특히 목록 상세 조회 후 뒤로가기 패턴에서 사용자 이탈을 방지하고 사용성을 극대화할 수 있다\.

---

### 5\. Migration 전략

App Router 기반 프로젝트를 Stackflow로 전환하기 위한 단계적 전략은 다음과 같다\.

#### Phase 1: 기반 마련 \(Core Setup\)

- ` src/stackflow/stackflow.ts ` 설정 파일을 생성하여 라우팅의 중추를 마련한다\.
- Next\.js의 모든 경로를 가로채기 위해 ` app/[[...stack]]/page.tsx ` \(Catch\-all Route\)를 생성하여 Stackflow 진입점을 구축한다\.

```javascript
// 📄 app/[[...stack]]/page.tsx
"use client";

import { Stack } from "@/src/stackflow/stackflow";

// Next.js의 모든 경로(...)를 이 파일 하나가 받습니다.
export default function StackEntryPage() {
  return (
    // 여기서부터는 Stackflow의 통제하에 들어갑니다.
    <Stack />
  );
}
```

#### Phase 2: 구조 평탄화 \(Flattening\)

- 깊게 중첩된 폴더 구조\(` app/group/mypage/notice/page.tsx `\)를 탈피한다\.
- ` src/activities ` 폴더 내에 도메인별로 Activity를 모아 평면적인 구조로 재배치한다\. \(예: ` src/activities/mypage/NoticeActivity.tsx `\)

#### Phase 3: 컴포넌트 전환 \(Server → Client\)

- Stackflow의 모든 Activity는 브라우저에서 인터랙션 하므로 <strong>Client Component</strong>여야 한다\.
- 기존 ` page.tsx `의 서버 데이터 로직\(` async/await `, DB 직접 접근\)을 API Route\(` app/api/... `\)로 분리하고, Activity 내부에서는 ` React Query ` 등을 통해 데이터를 호출하도록 변경한다\.

```javascript
// ❌ AS-IS: Server Component (삭제 예정)
// app/mypage/page.tsx
export default async function Page() {
  const user = await db.user.find(); // 서버 직접 접근 불가
  return <div>{user.name}</div>;
}

// 🟢 TO-BE: Client Activity (변경 후)
// src/activities/MyPageActivity.tsx
"use client";
import { useQuery } from "@tanstack/react-query";

const MyPageActivity = () => {
  // API를 통해 데이터 호출
  const { data } = useQuery({ queryKey: ["user"], queryFn: fetchUserAPI });
  return <AppScreen>{data?.name}</AppScreen>;
};
```

#### Phase 4: 라우팅 로직 교체

- ` router.push() ` 및 ` <Link> ` 태그를 ` useFlow().push() ` 등의 Stackflow 전용 훅으로 교체하여 스택 네비게이션이 작동하도록 한다\.
- 메인 탭\(Home, Project, MyPage\)과 상세 화면 간의 레이아웃\(BottomBar\) 노출 여부를 ` MainTabLayout ` 컴포넌트로 제어한다\.

```javascript
// 이동(Push) 로직 변경
// ❌ 기존
router.push(`/project/detail/${id}`);

// 🟢 변경 (Type-safe)
const { push } = useFlow();
push("ProjectDetail", { id: "123" }); // 액티비티 이름 + 파라미터 객체

// 뒤로가기(Pop) 로직 변경
// ❌ 기존
router.back();

// 🟢 변경
const { pop } = useFlow();
pop(); // 기본 애니메이션과 함께 스택 제거
```

---
schemaVersion: 2
title: "page.tsx의 use client 선언과 렌더링 메커니즘"
description: "1. 개요: 페이지 컴포넌트와 선언의 의미"
category: "미분류"
categorySlug: "uncategorized"
tags: ["React", "Next.js", "렌더링"]
publishedAt: "2026-02-12T13:33:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 10
---

### 1\. 개요: 페이지 컴포넌트와 선언의 의미

#### 기본 동작 \(Server Component\)

- Next\.js의 ` app ` 디렉토리 내 ` page.tsx `는 기본적으로 **서버 컴포넌트\(RSC\)**로 동작함\.
- 서버에서 렌더링을 마치고 결과물\(HTML \+ RSC Payload\)만 클라이언트로 전송됨\.
- **장점:** 클라이언트가 다운로드해야 할 자바스크립트 번들 크기가 작아 초기 로딩이 빠름\.

#### &\#39;use client&\#39; 선언 \(Client Component\)

- 파일 최상단에 ` &#39;use client&#39; `를 작성하면 해당 파일과 하위 컴포넌트는 **클라이언트 컴포넌트\(RCC\)**로 전환됨\.
- **오해:** &quot;서버 렌더링을 완전히 포기하는 것인가?&quot; \-&gt; **아님\.**
- **실제:** 초기 로딩 시에는 여전히 **서버에서 HTML을 생성\(Pre\-rendering\)**하여 보내줌\.

### 2\. 클라이언트 컴포넌트의 두 가지 렌더링 경로

Next\.js는 ` &#39;use client&#39; `가 선언된 페이지라도 사용자 진입 방식에 따라 최적화된 전략을 사용함\.

#### 2\.1 Full Page Load \(최초 접속 및 새로고침\)

- **상황:** 브라우저 주소창 입력, 새로고침 등\.
- **동작:** 서버에서 **초기 HTML을 미리 생성\(Pre\-rendering\)**하여 전송함\.
- **이유:** 사용자가 빈 화면\(White Screen\)을 보지 않게 하기 위함 \+ SEO 대응\.
- **특징:** 서버 컴포넌트와 유사하게 동작하여 빠른 FCP\(First Contentful Paint\)를 제공\.

#### 2\.2 Subsequent Navigation \(페이지 이동\)

- **상황:** ` Link ` 태그나 ` router.push() `를 통한 클라이언트 라우팅\.
- **동작:** 서버는 HTML을 보내지 않고, **필요한 JSON 데이터\(RSC Payload\)**만 전송함\.
- **이유:** 브라우저에 이미 리액트가 실행 중이므로, 자바스크립트로 화면만 갈아 끼우는 것이 훨씬 효율적임\.

### 3\. 서버 vs 클라이언트: 빌드 데이터의 기술적 차이

영상 분석 결과, ` &#39;use client&#39; ` 선언 유무에 따라 내부 동작 데이터가 달라짐이 확인됨\.

#### 3\.1 서버 컴포넌트 \(Default\)

- **핵심 데이터:** ` Initial Seed Data ` 포함\.
- **역할:** 서버에서 완성된 트리 구조와 데이터를 클라이언트에 전달\.
- **과정:** 하이드레이션 시, 이 데이터를 기준으로 서버 결과물과 클라이언트 결과물을 비교/화해\(Reconcile\)함\.

#### 3\.2 클라이언트 컴포넌트 \(&\#39;use client&\#39;\)

- **핵심 데이터:** ` Initial Seed Data ` 제거됨 \-&gt; ` Client Page Root `** 생성됨\.**
- **역할:** Next\.js 엔진에게 &quot;이 페이지의 렌더링 주도권은 클라이언트에게 있다&quot;고 알리는 표식\.
- **과정:** 서버에서 HTML 뼈대는 받지만, 데이터 초기화 및 로직 실행은 클라이언트\(브라우저\) 런타임에서 주도적으로 수행함\.

### 4\. 예시 코드를 통한 구조 이해

#### \[예시 1\] 서버 컴포넌트 \(page\.tsx\)

데이터 패칭 로직이 서버에서 실행되어 보안과 성능에 유리함\.

```javascript
// app/blog/page.tsx (기본: 서버 컴포넌트)
export default async function BlogPage() {
  // 서버에서 실행되므로 API 키 노출 걱정 없음
  const posts = await db.post.findMany(); 

  return (
    <main>
      <h1>블로그 포스트 (서버 렌더링)</h1>
      {posts.map(post => <article key={post.id}>{post.title}</article>)}
    </main>
  );
}
```

#### \[예시 2\] 클라이언트 컴포넌트 \(&\#39;use client&\#39;\)

브라우저 전용 API나 상태 관리가 필요한 경우 사용\.

```javascript
'use client'; // 이 선언으로 인해 Client Page Root 활성화

import { useState } from 'react';

export default function CounterPage() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <h1>인터랙티브 카운터 (클라이언트 주도)</h1>
      <p>현재 카운트: {count}</p>
      {/* onClick 이벤트는 클라이언트 컴포넌트에서만 동작 */}
      <button onClick={() => setCount(c => c + 1)}>증가</button>
    </main>
  );
}
```

### 5\. 요약 및 결론 \(설계 가이드\)

#### 핵심 요약

- **초기 로딩:** ` &#39;use client&#39; `를 써도 서버에서 HTML을 만들어 보내주므로 초기 속도 저하는 걱정하지 않아도 됨\.
- **데이터 차이:** 내부적으로 사용하는 데이터 포맷\(` Initial Seed Data ` vs ` Client Page Root `\)이 달라지며, 이는 렌더링 주체가 누구인지를 결정함\.

#### 설계 가이드 \(Callout\)

> 💡 &quot;가능하면 서버 컴포넌트를 기본으로 사용하고, 상호작용이 필요한 &\#39;말단 컴포넌트&\#39;에만 &\#39;use client&\#39;를 붙이자\.&quot;

- **이유:** 페이지 전체를 클라이언트 컴포넌트로 만들면 불필요하게 JS 번들 사이즈가 커질 수 있음\.
- **전략:** ` page.tsx `는 서버 컴포넌트로 유지하여 데이터 패칭을 담당하고, 버튼이나 입력 폼 등 동적인 부분만 별도 파일로 분리하여 ` &#39;use client&#39; `를 적용하는 것이 베스트 프랙티스임\.

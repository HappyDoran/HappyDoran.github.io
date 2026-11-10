---
schemaVersion: 2
title: "RSC와 RCC"
description: "Next.js에서 App Router(app 디렉토리) 환경에서, 별도의 선언(상단에 ‘use client’)이 없는 모든 컴포넌트(page.tsx, layout.tsx)들은 기본적으로 RSC(React Server Component)이다."
category: "미분류"
categorySlug: "uncategorized"
tags: []
publishedAt: "2026-02-18T07:25:00.000Z"
updatedAt: "2026-08-29T16:20:00.000Z"
manuscriptPages: 5
---

Next\.js에서 App Router\(app 디렉토리\) 환경에서, 별도의 선언\(상단에 ‘use client’\)이 없는 모든 컴포넌트\(page\.tsx, layout\.tsx\)들은 기본적으로 RSC\(React Server Component\)이다\.


## RSC

```javascript
// app/blog/page.tsx
// ⚠️ 별도의 'use client' 선언이 없으므로 기본적으로 서버 컴포넌트(RSC)입니다.

import { db } from '@/lib/db'; // 데이터베이스 직접 연결 가능
import LikeButton from './like-button'; // 클라이언트 컴포넌트 임포트

export default async function BlogPage() {
  // 1. 서버에서 직접 데이터 패칭 (API 호출 불필요, DB 직접 조회)
  // 이 로직은 브라우저에 노출되지 않으므로 API Key 등 비밀정보 사용 가능
  const posts = await db.post.findMany(); 

  console.log("이 로그는 브라우저 콘솔이 아닌, 서버 터미널에 찍힙니다.");

  return (
    <main>
      <h1>블로그 포스트</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
            
            {/* 2. 인터랙션이 필요한 부분만 클라이언트 컴포넌트로 끼워넣기 */}
            {/* 서버가 데이터를 props로 내려줌 -> 이게 RSC Payload에 직렬화되어 담김 */}
            <LikeButton initialLikes={post.likes} />
          </li>
        ))}
      </ul>
    </main>
  );
}
```

다음과 같이 app/blog/page\.tsx를 서버 컴포넌트로 선언한다\. 이렇게 되면 페이지단에서는 useState, useEffect 등의 훅은 사용이 불가능 하고, 서버단에서 받아온 RSC Payload 만 브라우저로 넘어간다\.

## RCC

```javascript
// app/blog/like-button.tsx
'use client'; // 👈 이 선언이 있어야 브라우저로 JS 코드가 전송됨 (RCC)

import { useState } from 'react';

export default function LikeButton({ initialLikes }: { initialLikes: number }) {
  // 브라우저 메모리에서 상태 관리 (Hook 사용 가능)
  const [likes, setLikes] = useState(initialLikes);

  return (
    <button 
      // onClick 이벤트는 브라우저에서만 동작하므로 클라이언트 컴포넌트 필수
      onClick={() => setLikes(likes + 1)} 
    >
      👍 좋아요 {likes}
    </button>
  );
}
```

다음과 같이 페이지에 들어가는 좋아요 버튼을 RCC\(React Client Component\)로 선언한다\. 이렇게 되면 클라이언트 단에서 상태 관리나 이벤트 처리가 가능해진다\. 

## 매핑

1. **RSC 페이로드 \(3번 항목\):**
   - ` BlogPage `가 실행되면, ` posts ` 데이터와 HTML 구조, 그리고 ` LikeButton `이 들어갈 자리\(Placeholder\) 정보가 **JSON 형태의 RSC Payload**로 변환되어 브라우저로 전송됩니다\.
   - ` LikeButton `의 실제 JS 코드는 별도의 번들\(Reference\)로 전송됩니다\.
1. **Transpiling &amp; Fiber \(1\.2번 항목\):**
   - 서버에서도 ` BlogPage `의 JSX를 해석하기 위해 Babel 등을 거쳐 React Element로 변환하고 렌더링을 수행합니다\.
   - 질문1\. 내가알기론 렌더링 과정은 SSR는 서버에서 클라이언트로 꽉차있는 바이트스트림을 보내서 클라이언트에서 렌더링 작업을 수행하는걸로 아는데 이 작업은 서버에서도 수행한다는 말이 무슨 말인가?
   - 혹시 이 말이 페이로드의 생성에 한정해서 페이로드에 대한 조합을 랜더링이라 통틀어서 얘기하는 것일까?
1. **Hydration \(4\.2번 항목\):**
   - 브라우저는 ` BlogPage `의 HTML을 먼저 보여줍니다\(Preview\)\.
   - 그 후 ` LikeButton `의 JS 코드를 다운로드하여 ` onClick ` 이벤트를 연결합니다\(Hydration\)\.

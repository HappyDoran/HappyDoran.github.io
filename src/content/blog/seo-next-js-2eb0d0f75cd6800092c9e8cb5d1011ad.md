---
schemaVersion: 2
title: "SEO와 Next.js 렌더링 기법"
description: "1. SEO와 Next.js 도입 배경"
category: "미분류"
categorySlug: "uncategorized"
tags: ["Next.js", "렌더링", "성능 최적화"]
publishedAt: "2026-01-17T00:17:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 10
---

### 1\. SEO와 Next\.js 도입 배경

#### **SEO \(Search Engine Optimization\)**

- **정의:** 구글, 네이버 등에서 특정 키워드 검색 시 내 사이트가 상위에 노출되도록 최적화하는 기법\.
- **핵심:** 검색 엔진 봇\(Bot\)이 사이트의 HTML 정보를 잘 읽어갈 수 있어야 함\.

#### **Next\.js 사용 이유**

- **React \(CSR\):** 초기 HTML이 비어있어 검색 엔진이 내용을 읽지 못함 → **SEO 불리**\.
- **Next\.js:** **Pre\-rendering**을 통해 미리 생성된 HTML을 제공 → **SEO 유리**\.
- 이 때문에 대다수 기업에서 React 대신 Next\.js를 도입\.

---

### 2\. 핵심 개념: Pre\-rendering &amp; Hydration

#### **Pre\-rendering \(사전 렌더링\)**

- **CSR 제외\(SSR, SSG, ISR\):** 자바스크립트 로드 전, HTML을 미리 생성해 클라이언트에 전송\.
- JS 로딩 전에도 사용자는 화면\(HTML\)을 볼 수 있음\.

#### **Hydration \(하이드레이션\)**

> 💡 &quot;컴포넌트라는 그릇\(HTML\)에 물\(JS\)을 부어 상태를 활성화하는 과정&quot;

- 서버에서 렌더링 된 **HTML\(정적\)**을 클라이언트의 **React 상태\(JS\)**와 연결하는 과정\.
- 이벤트 핸들러, 인터랙션 기능을 활성화하여 사용자가 조작 가능한 상태로 만듦\.

---

### 3\. Next\.js 렌더링 기법 4가지

#### **1\) CSR \(Client Side Rendering\)**

- **특징:** **No\-Pre\-rendering**\. 렌더링 주체는 **클라이언트\(브라우저\)**\.
- **동작 과정:**
   1. 서버 요청 시 빈 HTML\(` &lt;div id=&quot;root&quot;&gt; `\)과 JS 링크만 반환\.
   1. 빈 화면\(White screen\) 상태에서 JS 다운로드\.
   1. JS 실행 및 Hydration 후 화면 노출\.
- **단점:** 초기 로딩 느림, SEO 불리\.
- **구현 \(Code\):**
   - ` &#39;use client&#39; ` 선언\.
   - ` useEffect `, ` useState ` 사용\.
   - 요청 시마다 데이터 갱신 \(순수 리액트 방식\)\.

#### **2\) SSR \(Server Side Rendering\)**

- **특징:** **사용자 요청 시마다** 서버에서 HTML 생성\.
- **장점:** 실시간 데이터 제공 가능, SEO 유리\.
- **단점:** 서버 부하 증가 \(요청 수만큼 생성\)\.
- **동작 과정:**
   1. 요청 → 서버에서 데이터 패칭 및 HTML 생성\.
   1. 완성된 HTML 응답 \(즉시 보임\)\.
   1. 클라이언트에서 JS 다운로드 및 Hydration\.
- **구현 \(Code\):**
   - 컴포넌트를 ` async function `으로 작성\.
   - **Fetch 옵션:** ` cache: &quot;no-store&quot; ` \(매번 최신 데이터\)\.
   - ` useEffect ` 사용 안 함\.

#### **3\) SSG \(Static Site Generation\)**

- **특징:** **빌드\(Build\) 타임**에 모든 페이지 HTML을 미리 생성\.
- **장점:** 로딩 속도 가장 빠름\(CDN 캐시\), 서버 부하 적음\.
- **단점:** 빌드 이후 데이터 변경 반영 불가 \(실시간성 X\)\.
- **구현 \(Code\):**
   - **Fetch 옵션:** ` force-cache ` \(디폴트 값\)\.
   - 옵션이 없으면 기본적으로 SSG로 동작\.
   - 새로고침 해도 동일한 페이지 출력\.

#### **4\) ISR \(Incremental Static Regeneration\)**

- **특징:** **SSG \+ SSR**\. 정적 페이지를 먼저 보여주고, **설정 주기**마다 서버에서 재생성\.
- **장점:** 빠른 속도\(UX\) \+ 데이터 최신화\(주기적 갱신\)\.
- **구현 \(Code\):**
   - **Fetch 옵션:** ` next: { revalidate: 시간 } `\.
   - 또는 페이지 세그먼트: ` export const revalidate = 시간; ` \(page\.tsx, layout\.tsx\)\.

---

### 4\. 렌더링 테스트 방법

정확한 렌더링 테스트를 위해서는 개발 모드\(` dev `\)가 아닌 빌드 후 실행을 해야 합니다\.

1. **빌드:** ` npm run build ` \(최적화된 프로덕션 빌드 생성\)
1. **실행:** ` npm run start ` \(빌드된 결과물 실행\)
   - *참고: *` npm run dev `*는 개발 모드라 대부분 SSR처럼 동작할 수 있음\.*

**테스트 시 확인 포인트**

<div class="notion-table-wrap">
<table>
<tbody><tr><td><strong>기법</strong></td><td><strong>새로고침 시 동작</strong></td><td><strong>Fetch 옵션</strong></td></tr><tr><td><strong>CSR</strong></td><td>지속적 갱신 (Client)</td><td><code>useEffect</code> / <code>use client</code></td></tr><tr><td><strong>SSR</strong></td><td>지속적 갱신 (Server)</td><td><code>cache: &quot;no-store&quot;</code></td></tr><tr><td><strong>SSG</strong></td><td>내용 안 바뀜 (고정)</td><td><code>force-cache</code> (기본)</td></tr><tr><td><strong>ISR</strong></td><td>설정 시간 지나면 갱신</td><td><code>revalidate: 시간</code></td></tr></tbody>
</table>
</div>

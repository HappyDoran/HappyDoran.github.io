---
schemaVersion: 2
title: "SSR과 CSR 총정리"
description: "1. 공통 과정: 접속 및 데이터 수신 (Network Layer)"
category: "미분류"
categorySlug: "uncategorized"
tags: []
publishedAt: "2026-03-30T11:34:00.000Z"
updatedAt: "2026-08-29T16:20:00.000Z"
manuscriptPages: 9
---

### 1\. 공통 과정: 접속 및 데이터 수신 \(Network Layer\)

어떤 렌더링 방식을 쓰든, 브라우저가 서버에 문을 두드리는 과정은 동일하다\.

- **DNS Lookup:** 사용자가 주소를 입력하면 DNS 서버를 통해 해당 서버의 **IP 주소**를 찾아낸다\. \(한번 찾으면 DNS캐시에 저장해 다음 방문 시 속도를 높인다\.\)
- **요청\(Request\):** 찾아낸 IP 주소로 &quot;HTML 파일을 줘라\.&quot;라고 요청을 보낸다\.
- **응답\(Response\):** 서버는 HTML 데이터를 **바이트 스트림\(0과 1의 나열\)** 형태로 브라우저\(Client\)에게 쏴줍니다\.

---

### 2\. SSR \(서버 사이드 렌더링\): &quot;완성된 설계도&quot;

SSR의 핵심은 **서버가 HTML이라는 텍스트 설계도를 미리 꽉 채워서 보낸다**는 점이다\.

1. **서버의 작업:** 요청이 들어오면 서버\(Next\.js, CDN 등\)는 DB에서 데이터를 가져와 **내용이 다 적힌 HTML 문자열**` (아직 바이트 스트림 상태) `을 만든다\.
1. **데이터 전송:** 내용이 꽉 찬 바이트 스트림을 브라우저에게 보낸다\.` (여기 타이밍에서 서버 → 클라이언트) `
1. **브라우저의 파싱 \(클라이언트 담당\):**
   - **DOM 트리 생성:** 브라우저가 바이트 스트림을 받아 ` h1 `, ` p `, ` div ` 등 이미 적혀 있는 태그들을 읽으며 트리를 만든다\.\(바이트 스트림 → 문자 → 토큰화 → 노드 → 트리\)
   - **CSSOM 트리 생성:** 중간에 링크된 CSS를 가져와 스타일 트리를 만든다\.
   ` → DOM 트리 완성 후에 렌더링은 CSSOM 트리가 완성될 때까지 기다려야 한다. `
1. **렌더링 \(클라이언트 담당\):** \* **Render Tree 결합:** 두 트리를 합친다\. 이때 이미 내용\(텍스트, 이미지 경로 등\)이 다 들어있다\.
   - **Layout &amp; Paint:** 브라우저는 **즉시 글자와 그림이 있는 화면**을 그린다\.
   - **결과:** 사용자는 접속하자마자 완성된 화면을 본다\. \(단, JS가 아직 안 와서 버튼은 안 눌릴 수 있다 = ` Hydration 전 상태 `\)

---

### 3\. CSR \(클라이언트 사이드 렌더링\): &quot;빈 설계도 \+ 도구&quot;

CSR은 서버가 아주 최소한의 정보만 주고, **나머지는 브라우저가 스스로 알아서 하게** 만든다\.

1. **서버의 작업:** 서버\(S3, CDN 등\)는 내용이 텅 빈 HTML\(` &lt;body&gt;&lt;div id=&quot;root&quot;&gt;&lt;/div&gt;&lt;/body&gt; `\)과 **거대한 JS 파일** 링크를 보낸다\.
1. **데이터 전송:** ` 빈 껍데기 HTML 바이트 스트림 `이 먼저 도착한다\.
1. **브라우저의 파싱 및 첫 렌더링:**
   - **빈 화면 그리기:** 브라우저가 HTML을 파싱해 보니 ` div#root ` 말고는 아무것도 없다\. **브라우저는 이 &quot;비어있는 설계도&quot;대로 렌더 트리를 만들고 화면에 하얀색\(White Screen\)을 그린다\.** 즉, **그리기조차 안 하는 게 아니라, 서버가 준 대로 &quot;빈 화면&quot;을 성실하게 그리는거**다\.
1. **JS 실행 및 2차 렌더링:**
   - 이후 도착한 JS를 실행하면, JS가 API에서 데이터를 가져와서 비어있던 ` div#root ` 안에 새로운 태그들을 막 집어넣는다\.
   - 브라우저는 바뀐 DOM을 보고 **화면을 다시 그린다\(Re\-render\)\.** 이때서야 사용자는 내용을 볼 수있다\.

---

<div class="notion-table-wrap">
<table>
<tbody><tr><td><strong>단계</strong></td><td><strong>SSR (Server Side)</strong></td><td><strong>CSR (Client Side)</strong></td></tr><tr><td><strong>HTML 생성 주체</strong></td><td><strong>서버</strong> (내용 포함)</td><td><strong>클라이언트(JS)</strong> (내용 없음)</td></tr><tr><td><strong>파싱 주체</strong></td><td><strong>무조건 클라이언트</strong></td><td><strong>무조건 클라이언트</strong></td></tr><tr><td><strong>첫 Paint 결과</strong></td><td><strong>글자와 그림이 있는 화면</strong></td><td><strong>하얀 화면 (White Screen)</strong></td></tr><tr><td><strong>JS의 역할</strong></td><td>이미 그려진 화면에 기능을 부여 (Hydration)</td><td><strong>화면을 창조</strong>하고 기능을 부여</td></tr></tbody>
</table>
</div>

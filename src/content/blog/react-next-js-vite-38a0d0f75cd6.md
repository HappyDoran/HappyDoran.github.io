---
schemaVersion: 2
title: "React, Next.js, Vite는 라이브러리인가 프레임워크인가"
description: "핵심 한 줄 요약"
category: "미분류"
categorySlug: "uncategorized"
tags: []
publishedAt: "2026-06-25T00:36:00.000Z"
updatedAt: "2026-08-29T16:20:00.000Z"
manuscriptPages: 5
---

### 핵심 한 줄 요약

- **React**: UI를 만드는 **라이브러리**
- **Next\.js**: React 기반의 웹앱을 만드는 **프레임워크**
- **Vite**: 개발 서버 \+ 번들링을 담당하는 **빌드 도구**

---

#### 1\. React = 라이브러리 \(Library\)

- **정의**: 사용자 인터페이스\(UI\)를 만들기 위한 JavaScript 라이브러리
- **왜 라이브러리인가? \(제어권 관점\)**
   - 앱의 전체 구조/흐름을 React가 강제하지 않음
   - **라우팅, 상태관리** 등은 개발자가 원하는 도구를 골라 조합해야 함
      - 예: React Router, Zustand, Redux 등
   - 즉, **개발자가 주도권을 가지고 필요한 기능을 “가져다 쓰는” 형태**

---

#### 2\. Next\.js = 프레임워크 \(Framework\)

- **정의**: React를 기반으로 한 웹 애플리케이션 프레임워크
- **왜 프레임워크인가? \(규칙/틀 제공\)**
   - ` app ` / ` pages ` 폴더 구조 등 **정해진 규칙**을 제공
   - 파일을 만들면 **라우팅이 자동으로 구성**됨
   - SSR\(서버 사이드 렌더링\), 이미지 최적화 등 **내장 기능** 제공
   - 실행 흐름의 주도권이 프레임워크에 있는 형태 → **제어의 역전\(IoC\)**

---

#### 3\. Vite = 빌드 도구 \(Build Tool\)

- **정의**: 빠른 개발 서버 \+ 번들링/트랜스파일을 제공하는 프론트엔드 빌드 도구
- **역할**
   - 브라우저가 바로 이해 못하는 문법을 변환
      - JSX, TypeScript 등
   - 여러 자원\(JS/CSS/이미지\)을 **효율적으로 묶고\(번들링\) 최적화**
   - 전통적으로 Webpack이 담당하던 영역을 더 빠르게 대체하는 경우가 많음

---

#### 비교 표

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">이름</th><th scope="col">분류</th><th scope="col">주된 역할</th><th scope="col">비유</th></tr></thead>
<tbody><tr><td>React</td><td>라이브러리</td><td>UI 컴포넌트 렌더링</td><td>고급 자재(벽돌/시멘트)</td></tr><tr><td>Next.js</td><td>프레임워크</td><td>React 앱의 구조/규칙 + 서버 기능</td><td>조립식 주택 도면(규격/배치 포함)</td></tr><tr><td>Vite</td><td>빌드 도구</td><td>개발 서버 + 번들링/변환</td><td>자재를 가공하는 공장</td></tr></tbody>
</table>
</div>

---

#### 결론: 언제 무엇을 쓰나

- **가볍고 빠른 SPA 개발**: ` React + Vite `
- **SEO/SSR/풀스택 기능이 필요한 웹앱**: ` Next.js `

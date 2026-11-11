---
schemaVersion: 2
title: "DOM과 CSSOM, 웹 페이지 렌더링 과정"
description: "DOM과 CSSOM, 웹 페이지 렌더링 과정"
tags: ["CSS", "JavaScript", "렌더링"]
publishedAt: "2026-01-17T07:23:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 20
---

### 1\. 개요 \(Overview\)

- <strong>목적:</strong> 웹 브라우저 주소창에 URL\(예: ` naver.com `\)을 입력했을 때, 사용자의 눈앞에 웹사이트가 그려지기까지 내부에서 일어나는 일련의 과정을 이해한다\.
- <strong>중요성:</strong> 프론트엔드 개발자 면접의 단골 질문이며, 웹 성능 최적화\(Performance Optimization\)를 위해 필수적인 지식이다\.

### 2\. 웹 브라우저의 구조 \(Browser Structure\)

![](<../../assets/blog/dom-cssom-2eb0d0f75cd6801ca222d17b1d9f801f/image-001.png>)

브라우저는 단순히 화면만 보여주는 것이 아니라, 마치 하나의 운영체제\(OS\)처럼 복잡한 구성 요소를 가진다\.

1. <strong>사용자 인터페이스 \(User Interface\):</strong> 주소 표시줄, 뒤로/앞으로 가기 버튼, 즐겨찾기 등 요청한 페이지 화면을 제외한 모든 부분\.
1. <strong>브라우저 엔진 \(Browser Engine\):</strong> UI와 렌더링 엔진 사이의 동작을 제어\(가교 역할\)\.
1. <strong>렌더링 엔진 \(Rendering Engine\):</strong> 요청한 콘텐츠\(HTML, CSS\)를 파싱하여 화면에 표시\(그리기\)하는 핵심 엔진\. \(크롬/사파리의 WebKit, 블링크 등\)
1. <strong>통신 \(Networking\):</strong> HTTP 요청과 같은 네트워크 호출을 담당\.
1. <strong>자바스크립트 해석기 \(JS Interpreter\):</strong> 자바스크립트 코드를 해석하고 실행\. \(예: Chrome의 V8 엔진\)
1. <strong>UI 백엔드 \(UI Backend\):</strong> 콤보 박스, 창 같은 기본적인 위젯을 그림\.
1. <strong>자료 저장소 \(Data Persistence\):</strong> 쿠키\(Cookie\), 로컬 스토리지\(Local Storage\), 세션 스토리지 등 브라우저가 데이터를 로컬에 저장하는 영역\.

---

### 3\. 초기 접속 및 데이터 수신 과정

#### 3\.1 IP 주소 획득 \(DNS Lookup\)

- 사용자가 ` naver.com `을 입력하면 브라우저는 이를 바로 이해하지 못한다\. 컴퓨터는 <strong>IP 주소</strong>만 이해할 수 있다\.
- <strong>DNS \(Domain Name System\):</strong> 도메인 이름\(` naver.com `\)을 IP 주소로 변환해주는 전화번호부 같은 시스템\.
- 브라우저는 DNS 서버를 통해 해당 도메인의 IP 주소를 찾아내고, 이 정보를 <strong>DNS 캐시</strong>에 저장하여 재방문 시 속도를 높인다\.

#### 3\.2 서버 요청 및 응답 \(Request &amp; Response\)

- 획득한 IP 주소로 서버에 접속하여 HTML 파일을 요청한다\.
- 서버는 HTML 파일을 <strong>0과 1로 이루어진 바이트 스트림\(Byte Stream\)</strong> 형태로 응답한다\.

---

### 4\. 렌더링 엔진의 동작 과정 \(Critical Rendering Path\)

브라우저가 화면을 그리는 과정은 <strong>파싱\(Parsing\) → 스타일\(Style\) → 레이아웃\(Layout\) → 페인트\(Paint\) → 합성\(Composite\)</strong> 순서로 진행된다\.

#### 4\.1 DOM 트리 생성 \(HTML Parsing\)

서버로부터 받은 바이트 형태의 HTML을 브라우저가 이해할 수 있는 트리 구조로 변환하는 과정이다\.

1. <strong>바이트\(Bytes\) → 문자\(Characters\):</strong> ` UTF-8 ` 등의 인코딩 방식에 따라 바이트 스트림을 문자로 변환 \(예: ` <html>... `\)\.
1. <strong>토큰화\(Tokenization\):</strong> 문자를 W3C 표준에 지정된 고유한 &\#39;토큰&\#39;으로 분해 \(예: ` StartTag: html `, ` StartTag: body `\)\.
1. <strong>노드\(Nodes\):</strong> 토큰을 해당 속성과 규칙을 가진 &\#39;객체\(Object\)&\#39;로 변환\.
1. <strong>DOM 트리\(DOM Tree\):</strong> 생성된 노드들 간의 부모\-자식 관계를 설정하여 트리 구조로 연결\. 이를 <strong>DOM\(Document Object Model\)</strong>이라 한다\.

![](<../../assets/blog/dom-cssom-2eb0d0f75cd6801ca222d17b1d9f801f/image-002.png>)

#### 4\.2 CSSOM 트리 생성 \(CSS Parsing\)

HTML을 파싱하다가 ` <link> ` 태그나 ` <style> ` 태그를 만나면 CSS 파싱을 시작한다\.

- HTML과 동일하게 <strong>바이트 → 문자 → 토큰 → 노드 → CSSOM 트리</strong> 과정을 거친다\.
- <strong>CSSOM \(CSS Object Model\):</strong> 각 노드가 어떤 스타일을 지녀야 하는지에 대한 정보를 담은 트리 구조\. 부모의 스타일이 자식에게 상속되는 구조\(Cascading\)를 반영한다\.

→ DOM은 CSSOM의 완성을 기다리기 때문에 css 파일은 HTML 위에 위치한다\.

#### 4\.3 자바스크립트 실행 \(Script Execution\)

- <strong>파서 차단\(Parser Blocking\):</strong> HTML 파서는 ` <script> ` 태그를 만나는 순간 <strong>DOM 생성을 즉시 중단</strong>하고 제어 권한을 자바스크립트 엔진에 넘긴다\. → Script 코드가 뒤쪽에 있는 이유
- <strong>이유:</strong> 자바스크립트는 ` document.write() ` 등으로 DOM 구조를 동적으로 변경할 수 있기 때문이다\.
- <strong>문제점:</strong> JS 파일이 크거나 다운로드가 느리면 화면이 늦게 뜨는 현상 발생\.
- <strong>해결책:</strong>
   - ` <script> ` 태그를 ` <body> ` 태그 최하단에 위치시킴\.
   - ` defer ` 속성: HTML 파싱과 병렬로 다운로드하되, 실행은 HTML 파싱 완료 후 진행\.
   - ` async ` 속성: 다운로드가 완료되는 즉시 실행 \(실행 시에는 파싱 중단\)\.

질문3\. 해당 작업은 서버사이드랜더링의 경우 어디에서 실행이 되는가?

#### 4\.4 렌더 트리 \(Render Tree\) 생성

- <strong>DOM \+ CSSOM = Render Tree</strong>
- DOM 트리의 모든 노드를 순회하며, CSSOM에서 해당 노드에 적용될 스타일 규칙을 찾아 결합한다\.
- <strong>중요 특징:</strong> 화면에 <strong>실제로 보여지는 요소</strong>만 렌더 트리에 포함된다\.
   - ` <head> `, ` <meta> ` 등은 제외\.
   - CSS 속성 중 ` display: none; `이 적용된 요소는 <strong>렌더 트리에서 완전히 제외</strong>된다\. \(공간도 차지하지 않음\)
   - <em>참고: </em>` visibility: hidden; `<em>은 보이지는 않지만 공간은 차지하므로 렌더 트리에 포함됨\.</em>

#### 4\.5 레이아웃 \(Layout / Reflow\)

- 렌더 트리의 각 노드가 화면의 <strong>어느 위치</strong>에, <strong>어떤 크기</strong>로 배치되어야 하는지 계산하는 단계\.
- 퍼센트\(%\) 단위와 같은 상대적인 측정값을 뷰포트\(Viewport\) 기준의 절대적인 픽셀\(px\) 단위로 변환한다\.

#### 4\.6 페인트 \(Paint\)

- 레이아웃 단계에서 계산된 정보를 바탕으로 각 노드를 실제 픽셀로 변환하여 화면에 그리는 단계\.
- 텍스트, 색상, 이미지, 그림자 효과 등을 처리한다\.
- 브라우저는 효율을 위해 여러 개의 <strong>레이어\(Layer\)</strong>로 나누어 그리는 경우가 많다\.

#### 4\.7 합성 \(Composite\)

- 여러 레이어로 나누어 그려진 페인트 결과물들을 차곡차곡 합쳐서 최종적으로 사용자에게 보여주는 단계\.

---

### 5\. 성능 최적화: 리플로우\(Reflow\)와 리페인트\(Repaint\)

웹 성능 최적화의 핵심은 렌더링 과정을 최소화하는 것이다\.

#### 5\.1 리플로우 \(Reflow\)

- <strong>정의:</strong> 레이아웃\(너비, 높이, 위치 등\)이 변경되어 렌더 트리를 다시 계산하는 과정\.
- <strong>발생 조건:</strong> 창 크기 조절\(Resize\), 노드 추가/삭제, ` width `, ` height `, ` margin `, ` padding `, ` font-size ` 변경 등\.
- <strong>비용:</strong> 전체 픽셀을 다시 계산해야 하므로 <strong>매우 비싸고 느린 작업</strong>\. 성능 저하의 주범\.

#### 5\.2 리페인트 \(Repaint\)

- <strong>정의:</strong> 레이아웃\(위치, 크기\)에는 영향을 주지 않고, 스타일\(색상 등\)만 변경될 때 발생\.
- <strong>발생 조건:</strong> ` color `, ` background-color `, ` visibility ` 변경 등\.
- <strong>비용:</strong> 리플로우보다는 빠르지만 여전히 비용이 든다\.

#### 5\.3 최적화 전략 \(Optimization Tips\)

1. <strong>리소스 사이즈 줄이기:</strong> 불필요한 주석, 공백 제거, 코드 난독화, 이미지 압축\.
1. <strong>HTTP 요청 수 줄이기:</strong> CSS/JS 파일 병합, 필요한 리소스만 로드\.
1. <strong>리플로우 &amp; 리페인트 피하기:</strong>
   - 위치 이동 시 ` top `, ` left ` 대신 ` transform `, ` opacity ` 속성 사용 권장\.
   - ` transform `과 ` opacity `는 GPU 가속을 사용하며, 레이아웃 단계를 건너뛰고 합성\(Composite\) 단계만 수행하므로 성능이 매우 좋다\.
1. <strong>CSS 선택자 최적화:</strong> 복잡한 선택자 사용을 지양하여 CSSOM 생성 속도 향상\.

---

### 6\.  의문점

> 💡 <strong>CSSOM과 자바스크립트 파일은 HTML을 파싱해서, 즉 HTML을 읽다가 호출해서 만들어진다\.</strong>
> <strong>그렇다는건 이미 HTML이 만들어져 있는 상태였다는걸 의미하는건가? </strong>
> 
> [브라우저 렌더링: HTML 파싱과 자원 호출의 메커니즘](<https://app.notion.com/p/3170d0f75cd680af9baedb7705ee851a>)

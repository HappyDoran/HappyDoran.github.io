---
schemaVersion: 2
title: "React 모바일 화면에 Stackflow를 도입할 때의 설계와 전환 전략"
description: "목록에서 상세 화면을 열고 돌아왔을 때 스크롤과 입력 상태를 유지하려면 화면 수명과 이동 모델을 함께 설계해야 한다. Stackflow는 React 화면을 Activity 스택으로 관리해 모바일에 가까운 전환을 구성하는 선택지다."
tags: ["React", "아키텍처", "상태 관리"]
publishedAt: "2026-01-10T09:25:00.000Z"
updatedAt: "2026-11-12T03:48:00.000Z"
manuscriptPages: 12
---

목록에서 상세 화면을 열고 돌아왔을 때 스크롤과 입력 상태를 유지하려면 화면 수명과 이동 모델을 함께 설계해야 한다\. Stackflow는 React 화면을 Activity 스택으로 관리해 모바일에 가까운 전환을 구성하는 선택지다\.

이 글에서는 페이지 교체 중심의 구성을 Activity 적층 구조로 옮기는 과정을 다룬다\. 라우터별 상태 보존은 설정과 화면 구조에 따라 달라지므로, 특정 라우터가 항상 상태를 잃거나 복귀 시간이 0이라고 가정하지 않는다\.

### Core와 플러그인

Stackflow Core는 스택 상태를 관리하고 렌더링과 URL 동기화는 플러그인에 맡긴다\.

```typescript
import { stackflow } from '@stackflow/react';

export const { Stack, useFlow } = stackflow({
  plugins: [
    basicRendererPlugin(),
    historySyncPlugin({
      routes: {
        HomeActivity: '/',
        DetailActivity: '/detail/:id',
      },
    }),
  ],
});
```

위 코드는 역할 분리를 보여주는 설정 발췌다\. Renderer는 상태에 따라 DOM과 CSS transform 전환을 구성하고, history sync는 스택과 브라우저 History API를 연결한다\. 새로고침과 뒤로 가기를 지원하려면 Activity 이름뿐 아니라 URL 복원 규칙도 필요하다\.

### DOM 보존과 Activity 수명

페이지 교체 시 이전 화면을 unmount하는 구성과, 이전 화면을 비활성 상태로 남기는 스택 구성을 비교할 수 있다\.

```text
페이지 교체 모델:
Detail 화면 렌더링, 이전 화면의 수명 종료

스택 모델:
HomeActivity: Inactive
DetailActivity: Active
```

이전 DOM을 유지하면 스크롤과 입력 상태를 보존하기 쉬워진다\. 대신 React mount 여부만으로 화면이 사용 중인지 판단할 수 없다\.

Activity 상태에 따라 복귀 시 refetch를 실행하거나 비활성 화면의 영상 재생 같은 작업을 멈춘다\.

```typescript
const MyActivity = () => {
  const { isActive } = useActivity();

  useEffect(() => {
    if (isActive) {
      analytics.log('view_screen');
      refetch();
    } else {
      videoPlayer.pause();
    }
  }, [isActive]);

  return <div />;
};
```

컴포넌트가 남아 있다는 사실과 사용자가 보고 있다는 사실을 구분하는 것이 메모리·리소스 관리의 핵심이다\.

### App Router와의 역할 비교

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">항목</th><th scope="col">URL·파일 경로 중심 구성</th><th scope="col">Activity 스택 구성</th></tr></thead>
<tbody><tr><td>이동 기준</td><td>URL 경로</td><td>Activity 이름과 params</td></tr><tr><td>화면 수명</td><td>경로·레이아웃 구조에 따라 결정</td><td>스택에 남은 화면을 비활성으로 보존</td></tr><tr><td>뒤로 가기</td><td>상태 보존·복원 방식을 별도 확인</td><td>스택에 보존된 화면으로 복귀</td></tr><tr><td>데이터 접근</td><td>서버 컴포넌트 경계 활용</td><td>클라이언트 Activity의 query 활용</td></tr><tr><td>레이아웃</td><td>중첩 layout</td><td>공통 screen·탭 wrapper</td></tr></tbody>
</table>
</div>

Stackflow 도입은 애니메이션 추가에 그치지 않는다\. 서버 데이터 접근, 화면 보존, URL 복원, 탭 레이아웃을 함께 바꾸는 작업이다\.

### 전환 1: 진입점과 URL 복원

Stackflow 설정을 두고 catch\-all 페이지를 클라이언트 진입점으로 사용할 수 있다\.

```typescript
'use client';

import { Stack } from '@/navigation/stack';

export default function StackEntryPage() {
  return <Stack />;
}
```

예시 배치는 app/\[\[\.\.\.stack\]\]/page\.tsx다\. 이 구조를 선택한다면 서버 페이지로 남길 경로와 catch\-all의 책임을 명확히 한다\. 스택 진입점 하나만 만든다고 모든 직접 접근 이력이 자동으로 원하는 형태가 되지는 않는다\.

### 전환 2: 화면 배치

중첩 page 파일에 있던 화면을 Activity로 옮기고 기능별로 모은다\. 예를 들어 activities/account/NoticeActivity\.tsx처럼 배치할 수 있다\.

파일 이동과 함께 데이터 접근 경계를 확인한다\. 클라이언트에서 실행할 Activity가 서버 전용 접근을 직접 포함하지 않게 한다\.

### 전환 3: 서버 데이터와 클라이언트 화면 분리

서버에서 데이터를 직접 읽던 코드는 API route 경계로 옮기고 Activity에서는 query로 호출한다\.

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

const AccountActivity = () => {
  const { data } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUserAPI,
  });

  return <AppScreen>{data?.name}</AppScreen>;
};
```

서버 로직을 클라이언트로 복사하는 대신 API 경계를 만든다는 점이 중요하다\. 화면을 클라이언트로 전환할 때 인증·데이터 접근 방식도 함께 점검한다\.

### 전환 4: 이동과 공통 레이아웃

URL을 조립하던 이동을 Activity 이름과 params로 바꾼다\.

```typescript
const { push, pop } = useFlow();

push('DetailActivity', { id: 'example-id' });
pop();
```

params 타입을 Activity 계약으로 정의하면 잘못된 화면 이름과 인자를 줄일 수 있다\. 메인 탭과 상세 화면의 BottomBar 노출은 공통 탭 layout에서 제어한다\.

일반 Link, router\.push, router\.back과 스택 action이 섞이면 어떤 계층이 화면 이력을 소유하는지 모호해진다\. 화면별 이동 책임을 정하고 같은 흐름에서 일관되게 사용한다\.

### 주의할 점

- DOM 보존을 무조건적인 성능 향상으로 해석하지 않는다\.
- Activity 비활성 상태에서도 살아 있는 작업을 확인한다\.
- 직접 접근·새로고침·브라우저 뒤로 가기의 복원 경로를 점검한다\.
- 서버 컴포넌트 전용 로직을 Activity에 남기지 않는다\.
- 앱처럼 보이는 전환과 URL·인증·데이터 계약을 함께 검토한다\.

### 정리

Stackflow는 화면을 상태 기반 스택으로 관리하는 선택지다\. 도입 판단은 전환 애니메이션뿐 아니라 보존할 화면 상태, 비활성 리소스, URL 복원, 데이터 경계를 기준으로 해야 한다\.

### 관련 글

- StackFlow 화면 스택과 내비게이션 설계
- WebView의 커스텀 swipe\-back과 전환 경합 처리
- StackFlow 공통 내비게이션 로직의 패키지 분리 설계

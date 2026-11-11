---
schemaVersion: 2
title: "Flexbox"
description: "container 속성"
category: "미분류"
categorySlug: "uncategorized"
tags: ["CSS", "렌더링"]
publishedAt: "2025-06-08T11:09:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 3
---

## container 속성

### display: flex;

```css
.container {
  background: beige;
  height:100vh;
  display: flex;
}

.item {
  width: 40px;
  height: 40px;
  border: 1px solid red;
}
```

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-001.png>)

다음과 같이 가로로 배치\.

### justify\-content:

가로 정렬

#### flex\-start

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-002.png>)

디폴트 왼쪽 정렬

#### center

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-003.png>)

#### flex\-end

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-004.png>)

#### space\-around

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-005.png>)

#### space\-between

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-006.png>)

### align\-items:

세로 정렬

#### flex\-start

디폴트 위쪽 정렬

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-007.png>)

#### center

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-008.png>)

#### flex\-end

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-009.png>)

### align\-content

align\-items보다 더 상위\. 여러줄들 사이의 간격

#### flex\-start

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-010.png>)

#### center

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-011.png>)

#### flex\-end

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-012.png>)

### flex\-direction

배치를 어디부터 할지 결정

#### row\(\-reverse\)

가로로 왼쪽부터 배치, 오른쪽부터 배치

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-013.png>)

#### column\(\-reverse\)

세로로 위에서부터 배치, 밑에서부터 배치

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-014.png>)

### flex\-wrap:

요소의 넓이가 부모의 넓이보다 크면 줄바꿈

#### nowrap

디폴트

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-015.png>)

#### wrap

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-016.png>)

### flex\-flow

flex\-direction과 flex\-wrap을 같이 사용하기

![다음은 row\-reverse wrap을 적용한 예시](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-017.png>)

## item 속성

### order:

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-018.png>)

### align\-self:

#### flex\-start

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-019.png>)

#### center

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-020.png>)

#### flex\-end

![](<../../assets/blog/flexbox-20c0d0f75cd68085906fefbad72e868c/image-021.png>)

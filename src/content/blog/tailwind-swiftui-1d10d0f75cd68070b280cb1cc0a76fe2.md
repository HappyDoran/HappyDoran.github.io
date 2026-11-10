---
schemaVersion: 2
title: "Tailwind에서 SwiftUI의 레이아웃 방식"
description: "Tailwind CSS에서 SwiftUI의 VStack과 HStack과 같은 레이아웃 구조를 구현하려면 Flexbox 속성을 활용하면 된다."
category: "미분류"
categorySlug: "uncategorized"
tags: ["CSS", "SwiftUI"]
publishedAt: "2025-04-10T05:01:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 3
---

Tailwind CSS에서 SwiftUI의 VStack과 HStack과 같은 레이아웃 구조를 구현하려면 ` Flexbox ` 속성을 활용하면 된다\. 

### 스택 속성

#### VStack \(세로 방향 스택\)

```javascript
<div className="flex flex-col">
  <div>아이템 1</div>
  <div>아이템 2</div>
  <div>아이템 3</div>
</div>
```

#### HStack \(가로 방향 스택\)

```javascript
<div className="flex flex-row">
  <div>아이템 1</div>
  <div>아이템 2</div>
  <div>아이템 3</div>
</div>
```

### 정렬 속성

#### 주축 정렬 \(SwiftUI의 alignment\) \- HStack에서 자주 사용되는 정렬

```javascript
// 시작 정렬 (leading)
<div className="flex justify-start">...</div>

// 중앙 정렬 (center)
<div className="flex justify-center">...</div>

// 끝 정렬 (trailing)
<div className="flex justify-end">...</div>

// 균등 분배 (SwiftUI의 equalSpacing과 유사)
<div className="flex justify-between">...</div>

// 요소 사이 공간 균등 분배
<div className="flex justify-evenly">...</div>
```

#### 교차축 정렬 \(SwiftUI의 alignment\) \- VStack에서 자주 사용되는 정렬

```javascript
// 상단 정렬 (top)
<div className="flex items-start">...</div>

// 중앙 정렬 (center)
<div className="flex items-center">...</div>

// 하단 정렬 (bottom)
<div className="flex items-end">...</div>

// 늘리기 (stretch)
<div className="flex items-stretch">...</div>
```

### 간격 설정 \(SwiftUI의 spacing\)

```javascript
// 가로 방향 간격
<div className="flex flex-row space-x-4">...</div>

// 세로 방향 간격
<div className="flex flex-col space-y-4">...</div>
```

### 실용적인 예제

#### VStack과 유사한 레이아웃

```javascript
<div className="flex flex-col space-y-4 items-center">
  <div className="bg-blue-200 p-4 w-32 text-center">아이템 1</div>
  <div className="bg-green-200 p-4 w-40 text-center">아이템 2</div>
  <div className="bg-red-200 p-4 w-36 text-center">아이템 3</div>
</div>

```

#### HStack과 유사한 레이아웃

```javascript
<div className="flex flex-row space-x-4 items-center">
  <div className="bg-blue-200 p-4">아이템 1</div>
  <div className="bg-green-200 p-4">아이템 2</div>
  <div className="bg-red-200 p-4">아이템 3</div>
</div>

```

#### ZStack과 유사한 중첩 레이아웃

```javascript
<div className="relative h-40 w-40">
  <div className="absolute inset-0 bg-blue-200"></div>
  <div className="absolute inset-4 bg-green-200"></div>
  <div className="absolute inset-8 bg-red-200 flex items-center justify-center">
    <span>내용</span>
  </div>
</div>

```

### 커스텀 컴포넌트 만들기

만약 자주 사용한다면, SwiftUI 스타일의 레이아웃 컴포넌트를 만들어 사용할 수도 있다\.

```javascript
// components/VStack.jsx
export const VStack = ({ children, spacing = 4, align = "center", className = "" }) => {
  const alignMap = {
    leading: "items-start",
    center: "items-center",
    trailing: "items-end",
    stretch: "items-stretch"
  };

  return (
    <div className={`flex flex-col space-y-${spacing} ${alignMap[align]} ${className}`}>
      {children}
    </div>
  );
};

// components/HStack.jsx
export const HStack = ({ children, spacing = 4, align = "center", className = "" }) => {
  const alignMap = {
    top: "items-start",
    center: "items-center",
    bottom: "items-end",
    stretch: "items-stretch"
  };

  return (
    <div className={`flex flex-row space-x-${spacing} ${alignMap[align]} ${className}`}>
      {children}
    </div>
  );
};

```

이렇게 만든 컴포넌트는 다음과 같이 사용할 수 있다\.

```javascript
<VStack spacing={6} align="leading">
  <div>아이템 1</div>
  <div>아이템 2</div>
  <div>아이템 3</div>
</VStack>

<HStack spacing={8} align="center">
  <div>아이템 1</div>
  <div>아이템 2</div>
  <div>아이템 3</div>
</HStack>

```

이렇게 하면 SwiftUI와 비슷한 스타일로 Tailwind CSS를 활용할 수 있다\.

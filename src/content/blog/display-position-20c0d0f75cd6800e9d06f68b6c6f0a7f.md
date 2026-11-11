---
schemaVersion: 2
title: "Display와 Position"
description: "다음과 같이 작성할 경우, 배치는 다음과 같다."
tags: ["CSS", "렌더링"]
publishedAt: "2025-06-08T06:40:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 3
---

## Display

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <!-- block level -->
    <div class="hello">1</div>
    <div class="hello">2</div>
    <div class="hello">3</div>

    <!-- inline level -->
    <span>1</span>
    <span>2</span>
    <span>3</span>
  </body>
</html>

```

```css
div,
span {
  width: 80px;
  height: 80px;
  margin: 10px;
}

.hello {
  border: 1px solid red;
  display: block;
}

span {
  border: 1px solid blue;
  display: inline-block;
}
```

다음과 같이 작성할 경우, 배치는 다음과 같다\.

![](<../../assets/blog/display-position-20c0d0f75cd6800e9d06f68b6c6f0a7f/image-001.png>)

### Display 요약

#### inline

안의 콘텐츠\(안의 콘텐츠의 크기에 맞춰 변경되고 가로로 배치\)

#### inline\-block

상자가 가로로 배치\(안의 콘텐츠 크기는 상관이 없이 배치됨\)

#### block

상자가 한줄당 하나\(세로로 배치\)

### 결론 

<strong>block</strong>은 안의 콘텐츠와는 상관 없이 지정된 사이즈에 맞춰서 배치된다\. 
<strong>inline</strong>레벨의 경우 콘텐츠의 크기에 따라서 다이나믹하게 사이즈가 바뀐다\.

## position

```css
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <article class="container">
      <div></div>
      <div class="box">box</div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </artickle>
  </body>
</html>

```

```css
div {
  width: 50px;
  height: 50px;
  margin-bottom: 20px;
  background: red;
}

.container {
  background: yellow;
  left: 20px;
  top: 20px;
  position: relative;
}

.box {
  background: blue;
  position: relative;
  left: 10px;
  top: 10px;
}
```

다음과 같이 작성할 경우, 배치는 다음과 같다\.

![](<../../assets/blog/display-position-20c0d0f75cd6800e9d06f68b6c6f0a7f/image-002.png>)

### position 요약

#### relative

현재 위치를 기준으로 포지셔닝

#### absolute

가장 가까이 있는 상위 컴포넌트를 기준으로 포지셔닝

#### fixed

완전히 벗어나서 윈도우 기준으로 포지셔닝

#### sticky

현재 위치를 기준을 포지셔닝하고 스크롤해도 여전히 유지

---
schemaVersion: 2
title: "Any, AnyObject, nil"
description: "swift의 모든 타입을 지칭하는 키워드"
tags: ["Swift", "언어 기초"]
publishedAt: "2024-08-27T07:31:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 1
---

#### Any

swift의 모든 타입을 지칭하는 키워드

→ 어떤 데이터 타입도 가능하지만 nil 할당은 불가능

```swift
var someAny : Any = 100
someAny = 123.12
someAny = "welcome"
```

#### AnyObject 

모든 클래스 타입을 지칭하는 프로토콜

→ 어떤 클래스 타입도 가능하지만 nil 할당은 불가능

```swift
class SomeClass {}

var someAnyObject : AnyObject = SomeClass()
```

#### nil

없음을 의미하는 키워드

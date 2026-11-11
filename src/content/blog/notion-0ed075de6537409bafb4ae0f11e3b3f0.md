---
schemaVersion: 2
title: "클로저"
description: "코드의 블록, 함수는 클로저의 일종이다."
tags: ["Swift", "언어 기초"]
publishedAt: "2024-08-27T07:31:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 1
---

코드의 블록, 함수는 클로저의 일종이다\.

#### 기본 클로저 문법

```swift
{ (매개변수 목록) -> 반환타입 in
    실행 코드
}
```

#### 클로저의 사용

```swift
// sum이라는 상수에 클로저를 할당
let sum: (Int, Int) -> Int = { (a: Int, b: Int) in
    return a + b
}
let sumResult: Int = sum(1, 2)
print(sumResult) // 3
```

#### 함수의 파라미터로서의 역할을 하는 클로저

```swift
//상수에 클로저 할당
let add: (Int, Int) -> Int
add = { (a: Int, b: Int) in
    return a + b
}
let substract: (Int, Int) -> Int
substract = { (a: Int, b: Int) in
    return a - b
}
let divide: (Int, Int) -> Int
divide = { (a: Int, b: Int) in
    return a / b
}

//함수의 파라미터에 method파라미터에 클로저 할당
func calculate(a: Int, b: Int, method: (Int, Int) -> Int) -> Int {
    return method(a, b)
}
var calculated: Int

calculated = calculate(a: 50, b: 10, method: add)
print(calculated) // 60

calculated = calculate(a: 50, b: 10, method: substract)
print(calculated) // 40

calculated = calculate(a: 50, b: 10, method: divide)
print(calculated) // 5

//따로 클로저를 상수/변수에 넣어 전달하지 않고,
//함수를 호출할 때 클로저를 작성하여 전달할 수도 있습니다.
calculated = calculate(a: 50, b: 10, method: { (left: Int, right: Int) -> Int in
    return left * right
})
print(calculated) // 500
```

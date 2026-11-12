---
schemaVersion: 2
title: "assert와 guard"
description: "애플리케이션이 동작 도중에 생성하는 다양한 연산 결과값을 동적으로 활동하고 안전하게 처리할 수 있도록 확인하고 빠르게 처리 가능"
tags: ["Swift", "언어 기초"]
publishedAt: "2024-08-27T07:31:00.000Z"
updatedAt: "2026-11-12T04:17:00.000Z"
manuscriptPages: 2
---

애플리케이션이 동작 도중에 생성하는 다양한 연산 결과값을 동적으로 활동하고 안전하게 처리할 수 있도록 확인하고 빠르게 처리 가능

#### Assert

디버깅 모드에서만 동작, 디버깅 중에 조건을 검증하기 위해서 사용

```swift
var someInt: Int = 0
// 검증 조건에 부합하므로 지나갑니다
assert(someInt == 0, "someInt != 0")
someInt = 1
//assert(someInt == 0) // 동작 중지, 검증 실패
//assert(someInt == 0, "someInt != 0") // 동작 중지, 검증 실패
// assertion failed: someInt != 0: file guard_assert.swift, line 26
func functionWithAssert(age: Int?) {
    assert(age != nil, "age == nil")
    assert((age! >= 0) && (age! <= 130), "나이값 입력이 잘못되었습니다")
    print("당신의 나이는 \(age!)세입니다")
}
functionWithAssert(age: 50)
//functionWithAssert(age: -1) // 동작 중지, 검증 실패
//functionWithAssert(age: nil) // 동작 중지, 검증 실패
```

#### guard \(빠른 종료\)

잘못된 값의 전달 시 특정 실행구문을 빠르게 종료\.

guard의 else블럭 내부에는 특정 코드 블록을 종료하는 지시어\(return,break 등\)가 꼭 있어야 함\.

```swift
func functionWithGuard(age: Int?) {
    guard let unwrappedAge = age,
        unwrappedAge < 130,
        unwrappedAge >= 0 else {
        print("나이값 입력이 잘못되었습니다")
        return
    }
    print("당신의 나이는 \(unwrappedAge)세입니다")
}
var count = 1
while true {
    guard count < 3 else {
        break
    }
    print(count)
    count += 1
}
// 1
// 2
func someFunction(info: [String: Any]) {
    guard let name = info["name"] as? String else {
        return
    }
    guard let age = info["age"] as? Int, age >= 0 else {
        return
    }
    print("\(name): \(age)")
}
someFunction(info: ["name": "jenny", "age": "10"])
someFunction(info: ["name": "mike"])
someFunction(info: ["name": "alex", "age": 10]) // alex: 10
```

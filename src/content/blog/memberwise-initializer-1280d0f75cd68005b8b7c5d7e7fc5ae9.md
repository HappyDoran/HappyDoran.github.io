---
schemaVersion: 2
title: "Memberwise Initializer의 접근 지정자"
description: "Memberwise Initializer의 접근 지정자"
tags: ["Swift", "언어 기초"]
publishedAt: "2024-10-23T15:39:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
---

```swift
import Foundation


/// 클래스에서 기본 생성자가 제공되는 경우
///
/// 값이 들어있거나, 옵셔널이면 기본 생성자가 제공된다.
/// 하나라도 초기값을 지니지 않는다면 기본 생성자는 제공되지 않고 init을 선언해줘야 한다.
class C1 {
    let x: Int = 1
    let y: Int = 2
    let z: Int? = nil
}

/// 클래스에서 기본 생성자가 제공되지 않는 경우
class C2 {
    let x: Int = 1
    let y: Int = 2
    let z: Int?
    
    init() {
        z = nil
    }
}

/// 클래스에서 기본 생성자가 제공되지 않는 경우
class C3 {
    let x: Int
    let y: Int
    let z: Int
    
    init(x: Int, y: Int, z: Int) {
        self.x = x
        self.y = y
        self.z = z
    }
}

/// 구조체에서 기본 생성자가 제공되는 경우
///
/// 값이 들어있거나, 옵셔널이면 기본 생성자가 제공된다.
/// 하나라도 초기값을 지니지 않는다면 기본 생성자는 제공되지 않고 init을 선언해줘야 한다.
/// 구조체는 멤버와이즈 생성자가 제공된다.
struct A {
    var x: Int
    var y: Int
    var z: Int
}

///멤버와이즈 생성자
var a: A = A(x: 1, y: 2, z: 3)


struct B {
    var x: Int
    var y: Int
    private var z: Int
}

/// 구조체 안의 프로퍼티가 하나라도 private가 된다면 그 멤버와이즈 생성자도 private가 된다.
//var b: B = B(x: 1, y: 2, z: 3) // z가 private이기 때문에 밖에서 사용이 불가능 하다.

struct C {
    var x: Int
    var y: Int
    private var z: Int
    
    func foo() {
        let st = C(x: 1, y: 2, z: 3)
    }
}


/// 생성자를 명시해서 쓰면 된다.
struct D {
    var x: Int
    var y: Int
    private var z: Int
    
    init(x: Int, y: Int, z: Int) {
        self.x = x
        self.y = y
        self.z = z
    }
}

var d: D = D(x: 1, y: 2, z: 3)
```

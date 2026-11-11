---
schemaVersion: 2
title: "@Sendable"
description: "이렇게 actor 타입을 만들었다. 근데 Actor라는 것도 있다."
tags: ["Swift", "동시성"]
publishedAt: "2024-10-13T07:45:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 7
---

## Actor

```swift
actor BankAccount { }
```

이렇게 actor 타입을 만들었다\. 근데 Actor라는 것도 있다\. 

Actor는 프로토콜이다\.

![](<../../assets/blog/sendable-11e0d0f75cd6805a8e5ed57e71c894ef/image-001.png>)

모든 actor가 준수하고 있는 common protocol이 Actor이다\. 이 프로토콜은 모든 actor 타입을 일반화한다\.

```swift
actor BankAccount { }

let account = BankAccount()
account is Actor // true
```

이게 Sendable이랑 무슨 상관이 있냐면, Actor가 Sendable을 conform하고 있다는 것이다\.

```swift
protocol Actor : AnyObject, Sendable
```

## Sendable

주어진 타입의 값이 ` 비동기 코드 안에서 안전하게 사용될 수 있음 `을 나타낸다\. 즉 동시에 사용하기에 안전하고, Actor간에 값을 공유할 수 있는 타입을 나타낸다\. 

actor는 shared mutable state에 대한 접근을 동기화하기 떄문에 Concurrent code에서 data race를 피할 수 있다\.

→ 주어진 타입의 값이 비동기 코드 안에서 안전하게 사용될 수 있다\.

결국 Concurrent Code에서 Data race가 발생하는 원인은 데이터가 공유 가변 상태 이기 때문이라고 했다\. 반대로 생각하면 데이터가 변경되지 않거나, 공유되지 않는 경우 data race는 발생하지 않는다는 것이다\. 

→ 값타입은 각 복사본이 독립적이기 때문에 Sendable이 될 수 있다\.

```swift
struct BankAccount: Sendable {
    let accountNumber: Int = 0
    let balance: Double = 0.0
    
    let doran: Doran // Stored property 'doran' of 'Sendable'-conforming struct 'BankAccount' has non-sendable type 'Doran
}

class Doran {}
```

컴파일 에러가 발생한다\.

## Class에서의 Sendable

Doran이 class가 아니라 actor라면?

```swift
struct BankAccount: Sendable {
    let accountNumber: Int = 0
    let balance: Double = 0.0
    
    let doran: Doran
}

actor Doran {}
```

잘 된다\. actor는 Actor 프로토콜을 암시적으로 준수하고있고, Actor는 Sendable을 준수하고 있기 때문이다\.

그렇다면 Class는 Sendable인가?

- Class는 모든 Subclass가 ` 변경할 수 없는 데이터 `만 보유하는 경우 Sendable이 될 수 있다\.
- Class가 내부적으로 동기화\(lock\)을 수행하여 ` 안전한 동시 접근을 보장하는 경우 ` Sendable이 될 수 있다\.

Class가 Sendable을 준수하게 하려면, 즉 Class를 사용하는데 concurrent code에서 안전하게 사용될 수 있음을 나타내려면 다음과 같다\.

- class는 final이어야 한다\.
- mutable stored property을 없애야 한다\.

결론적으로는,

```swift
final class BankAccount: Sendable {
    let accountNumber: Int = 0
    let balance: Double = 0.0
}
```

이렇게 되어야 컴파일이 가능해진다\.

## Function 

function, closure는 참조 타입이다\. Sendable은 프로토콜이였고, 타입들은 자동으로 Sendable을 준수하거나 직접 준수하도록 해줄 수 있다\. 하지만 Function type은 프로토콜을 준수할 수 없는 참조 타입이기도 하다\.

@Sendable Function type이란 것이 있다\. 암시적으로 Sendable 프로토콜을 준수한다\.

## 참고

<a class="notion-resource-card" href="https://zeddios.tistory.com/1305"><span class="notion-resource-label">링크</span><span>https://zeddios.tistory.com/1305</span></a>

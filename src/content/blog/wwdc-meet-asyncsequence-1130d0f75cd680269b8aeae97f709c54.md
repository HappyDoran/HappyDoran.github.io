---
schemaVersion: 2
title: "WWDC) Meet AsyncSequence"
description: "What is AsyncSequence?"
category: "미분류"
categorySlug: "uncategorized"
tags: ["Swift", "동시성"]
publishedAt: "2024-10-02T00:22:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 17
---

## What is AsyncSequence?

### Sequence란?

한번에 하나씩 단계별로 진행할 수 있는 값 목록\(list of values\)을 제공하는 프로토콜\.

Swift 에서는 Array, Set, Dictionary\. Collection 프로토콜을 채택하고 있는 구조체인데 이 Collection 프로토콜이 Sequence 프로토콜을 채택하고 있다\. 

for\-in loop를 사용하려면 Sequence 프로토콜을 채택하고 makeIterator\(\) 메소드를 구현해야 한다\. next\(\) 메서드를 통해 반복시 실행될 코드를 구현해야 한다\. 

```swift
// for- in loop는 컴파일러에 의해 다음과 같이 while loop로 변환된다.
var iterator = values.makeIterator()
while let value = iterator.next() {
	...
}
```

### AsyncSequence란?

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-001.png>)

새로운 URL 타입의 lines 속성을 사용해서 데이터의 각 줄을 다운로드 하는 코드가 있는데 데이터의 각 줄을 Async / Await 기능을 사용하여 모든 항목이 다운로드 되기를 기다리지 않고 수신되는 항목부터 먼저 표시할 수 있도록 해준다\. 

→ 원래였으면 csv 파일이 ` 모두 다운된 뒤 작업을 처리해야 했을 뿐 아니라 completion handler와 같은 콜백함수로 작업을 처리해줘야 하는데 ` , async 함수를 사용하면 위와 같이 직관적이고 효율적으로 코드 작성이 가능하다\.

lines는 ` AsyncLineSequence ` 타입이고 AsyncLineSequence 타입은 궁극적으로 ` AsyncSequence `를 뜻한다\. ` AsyncSequence `를 사용하면 비동기 방식으로 기존의 Sequence를 사용할 때 쓰던 ` .map(), .filter(), .reduce() `를 사용할 수 있고 여기처럼 ` .dropFirst() `를 사용할 수 있다\.

### Async 함수와 AsyncSequence

Async 함수를 사용하면`  콜백없이 await 키워드로 동시성 코드를 작성 `할 수 있고, 비동기 함수를 호출하면 suspend된 다음 결과 값이나 오류가 발생할 때마다 다시 resume 되는데, ` AsyncSequence를 사용하면 각 요소마다 suspend 되고 Iterator에 의해 결과 값이나 에러가 던져지면 resume 된다.(suspend 🔄 resume) `

> 💡 **야매 정리**
> 
> 한 줄을 읽으러 간다 → 
> 이 한 줄 읽는 동안에 suspend\(스레드를 열어둠\. 다른 작업 가능\) → 
> 한 줄 읽은 결과가 나오면 스레드 제어권 다시 가져옴\(resume\) → 
> 다음 줄 읽으러 간다 → 
> 이 줄 읽는 동안에 suspend\(스레드를 열어둠\. 다른 작업 가능\) → 
> … 이게 반복

### Sequence와 AsyncSequence

AsyncSequence의 각 요소는 비동기로 전달되기 때문에 에러를 던질 수도 있다\. 따라서 ` throws 함수처럼 에러 핸들링 `을 해야 한다\. 값이 하나도 없을수도 있으며, ` Sequence와 같은 방식 `으로 Iterator에서 nil을 리턴하는 방식으로 조절할 수 있다\. 

> 💡 **AsyncSequece 정리**
> 
> 기존의 Sequence와 동일한 부분이 있지만 차이점이 있다\.
> \- 각 Element마다 비동기로 전달된다\.
> \- AsyncSequence는 throws 함수를 통해 에러를 던질 수 있다\.
> \- 값이 발견되지 않을 수도 있고 Sequence와 마찬가지고 iterator에서 nil을 반환하면 완료된다\.
> \- 에러가 발생하면 iterator의 이후 next 호출에서 nil이 반환되어 완료된다\.

### AsyncSequence의 반복 처리

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-002.png>)

이렇게 컴파일러는 while loop로 변환하여 처리한다\. ` 비동기임을 제외하면 일반 Sequence와 동일 `하다\. 

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-003.png>)

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-004.png>)

break나 continue 사용도 가능하다\.

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-005.png>)

for\-try\-await\-in 구문을 사용하면 AsyncSequence가 오류를 발생시킬 때 잡아낼 수 있도록 강요하기 때문에 ` 안전한 코드 작성 `이 가능하다\.

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-006.png>)

반복을 동시에 실행하는 경우에는 반복을 ` 캡슐화 ` 하여 ` 각각의 Task로 만들어서 생성 `할 수 있다\. 

## Usage and APIs

### 비동기로 파일 읽기

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-007.png>)

` resourceBytes `는 File에서 ` AsyncBytes ` 시퀀스에 액세스 할 수 있는 새로운 바이트 속성이다\. 파일 또는 네트워크 콘텐츠에서 line의 AsyncSequence를 반환하는 URL의 편리한 속성이다\.

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-008.png>)

때때로 네트워크에서 정보를 얻으려면 응답 및 인증에 대한 좀더 많은 제어가 필요하다\. 그래서 ` URLsession은 URL, URLRequest가 주어지면 바이트의 AsyncSequence를 가져오는 bytes 함수 `가 생겼다\. 

### 새로운 비동기 알림 API

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-009.png>)

## Adopting AsyncSequence

나만의 AsyncSequence를 만들어보자\. 특히 ` AsyncSequence와 궁합이 잘맞는 디자인 패턴이 콜백과 대리자 `이다\. 응답할 필요가 없고 새로운 값이 발생한다는 것을 알려주는 거의 모든 것이 AsyncSequence를 만드는데 가장 적합한 후보가 될 수 있다\. 

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-010.png>)

일반적인 핸들러 패턴의 예이다\. 핸들러 속성과 시작 및 중지 메서드가 있는 QuakeMonitor 클래스가 있다\. 

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-011.png>)

클래스 인스턴스를 생성하고 값을 가져오는 Handler 메서드를 할당한 다음 모니터를 시작하고 모니터를 중지할 수 있다\.

### AsyncStream

스트림이란 데이터의 흐름을 의미한다\. 데이터를 한번에 처리하지 않고, 데이터가 하나씩 또는 여러개씩 일정한 간격으로 생성되어 이를 연속적으로 처리하는 방식이다\. 

AsyncStream은 순서가 있고, 비동기적으로 생성된 요소들의 Sequence이다\. 클로저 내부에서 하고 싶은 일을 정의할 수 있다\. 

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-012.png>)

동일한 인터페이스를 사용하여 새로운 AsyncStream 타입에 맞게 사용을 조정할 수 있다\. 약간의 코드를 추가하여 AsyncSequence를 만들 수 있다\. AsyncStream을 구성할 때 요소 유형과 클로저가 지정된다\. 클로저에는 값을 두 번 이상 산출할 수 있는 continuation이 있으며, 종료처리를 수행할 수 있다\. 

클로저 안에는 QuakeMonitor가 생성된다\. 그런 다음 계속해서 지진을 발생시키도록 핸들러를 지정할 수 있다\. 

이렇게 캡슐화를 해두고 다른 사용 부분에서 동일한 로직을 복제할 필요가 없다\.

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-013.png>)

AsyncStream의 사용 시에는 필터와 같은 강력한 변환 기능과 함께 for\-await\-in 구문을 사용할 수 있다\.

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-014.png>)

이렇게 AsyncStream을 통해서 기존의 코드를 AsyncSequence가 되도록 조정하는 좋은 방법이 될 수있다\. 

![](<../../assets/blog/wwdc-meet-asyncsequence-1130d0f75cd680269b8aeae97f709c54/image-015.png>)

오류를 던질꺼면 AsyncThrowingStream을 사용해라\.

## 참고

<a class="notion-resource-card" href="https://munokkim.medium.com/meet-asyncsequence-8fd6d12e4da"><span class="notion-resource-label">링크</span><span>https://munokkim.medium.com/meet-asyncsequence-8fd6d12e4da</span></a>

<a class="notion-resource-card" href="https://velog.io/@kimscastle/iOS-swift-concurrency%EC%9D%98-continuation%EC%95%8C%EC%95%84%EB%B3%B4%EA%B8%B0"><span class="notion-resource-label">링크</span><span>https://velog.io/@kimscastle/iOS-swift-concurrency의-continuation알아보기</span></a>

<a class="notion-resource-card" href="https://ios-daniel-yang.tistory.com/entry/iOSSwift-AsyncStream-AsyncThrowingStream"><span class="notion-resource-label">링크</span><span>https://ios-daniel-yang.tistory.com/entry/iOSSwift-AsyncStream-AsyncThrowingStream</span></a>

---
schemaVersion: 2
title: "WWDC) Protect mutable state with Swift actors"
description: "Actor의 등장 이유"
category: "미분류"
categorySlug: "uncategorized"
tags: ["Swift", "동시성"]
publishedAt: "2024-10-09T15:35:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 51
---

## Actor의 등장 이유

동시성 프로그램을 만들 때 어려운 문제 중 하나는 Data races\(데이터 경합\)이다\. ` Data races는 두 개 이상의 개별 스레드가 동일한 데이터에 접근하는데, 둘 중 하나 이상이 쓰기 작업일 때 발생한다. ` 이는 디버깅하기도 어렵다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-001.png>)

Counter라는 클래스가 있고, 내부에서 변하는 값인 value 프로퍼티가 있다\. 그리고 value를 \+1 해주는 increment 메소드가 있다\. 이 Counter 인스턴스를 만들어주고 두개의 분리 Task에서 동시에 실행을 해주면 결과가 어떻게 나올까?

실행 시점에 따라서 1, 2를 출력할 수도 있고, 1, 1 또는 2, 2가 출력될 수 있다\.

→ ` OS의 스케쥴러가 프로그램을 실행할 때마다 다른 방식으로 concurrent tasks를 인터리빙 할 수 있기 때문에 비결정적 `이다\. **인터리빙**이란 컴퓨터의 하드디스크 성능을 높이기 위해 데이터를 서로 인접하지 않게 배열하는 방식이다\.


이처럼 프로그램의 다른 부분에서 ` 같은 데이터에 접근하는 경우 `에 이러한 문제가 발생한다\. 위에서 말한대로 Data race는 쓰기 작업을 하거나 다른 스레드와 공유되는 경우에 발생한다\.

> 💡 **왜 쓰기 작업이지?**
> 
> 쓰기를 하는게 아니라 읽기만 하는 경우\(` 데이터가 변경되지 않는 경우 `\), 다른 스레드와 공유되지 않는 경우\(` Struct처럼 값 타입이여서 두개의 값이 완전히 분리 되는 경우 `\)에는 딱히 다른 값을 읽을 필요가 없다\.
> → 그래서 data race는 shared mutable state\(공유 가변 상태\)에서만 발생한다\.

그렇다면 data race를 어떻게 피해야 할까?

가장 쉬운 방법은 값 타입을 이용해서 ` 공유 가변 상태를 없애는 것 `이다\. 값 타입을 사용하면 모든 변경은 local로 일어나게 되서 안전하다\. 또 let을 덧붙이면 변하게도 못하게 할 수 있어서 동시에 접근해도 안전하다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-002.png>)

이렇게 하면 누가 봐도 참조가 아니라 복사인걸 알겠지? 

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-003.png>)

그럼 이제 다시 앞에 봤던 예시를 봐보자\. struct\. 즉 값타입이니까 mutating을 사용해서 내부의 변수의 수정을 할 수 있다\. 

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-004.png>)

근데 외부에서 let으로 선언되있으니 값을 바꿀 수 없어서 이런 에러가 뜬다 var로 바꾸자\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-005.png>)

var로 바꿨더니 에러 메시지가 바뀌었다\. 읽어보면 counter가 concurrent\-executing한 환경 \(동시에 실행될 수 있는 환경\)에서 문제가 있다\. 그래도 됐다\. 이런식으로 Swift는 컴파일러가 오류가 발생하면 보호해주니까\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-006.png>)

이거 해결할려고 각각의 Task에 변수를 또 선언해준다\. 이렇게 하면 가장 위에 있던 counter가 각각의 Task에 복사가 된 형태가 된다\. 하지만 값 타입이니까 둘다 1, 1이 나오겠다…

이걸로 알 수 있는 것은 결국 ` shared mutable state(공유 가변 상태)에 있으면 data race가 일어날 수도 있지만 공유 가변 상태가 필요한 경우가 여전히 있다 `는 걸 알 수 있다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-007.png>)

동시성 프로그램에서 shared mutable state가 있으면 우리는 data race을 피하기 위해 ` 동기화 `를 해주는게 꼭 필요하다\.

동기화를 하기 위해 Atomics, Locks과 같은 하위 수준 도구부터 Serial dispatch queues 같은 상위 수준 도구가 있지만, 매번 신중하게 여러가지를 고려하고 생각해야한다는 단점이 있다\. 그러지 않으면 또 data race가 발생할 것이다\.

이를 해결해주는게 Actor이다\.

## Actor

위의 글을 읽어봤을 때 결국에 ` Actor는 공유 가변 상태에 대한 동기화 메커니즘 `이다\. 그래서 ` Actor는 변경될 수 있고 공유되고 있는 정보를 concurrent code에서 접근할 때 안전하게 접근할 수 있게 해주는 도구 `이다\. 

Actor에는 ` 자신만의 상태(own state) `가 있으며 ` 해당 상태는 프로그램의 나머지 부분과 isolated(분리) `되어 있다\. 따라서 해당 상태에 접근할 수 있는 유일한 방법은 Actor를 거치는 것이며, ` Actor를 거칠 때마다 Actor의 동기화 메커니즘은 다른 코드가 Actor의 상태에 동시에 접근하지 않도록 해준다. `

Lock을 걸거나, 직렬 디스패치 큐를 사용해도 같은 효과\(상호 배제\)이지만, Actor를 사용하면 Swift가 근본적으로 보증한다\.

그렇다면 이 Actor를 어떻게 사용하냐?

Actor의 목적은 ` 공유 가변 상태를 표현 `하기 위해서이다\. 

Actor는 그저 Swift의 새로운 타입이며, 클래스와 가장 유사하다\.

Swift의 다른 모든 타입들과 똑같이 프로퍼티, 메소드, 이니셜라이저, subscripts 등을 가질 수 있다\. 

프로토콜을 준수하고, Extension 또한 가능하다\. 

또한 공유 가변 상태를 표현하기 위해서니까 참조 타입니다\. 

클래스와 다른 점은 Actor는 한번에 하나의 작업만 변경 가능한 상태\(mutable state\)로 접근할 수 있도록 한다\. 

그리고 상속을 지원하지 않는다\.

> 💡 **Actor의 사용 **
> 
> \- Swift의 새로운 타입이며 클래스와 유사
> \- 다른 모든 타입들과 똑같이 프로퍼티, 메소드, 이니셜라이저, Subscript 가능
> \- 프로토콜 준수, Extension 가능
> \- 참조 타입
> \- 한번에 하나의 작업만 변경 가능한 상태\(mutable state\)로 접근 가능
> \- 상속 x

```swift
actor Counter {
	var value = 0
	
	func increment() -> Int {
		value = value + 1
		return value
	}
}
```

Actor의 가장 중요한 특징은 ` 프로그램의 나머지 부분에서 인스턴스 데이터를 분리 `하고, ` 해당 데이터에 대한 동기화된 접근을 보장한다 `는 것이다\.

→ 동시에 접근이 불가능하다\.

```swift
actor Counter {
	var value = 0
	
	func increment() -> Int {
		value = value + 1
		return value
	}
}

let counter = Counter()
Task.detached {
	await print(counter.increment()) // 비동기적으로 수행하는 메커니즘
	// actor는 data race를 피하기 위해서 잠시동안 호출코드를 기다리게 할 수 있음.

Task.detached {
	await print(counter.increment())
}
```

class 때랑 똑같다\. 하지만 차이점은 ` Actor가 값이 동시에 접근되지 않도록 보장한다 `는 것뿐이다\. 위의 코드를 예로 들면, increment 메소드가 호출될 때 ` actor의 동기화 메커니즘이 Counter에 동시에 접근할 수 없게 막아준다. ` 즉 하나의 increment\(\)가 호출되면, 이게 끝날 때까지는 다른 increment\(\)를 실행하지 않는다\. ` 한번에 하나씩만 실행 `한다\. 이렇게 되면 data race가 일어날 일이 없다\.

우리는 지금 Actor를 쓰면 하나의 작업이 actor에 들어오면, 나머지 하나\(두번째 작업\)는 “기다려야 한다”에 초점을 두고 있다\. 

그럼 두번째 작업이 자기 차례를 잘 기다릴 수 있도록 어떻게 보장하는가? 

Swift에는 이를 위한 메커니즘이 있다\. 외부에서 Actor와 상호작용할 때마다 ` 비동기식으로 수행 `한다\. ` 특정 변경을 수행하는 것이 안전할 때까지 작업. 그러니까 데이터의 손상이나 경합을 일으킬 수 있는 작업을 일시중단 ` 하여 작동한다\. 

그래서 Actor는 ` 보통 외부에서 호출할 때는 async / await와 함께 쓰게 된다. `

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-008.png>)

해당 코드를 봐보자\. 기존의 Counter actor에 새로운 메소드 resetSlowly\(to: \)를 추가해주었다\. 이 메소드는 ` actor 내부에 정의 되어 있다 `고 할 수 있다\. 즉 ` actor의 상태에 직접적으로 접근을 할 수 있고 `\(value = 0으로 직접 설정이 가능하단 뜻\), ` actor의 다른 메서드 등을 동기적으로 호출할 수 있다. `\(await 없이 increment\(\)를 호출할 수 있다는 뜻\)

이미 Actor에서 이미 하나만 실행 중이란 것을 알고 있어서 대기도 필요하지 않다\. ` Actor의 동기 코드는 중단 없이 완료될 때까지 실행 `된다\. 그래서 ` actor 상태의 동시성 효과를 고려하지 않고, 순차적으로 추론 `할 수 있다\.

같은 actor내의 함수들에서는 동기적으로 작동하지만, 다른 actor의 메서드나 시스템의 다른 비동기 코드와 상호작용을 하면 어떻게 될까?

## Actor reentrancy

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-009.png>)

위 코드는 이미지 다운로드 Actor이다\. 다른 서비스에서 이미지를 다운로드 하는 역할을 한다\. 또한 다운로드한 이미지를 캐시에 저장해서 동일한 이미지를 여러 번 다운로드하지 않도록 한다\.

```swift
// ImageDownloader actor

// 캐시 확인
if let cached = cache[url] {
 return cached
}

// 이미지 다운로드
let image = try await downloadImage(from: url)

// 캐시에 저장
cache[url] = image
```

캐시가 있는지 확인

캐시가 있으면 캐시를 리턴하고,

캐시가 없으면 이미지를 새로 다운받음

캐시에 저장하고 이미지를 리턴

해당 코드는 ` actor 내부의 image 메소드 안에 있기 때문에 데이터 경합이 없고 `, 이미지들이 다운로드될 때 이 actor의 image 메소드를 이용하면 이미지들은 비동기적으로 다운로드 받을 수 있다\. 또한 ` actor의 동기화 메커니즘 덕분에 하나의 Task만 캐시에 접근할 수 있어서 캐시가 손상되지도 않는다. `

하지만 문제가 있다\.

```swift
// 이미지 다운로드
let image = try await downloadImage(from: url)
```

` await에서 항상 suspend `된다\. await를 만나면 이미지가 다운로드되는 동안, ` CPU를 포기하고 다른 코드들이 실행 `될 수 있게 된다\. 근데 문제는 이때 전체 프로그램에 영향을 미치게 되고, 다 기다리고 다시 복귀했을 때 프로그램의 상태가 바뀔 수도 있다는 것이다\.\(읭 ` 나도 모르는 새에 프로그램의 상태가 바뀐다고? `\)

다음은 해당 예시이다\. 보기 힘든 예시니까 그냥 이해만 하자\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-010.png>)

구름은 서버를 나타내고 서버에 현재 웃는 고양이 사진이 있다고 해보자\. 우리가 Task1에서 이미지를 다운로드 하게 되면 웃는 고양이 얼굴을 다운받게 된다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-011.png>)

이미지를 다운받는데 시간이 걸리니까, Task1은 suspend된다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-012.png>)

문제는 그 사이에 서버에 있는 고양이가 우는 고양이로 바뀌어버린거다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-013.png>)

Task1이 suspend 되고 Task2도 이미지 다운로드를 시작한다\. 아직 Task1이 끝나지 않아서 캐시에 아무것도 저장되어있지 않아서 또 이미지를 다운로드 한다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-014.png>)

Task2도 await를 만나 일시중단되어 suspend된다\. 

우리가 원래 기대했던 것은 Task1에서 웃는 고양이가 다운받아지고, 이 웃는 고양이가 캐시에 저장되고, Task2에서 불러오면 캐시에 있는 웃는 고양이가 나와야 하는 거였다\. 

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-015.png>)

일단 Task1이 완료되고 다시 actor코드로 돌아가 재개된다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-016.png>)

캐시를 웃는 고양이로 채우지만, 

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-017.png>)

Task2가 완료되면 cache\[url\] = image를 만나서 우는 고양이로 캐시를 바꿔버린다\.

캐시가 이미 채워져있는데, 또 다운로드를 받아서 캐시에 넣는거다\. 우리 생각은 한번 저장된 이후에는 처음 캐시에 저장된걸 리턴해줄거라 생각했는데\. 이처럼 ` data race는 없는데 await로 인한 의도치 않는 결과를 얻게 된걸 볼 수있다.  `

이처럼 await 한 후의 상황이 그 사이에 많이 바뀔 수 있다는걸 생각해야 한다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-018.png>)

이렇게 캐시에 저장하는 방식을 바꿔도 된다\. 캐시에 저장할 때, 아직 캐시에 아무것도 없다고 단정하지 말고 항상 다시 확인을 해줘야한다\. ` 더 나은 솔루션은 일시정지 후 다시 실행할 때 캐시에 이미 값이 있으면 원래 버전을 유지하고 새로운 버전을 버리도록 하던지, 중복 다운로드를 완전히 피하는거도 있다. `

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-019.png>)

Actor의 reentrancy\(재진입\)는 데드락\(프로세스가 자원을 얻지 못해 다음 처리를 하지 못하는 상황\)을 방지하고, 계속 진행되는걸 보장해주지만 꼭 ` 각각의 await에서 한번 더 확인해줘야한다. `

reentrancy를 잘 설계하려면, ` 동기 코드 내에서 actor의 상태 변경을 수행 `해야한다\. 동기 함수 내에서 수행하면 이상적으로 ` 모든 상태 변화가 캡슐화 `가 된다\. 상태 변경은 일시적으로 actor를 일관성이 없는 상태로 만드는 것을 수행한다\. 꼭 await 전에 일관성 있는 상태로 복원해야한다\. 

await는 suspend할 수 있는 시점이므로 코드가 다시 시작되기 전에도 프로그램은 계속 실행되고 있다\. 따라서 다시 시작되면 global state, clocks, timer와 같은 것들을 확인해줘야 한다\.

## Actor Isolation

Actor isolation은 모든 actor 동작의 기본이다\. 어떻게 언어적으로 isolation을 보장하고, 다른 액터로부터 비동기 작업을 처리하는지 봤다면, 여기서는 ator isolation이 프로토콜 준수, 클로저, 클래스 등 다른 언어 기능과 어떻게 상호작용 하는지 봐보자\.

### protocol

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-020.png>)

actor는 다른 타입처럼 프로토콜의 요구사항을 충족만 하면 프로토콜을 채택할 수 있다\.
이렇게 Equatable을 준수하는 actor에서 == 메서드가 둘의 idNumber를 비교해서 같은지 다른지를 판단한다\. 여기서 ==는 static 메소드이기 때문에 자체 self 인스턴스가 없고, 그래서 actor에 격리된 형태가 아니다\. 대신에 actor 타입의 lhs, rhs가 있다\. idNumber가 ` let이라 문제가 없다. `

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-021.png>)

actor가 hashable을 채택한다면 다음과 같이 hash\(into:\)를 구현해줘야 한다\. 

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-022.png>)

하지만 이렇게 하면 에러가 난다\. hash\(into:\)는 언제든지 actor외부에서 호출될 수 있는데, 지금은 actor 내부에 있는 형태인것이다\. 이렇게 되면 내부에서 비동기로 작동하게 만들어야 하는데 이게 지금 프로토콜에 적용된거여서 async로 바꿀수가 없다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-023.png>)

` Actor 내의 함수를 액터의 외부에 있게 하고싶으면 nonisolated 키워드를 붙여주면 된다. ` 이렇게 하면 Hashable 프로토콜의 요구사항도 지킬 수 있고 액터 내부에 있지 않아서 비동기로 만들어줄 필요도 없다\. 그리고 idNumber가 불변하기 때문에 해당 코드에는 문제가 없다\. 

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-024.png>)

var 타입인 booksOnLoan으로 해싱을 하면 문제가 생기겠지만…

### closer

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-025.png>)

클로저는 한 함수 내에 정의된 작은 함수로 다른 함수로 전달되고 나중에 호출될 수도 있다\. 함수랑 똑같이 클로저도 actor\-isolated일 수도 있고 nonisolated일수도 있다\.

위의 코드는 대출한 책의 일부분을 읽고 읽은 페이지의 수를 반환한다\. reduce\(\)는 읽기를 수행하는 readSome\(\)을 포함하고 있고, readSome에는 await가 없다 왜나면 read\(\)가 actor\-isolated 함수여서 내부에 있는 클로저도 actor\-isolated이기 때문이다\. 때문에 ` 클로저가 동기적으로 실행이 되서 안전하다는 것을 알수 있다. `

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-026.png>)

해당 코드는 지금 책을 읽을 시간이 없으니, 나중에 읽기로 하는 것을 표현했다\. Task\.detached를 이용해서 Task를 만들어주면, 클로저는 Actor가 하는 다른 작업과 함께 동시에 실행된다\. 그러니까 클로저는 actor 내부에 있을 수 없다\. 이 클로저는 actor에 isolated 하지 않다는 것을 말한다\. 그러니까 actor 내의 함수에 접근할 때는 await를 써주고 비동기적으로 호출해야 한다\.

### Data

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-027.png>)

아마 위에서 설명한 Book은 값타입인 struct였을 것이다\. 값타입으로 하면 좋은건, LibraryAccount  actor의 인스턴스에 대한 모든 상태가 자체적으로 포함되어 있기 때문이다\. 

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-028.png>)

외부에서 이런 비동기 코드를 호출한다고 하면 우리가 임의의 책을 선택할 때 마다 책을 참조하는 것이 아닌 책의 사본을 얻는다\. 그래서 책의 사본을 변경해도 actor에는 영향을 미치지 않는다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-029.png>)

class로 하게 되면 LibraryAccount 액터는 Book 인스턴스들의 참조를 가지게 된다\. 여기에 selectRandomBook을 호출하면 actor 외부에서 actor 내부에 대한 참조를 가진다\. 즉 data races가 가능해진다\. 

결론은 struct와 같은 값타입은 동시에 사용해도 안전하지만 class와 같은 참조타입은 data race와 같은 문제를 일으킬 수 있다\.

## @Sendable

그럼 ` 동시 환경에서 사용해도 안전한 타입 `에 대해서 어떻게 쉽게 파악할 수 있을까? Swift에서는 이를 표시하기 위해 Sendable이라는 프로토콜을 제공한다\.

Sendable 타입은,`  다른 actor 사이에서 값을 공유할 수 있는 타입 `입니다\. 하나의 위치에서 다른 위치로 값을 복사하고 두 위치가 서로 간섭하지 않고 해당 값의 복사본을 안전하게 수정할 수 있으면 Sendable 타입이 될 수 있다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-030.png>)

Sendable이 되는 타입은 대표적으로 다음과 같다\.

- 값타입 \- 값타입은 값이 복사될 때 두 위치에서 값이 복사되는 형태이기 때문에 data race가 발생하지 않는다\.
- actor타입 \- actor는 변경할 수 있는 상태에 접근할 때, actor가 가진 동기화 메커니즘에 의해 동시에 접근할 수 없기 떄문에 안전하다\.
- class지만 let타입의 데이터만 보유한 경우
- class지만 내부적으로 concurrent access를 보장하기 위해 lock과 같은 동기화를 자체적으로 수행하는 경우
- Sendable 함수 타입

actor, 모든 동시성 코드는 data race를 방지하기 위해 안전한 Sendable 타입으로 소통해야한다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-031.png>)

Actor\(사실상 모든 concurrent code\)는 주로 Sendable 타입으로 통신해야 한다\. 위와 같이 actor 바깥에서 actor 내부의 변수로 접근하는데 Sendable 타입이 아닌 타입으로 넘기면 에러가 난다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-032.png>)

타입이 Sendable인건 어떻게 알 수 있을까? Sendable은 프로토콜이고 이를 따르면 Sendable 타입이라고 할 수 있다\. 그런 뒤 Swift는 타입이 Sendable인지 확인한다\. 위 코드에서 Book 구조체는 모든 프로퍼티가 Sendable 타입이라면 Sendable이다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-033.png>)

Auther 타입이 클래스면 auther 프로퍼티는 Sendable이 아니기 때문에 오류가 발생한다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-034.png>)

제네릭 타입의 경우 Sendable 여부는 제네릭 인수에 따라 달라질 수 있다\. 적절할 때 Sendable을 전파할 수 있도록 조건을 달 수 있다\. 위에와 같이 Pair는 인자가 모두 Sendable 타입일 경우에만 Sendable이 된다\.

값을 동시에 공유해도 안전한 타입의 Sendable을 도입하는 것이 좋다\. 그러한 타입을 Actor 안에서 사용하면 Swift가 Actor간에 Sendable을 적용하기 시작하고 코드가 실행 준비가 된다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-035.png>)

함수 자체는 Sendable이 될 수 있으며, 즉 Actor 간의 함수값을 전달하는 것은 안전하다는 것을 의미한다\. 클로저의 경우 이는 특히 중요한데, 예를 들어 Sendable closure는 mutable 지역 변수를 캡쳐할 수 없다\. 즉 클로저가 캡쳐 가능한 것은 Sendable 타입이며, 클로저를 사용해서 Actor간 non\-Sendable 타입을 이동시킬 수는 없다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-036.png>)

detached의 경우 Sendable 클로저 아이디어를 사용하고 있었다\. 그렇기 때문에 detached task에 대한 클로저는 Sendable이므로 Swift에서 오류를 발생 시켰다 이는 data race를 방지한다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-037.png>)

다른 예시로 detached는 sendable 하므로 Actor에서 분리되면 안된다는 것을 알고 있다\. 따라서 비동기로 상호작용 해야한다\. 

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-038.png>)

이처럼 Sendable 타입 및 클로저는 mutable state가 Actor간에 공유되지 않고 동시에 수정할 수 없는지 확인해서 Actor isolation을 유지하는데 도움이 된다\.

## Main Actor

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-039.png>)

우리는 보통 앱을 만들 때 UI에서 일어나는 일들은 모두 메인 스레드에서 처리하도록 한다\. UI렌더링이나 사용자의 이벤트를 처리하는 그런 것들 말이다\. 그치만 모든 작업을 메인 스레드에서 실행하고 싶지 않을 수 있다\. 예를 들어 느린 입출력 작업이나 서버와 많은 작업을 처리하면 UI가 정지될 수 있다\. 

따라서 메인스레드 작업은 항상 조심히 해야하고, 오래 기다려야하는 연산은 메인 스레드 밖에서 해야한다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-040.png>)

평소에는 그냥 다른 스레드에서 하다가 꼭 메인 스레드 작업이 필요하게 되면 DispatchQueue\.main\.async를 사용해서 메인 스레드에서 실행해주면 된다\. 이는 액터가 작동하는 방식과 동일하다\.\(메인 스레드에서 실행되고 있지 않은 작업을 async 하게 데려오는 것\)

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-041.png>)

MainActor라고 부르는 메인 스레드를 나타내는 특별한 Actor가 있다\. 이는 일반 Actor와 두가지가 다르다\.

- MainActor는 Main Dispatch Queue를 통해 모든 동기화를 수행한다\. 즉 런타임 관점에서는 DispatchQueue\.main를 사용해서 교체할 수 있다\.
- 메인 스레드에 있어야 할 코드와 데이터가 여기저기에 존재한다\. SwiftUI, AppKit, UIKit 및 시스템 프레임워크에 존재한다\.

Swift concurrency를 사용해서 MainActor를 선언하면 항상 main actor에서 실행되어야한다 말한다\. 위의 코드에서는 checkout\(\)에 @MainActor를 붙였기 때문에 항상 main actor에서 실행된다\. 그러므로 await를 꼭 붙여줘야 하고 그래야 메인 스레드에서 비동기적으로 실행된다\.

Swift는 @MainActor가 붙은 코드를 항상 메인 스레드에서 실행하도록 보장한다\.

![](<../../assets/blog/wwdc-protect-mutable-state-with-swift-actors-11a0d0f75cd680ddaf11c87a352dcdcc/image-042.png>)

타입도 MainActor에 위치할 수 있으므로 모든 멤버와 하위 클래스들은 모두 main actor내에 있게 된다\. 이는 코드의 일부가 꼭 UI와 상호작용하거나, 모두 메인 스레드에서 실행되어야 할 때 유용하다\.

각각의 메서드들은 actor 규칙과 비슷하게 nonisolated 키워드를 사용해서 액터 바깥에서 실행되게 할 수도 있다\.

## 참고

<a class="notion-resource-card" href="https://medium.com/daily-monster/wwdc21-protect-mutable-state-with-swift-actors-%EC%9A%94%EC%95%BD-e55d755e9953"><span class="notion-resource-label">링크</span><span>https://medium.com/daily-monster/wwdc21-protect-mutable-state-with-swift-actors-요약-e55d755e9953</span></a>

<a class="notion-resource-card" href="https://icksw.tistory.com/269"><span class="notion-resource-label">링크</span><span>https://icksw.tistory.com/269</span></a>

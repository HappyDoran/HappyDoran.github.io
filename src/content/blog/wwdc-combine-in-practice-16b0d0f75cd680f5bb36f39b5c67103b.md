---
schemaVersion: 2
title: "WWDC) Combine in Practice"
description: "Combine의 전체 흐름"
category: "미분류"
categorySlug: "uncategorized"
tags: ["Swift", "동시성", "상태 관리"]
publishedAt: "2024-12-29T07:30:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 35
---

## Combine의 전체 흐름

- 코드에 이제 Value 또는 이벤트를 보내주는 Publisher가 있고,
이 Publisher로부터 값을 수신하는데 관심이 있는 Subscriber가 있다\.
- 어떠한 절차\(구독을 하고, 구독권을 Publisher에게 넘겨주는 그런\)걸 통해서 두 당사자 사이의 연결을 설정한다\.
- 연결이 되면, Subscriber에게 Publisher가 value를 전달한다\.
- Publisher는 둘 사이의 연결이 끊기지 않는 한\(cancel\) 전송을 계속 한다\.

→ 이러한 형태의 통신은 Callbacks, Closures, Notifications, Key Value, Observing 등 비동기 통신에서 전반적으로 나타난다\.

## Publisher

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-001.png>)

Combine을 사용하면 NotificationCenter가 Publisher를 통해서 알림을 노출하게 할 수 있다\. 

이 때 알림을 내뿜는 것에 성공하면 Notification 타입, 실패하면 Failure 타입이다\.

### Data Handling

Publisher는 여러 가지의 Operator를 사용하여 데이터와 에러를 가공할 수 있다\.

#### map

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-002.png>)

map을 통해 가져온 Notifcation\(Output\)을 Data 타입으로 변환할 수 있다\. 

#### trymap

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-003.png>)

JSON 페이로드를 tryMap을 사용하여 앱에서 정의한 MagicTrick으로 바꿀 수 있다\.

tryMap은 map과 비슷하지만 error를 failure로 변환하는 기능이 추가로 있다\.

근데 이렇게 디코딩도 하고 에러 타입도 바꾸면 복잡하니까,

#### decode

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-004.png>)

decode를 사용하여 디코딩을 하자\.

이렇게 Publisher에서 뿜어내는 데이터를 가공하여 보내면 된다\.

### Error Handling

Combine에서는 잠재적인 failure에 적절히 대응하는 것이 매우 중요하다\. 

모든 Publisher와 Subscriber는 자신이 발생시키거나 허용하는 Failure의 타입을 설명할 수 있다\. 

대부분의 Publisher는 Failure 타입으로 Never를 설정한다\.

#### assertNoFailure

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-005.png>)

제일 쉬운 방법은 assertNoFailure를 호출하는 것이다\. 이러면 퍼블리셔의 Failure 타입은 Never 타입이 된다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-006.png>)

assertNoFailure를 사용하면 Value는 다운스트림에 그대로 전달하지만 Error가 발생하면 프로그램이 멈추고 Fatal error를 발생시킨다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-007.png>)

assertNoFailure말고도 다른 Operator가 많다\. 이중에 제일 유용한 것은 catch이다\.

#### catch

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-008.png>)

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-009.png>)

catch를 사용하면 Data가 정상적으로 넘어오면 문제가 없는데, failure가 발생한 경우에 사용할 recovery Publisher를 정의하는 클로저를 제공한다\.

무슨 말이냐면 에러 발생하면 앞서 있던 업스트림과의 연결을 끊어버리고, 복구 클로저를 사용해서 새로운 Publisher를 생성하고 구독하고 이후부터 값을 자유롭게 받을 수 있게 한다는 뜻이다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-010.png>)

catch를 사용한 코드는 다음과 같다\. 

Just는 Combine에서 제공되는 Publisher하려는 값이 이미 있을 때를 위한 특별한 퍼블리셔이다\.

catch 역시 Failure의 타입은 Never이다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-011.png>)

catch를 순서대로 설명하면 다음과 같다\.

- Error 발생시 기존 업스트립과의 구독이 끊김
- Recovery 퍼블리셔에 대한 구독이 생성
- 근데 이러면 다시는 다른 알림을 볼 수 없다\.
- 우리가 원하는 것은 디코딩을 시도하고 실패할 경우 원래 업스트림에 대한 연결을 유지하면서 Placeholder를 사용하는 것이다\.
   → 에러가 발생할 때만 Placeholder를 받고, 기존 Publisher가 발행하는 값을 받아오고 싶은거지\.

#### flatMap

위에서 생긴 문제점\. 즉 에러가 발생하면 기존의 Publisher와 연결을 끊어버리고 Placeholder를 받아와서 기존의 Notification을 보지 못하는 것을 해결하기 위해서 flatmap이라는 Operator가 있다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-012.png>)

map과 유사하게 작동 된다\. 업스트림으로부터 값을 받으면 외부 Publisher와는 독립적으로, 새로운 Just Publisher를 생성한다\. 이 Publisher를 구독하고, 그 값을 다운스트림에 제공하는 세부사항을 처리한다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-013.png>)

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-014.png>)

새로운 퍼블리셔의 뒤에는 밑에 보이는 일련의 과정을 따른다\. 그런 다음 flatMap은 이 새로운 퍼블리셔를 구독하여 결과 값을 다운 스트림에 제공한다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-015.png>)

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-016.png>)

만약 실패하여 에러가 발생한다면 catch가 동작하고 Recorvery Publisher로 대체된다\. 그리고 이것이 flatMap으로 반환되는 퍼블리셔가 될 것이다\. 기존과 똑같이 Publisher와의 연결을 끊어버리는건 맞지만, 맨 처음의 Publisher와는 연결이 끊기는 건 아니다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-017.png>)

- flatMap을 사용하고 클로저가 새로운 Just Publisher를 리턴하게 한다\.
- 그걸 decode 하고 catch에서 문제가 발생하지 않으면 Subscriber에게 주고, 문제가 발생하면 placeholder를 전달한다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-018.png>)

이걸 이제 publisher를 통해 값을 가져올 수 있다\.

### Scheduled Operators

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-019.png>)

scheduled Operators를 사용하면 특정 이벤트가 언제 어디서 전달되는지 설명할 수 있다\. 
기본적으로는 런루프와 디스패치 큐에 의해 지원된다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-020.png>)

다양하게 있는데 receive를 봐보자\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-021.png>)

receive는 뭐냐면 publisher 해온 데이터를 메인 스레드\(UI를 다루는\)로 옮겨서 작업하게 하는 역할처럼, 스레드를 지정해서 작업할 수 있게끔 해준다\.

### Publisher 정리\(데이터 반환 타입, 에러 반환 타입\)

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-022.png>)

- NotificationCenter를 통해 Notification을 발행하는 Publisher를 생성 \(**Notification, Never**\)
- map을 통해 Notification을 Data로 변환 \(**Data, Never**\)
- flatMap을 사용 \(**MagicTrick, Never**\)
   - 새로운 Just Publisher를 생성하여 decoding을 하고 Subscriber에 전달\.
   - decoding에서 에러가 발생할 경우 Just Publisher와의 연결을 끊어버리고, Recovery Publisher에서 Placeholder를 발행 받아서 Subscriber에 전달\.
- 이 받아온 값을 메인스레드로 옮겨서 작업할 수 있도록 receive를 사용 \(**String, Never**\)

## Subscriber

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-023.png>)

Subscriber는 
subscription\(Publisher에게 구독권을 주고, 나 구독했어요 하면서 처음에 연결하는 메소드\),
values\(Publisher에게 값을 일정한 시간, 요청했을 때 받기 위한 메소드\),
completion\(Publisher가 끝났거나, failure가 발생했을 때 호출하는 메소드\)
이렇게 메소드가 존재한다\.

### receive\(subscription: \)

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-024.png>)

Publisher\.subscribe\(Subscriber\)에 의해 Subscriber가 Publisher에 attached되고

그다음 Publisher는 Subscriber에게 Subscription을 보내게 된다\. 그걸 받는 메소드이다\. 딱 한번 실행된다\.

### receive\(\_: \)

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-025.png>)

publisher는 Subscriber가 요청하면 0개 이상의 값을 다운스트림으로 제공할 수 있다\.

### receive\(completion: \)

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-026.png>)

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-027.png>)

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-028.png>)

completion은 Publisher가 finished 되었거나, failure가 발생했음을 나타낸다\. 

completion이 전송된 후에는 연결이 끊기기 때문에 더 이상 value를 전송할 수 없다\.

### Kind of Subscribers

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-029.png>)

combine에는 여러 가지의 Subscriber들이 존재한다\.

#### assign

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-030.png>)

assign Operator를 이용하여 Publisher에 Subscriber를 추가한 모습이다\.

- assign은 업스트림이 보내는 모든 값이 지정된 객체의 저장된 key path에 할당된다\.
   → Publisher로부터 받은 값을 someObject\(지정된 객체\)의 somProperty\(key path\)에 할당
- assign은 나중에 구독을 종료하기 위해 호출할 수 있는 cancellation token도 생성한다\.
- assign은 Failure가 Never일 때만 사용이 가능하다\.

다음은 assign의 예시 코드이다\.

```swift
class MyClass {
    var anInt: Int = 0 {
        didSet {
            print("anInt was set to: \(anInt)", terminator: "; ")
        }
    }
}

var myObject = MyClass()
let myRange = (0...2)
cancellable = myRange.publisher
    .assign(to: \.anInt, on: myObject)
// Prints: "anInt was set to: 0; anInt was set to: 1; anInt was set to: 2"
```

이런식으로 myObject의 anInt 프로퍼티에 값을 할당해줘서 didSet으로 출력이 된다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-031.png>)

assign의 반환형은 Cancellable이다\. 

#### Cancellation

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-032.png>)

Publisher가 이벤트 전송을 완료하기 전에 구독을 종료하고 싶은 경우가 있는데 이 때 구독을 종료하기 위해 호출되는 메서드 이다\. 구독을 종료하면 더이상 Publisher로부터 발행되는 값을 받지 않는다\. 

Cancellable 타입은 직접적으로 cancel을 호출할 수도 있지만 deinit 될 때 자동적으로 cancel 메소드를 호출하기 때문에 deinit 시점에 명시적으로 cancel을 호출하지 않고도 cancel이 호출 되도록 AnyCancellable라는 편의 기능이 있다\.

#### sink

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-033.png>)

sink Operator는 클로저를 제공하면 모든 값이 수신될 때마다 클로저가 호출되고, 원하는 side 작업을 수행할 수 있다\. 

```swift
let myRange = (0...3)
cancellable = myRange.publisher
    .sink(receiveCompletion: { print ("completion: \($0)") },
          receiveValue: { print ("value: \($0)") })

// Prints:
//  value: 0
//  value: 1
//  value: 2
//  value: 3
//  completion: finished

```

이런식으로 Range Publisher가 방출한 값을 먼저 receiveValue에서 처리하고, 값을 처리하고 나면 receiveCompletion이 실행이 된다\.

sink 또한 assign 처럼 AnyCancellable 타입을 리턴한다\.

#### Subject

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-034.png>)

Subject는 Publisher의 역할을 할 수도 있고 Subscriber의 역할을 할 수도 있다\. 

Publisher에게 value를 받는 Subscriber의 역할을 하고 다른 Subscriber에게 send를 통해 이벤트를 Subject\(Subscriber\)에게 보낼 수 있다는 뜻이다\. 

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-035.png>)

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-036.png>)

수신한 값의 멀티 캐스팅을 지원하며, 중요한 것은 값을 명령형으로 전송할 수 있다는 것이다\. 여러 Downstream Suscriber에게 값을 전송할 수 있고, send를 통해 명령형으로 값을 보낼 수 있다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-037.png>)

Combine에는 두가지 Subject가 있는데, 

Passthrough는 값을 저장하지 않아서 해당 Subject가 보낸 값을 받으려면 반드시 그전에 구독을 해놔야한다\.

CurrentValue는 마지막 값을 저장하기 때문에 마지막 값이 생긴 후에 구독을 해도 값을 얻을 수 있다\. 

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-038.png>)

이런식으로 Passthrough는 값이 저장되지 않고, CurrentValue는 값이 저장된 것을 볼 수 있다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-039.png>)

Subject는 업스트림의 Publisher를 구독할 수 있는 점에서 Subscriber처럼 동작한다\.

sink라는 Operator를 사용해서 스스로 구독자를 형성하는 것처럼 Publisher로 동작하기도 한다\.

send를 사용해서 명령형으로 값을 보낸다\.

Combine은 값타입이기 때문에 copy의 비용이 높다\. share는 Publisher를 참조타입으로 얻어낼 수 있기 때 비용을 줄여준다\.

## SwiftUI와 Combine

SwiftUI의 놀라운 점 중 하나는 애플리케이션의 의존성만 설명하면 나머지는 프레임워크가 알아서 처리한다는 점이다\. 

Combine의 관점에서는 데이터가 언제 변경되는지 설명하는 Publisher만 제공하면 된다는 의미\.

이를 위해서 ObservableObject 프로토콜을 채택하면 된다\.

```swift
class WizardModel: ObservableObject { 
	var trick: WizardTrick { didSet { didChange.send() }
	var wand: Wand? { didSet { didChange.send() }
	
	let didChange = PassthrouthSubject<Void, Never>()
}

struct TrickView: View {
	@ObservedObject var model: WizardModel
	
	var body: some View {
		Text(model.trick.name)
	}
}
```

## Designed For Composition

combine은 Composition을 염두에 두고 설계되었다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-040.png>)

여기서 우리가 해야되는 Task는
유효한 이름인지 서버를 거쳐 확인해야 하고
패스워드가 8자 이상인지, 패스워드와 패스워드를 채크하는 부분이 같은지 로컬에서 확인해야 하고
조건이 맞으면 계정 생성 버튼을 활성화 해야한다\.

동기적 요구사항과 비동기적 요구사항이 혼재된 상태\. 

동기적 요구사항은 우리가 @Published해서 하던 것처럼 하면 된다\.

@Published는 프로퍼티를 Publisher가 될 수 있도록 만들어주는 애\.

지금 보면 이제 Password와 PasswordAgain이 똑같은지 판별해야하는데 이를 할 수 있는게 CombineLatest Operator라는 녀석이다\.

### CombineLatest

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-041.png>)

CombineLatest에서 $표시로 Publisher를 받으면, 둘중 하나의 Publisher라도 값을 방출할 때 CombineLatest 신호를 받는다\. 유효성을 판단하고 그 결과를 내려준다\. 

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-042.png>)

반환형이 더러우니까 eraseToAnyPublisher를 적용하면 Subscriber에게 AnyPublisher 형대로 감싸서 전달이 가능하다\.

#### CombineLatest 흐름

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-043.png>)

- 처음에 @Published를 붙여서 Publisher로 작동할 수 있도록 만들고
- CombineLatest를 이용하여 두 Publisher가 방출하는 값을 묶어서 처리
- eraseToAnyPublisher를 사용하여 Subscriber에게 값을 감싸서 전달

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-044.png>)

### Debounce

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-045.png>)

유저의 이름이 유효한지 알아내기 위해 서버랑 컨택을 해야한다\.

마찬가지로 @Published를 프로퍼티에 붙이고 값이 변할 때마다 발행을 한다\. 근데 값이 변할 때마다 서버와 컨택을 하는건 좀…

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-046.png>)

그래서 Debounce Operator를 사용한다\. 값이 변하고 일정 시간 이상 값이 유지되어야 행동을 취한다\.

### removeDuplicates

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-047.png>)

removeDuplicates를 사용하면 텍스트 필드에 적혀있는 값을 지웠다가 빠르게 다시 원래대로 돌리면 동일한 값이니까 그걸 판단해서 같은 값이 발행되지 않게 도와주는 Operator이다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-048.png>)

### 비동기 작업 추가

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-049.png>)

이제 비동기 네트워크 작업을 진행해보자\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-050.png>)

flatMap은 위에서 말했으니 생략하고, Future가 뭔지 얘기해보자\.

Future는 미래에 호출될 클로저의 성공/ 실패 여부를 결과를 갖는 녀석이다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-051.png>)

userNameAvailable 메서드를 호출했을 때 비동기적으로 클로저가 실행되고 값이 있으면 promise가 success로 채워진다\. 그걸 이제 Future가 받아서 flatMap이 받아서 다운스트림으로 전해준다\.

![](<../../assets/blog/wwdc-combine-in-practice-16b0d0f75cd680f5bb36f39b5c67103b/image-052.png>)

## 참고

<a class="notion-resource-card" href="https://lsj8706.tistory.com/98"><span class="notion-resource-label">링크</span><span>https://lsj8706.tistory.com/98</span></a>

<a class="notion-resource-card" href="https://levenshtein.tistory.com/533"><span class="notion-resource-label">링크</span><span>https://levenshtein.tistory.com/533</span></a>

<a class="notion-resource-card" href="https://developer.apple.com/videos/play/wwdc2019/721/"><span class="notion-resource-label">링크</span><span>https://developer.apple.com/videos/play/wwdc2019/721/</span></a>

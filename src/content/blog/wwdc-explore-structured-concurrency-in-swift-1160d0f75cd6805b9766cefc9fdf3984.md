---
schemaVersion: 2
title: "WWDC) Explore structured concurrency in Swift"
description: "동시성. Queue(작업 대기 행렬)의 작업 처리방식에서 동시에 실행이 되는 처리방식을 뜻한다. ConcurrentQueue는 들어온 작업을 여러 개의 다른 스레드에서 동시에 실행시킨다."
tags: ["Swift", "동시성"]
publishedAt: "2024-10-05T08:21:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 41
---

## Concurrency

동시성\. Queue\(작업 대기 행렬\)의 작업 처리방식에서 동시에 실행이 되는 처리방식을 뜻한다\. ConcurrentQueue는 들어온 작업을 여러 개의 다른 스레드에서 동시에 실행시킨다\.

## Structured Programming

구조화된 동시성이라는 개념을 사용하여 Concurrent Program\(동시성 프로그램\)을 작성하는 새로운 방법\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-001.png>)

컴퓨팅 초기에는 제어흐름이 모든 곳에서 이동할 수 있는 일련의 명령으로 프로그래밍 되었기 때문에 프로그램을 읽기가 어려웠다\.

하지만 요즘엔 우리가 사용하는 언어가 제어 흐름을 보다 균일하게 만들기 위해 Structured Programming\(구조화된 프로그래밍\)을 사용하기 때문에 더이상 저렇지 않다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-002.png>)

예를 들어서 if 블록은 구조화된 프로그래밍을 사용한다\. 중첩된 코드 블럭이 위에서 아래로 이동하는 동안에만 조건부로 실행되게 지정한다\. 

then 블록은 static scoping\(정적 범위 지정\)도 준수한다\. 즉 변수명이 블록에 정의된 경우에만 변수명으로 표시된다\. 또한 블록안에 정의된 모든 변수의 수명은 블록이 끝나면 종료된다\.

즉 ` 정적 범위를 사용한 구조적 프로그래밍 `은 ` 제어 흐름 `과 ` 변수의 수명 `을 알기 쉽게 만든다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-003.png>)

보다 일반적으로, 구조적 프로그래밍은 자연스럽게 순서를 지정하고 함께 중첩될 수 있다\. 

우리는 괄호\(\{, 정적 범위, static scope\)를 열고 Top\-down 방식으로 코드를 읽으면서 여러 scope\(코드의 범위\)들을 왔다갔다 하면서 읽는 것이 매우 직관적이고 당연하게 여긴다\.

하지만 요즘 프로그래밍은 asynchronous\(비동기적인 작업 순서\) \+ concurrent\(동시에 여러 작업을 실행\)를 특징으로 하기 때문에 구조적인 프로그래밍을 작성하기 쉽지 않다\.

왜냐하면 어떠한 구조를 어떠한 순서에 맞도록 제어 흐름이 생겨나야 하는데 비동기와 동시성은 그것을 신경쓰지 않고 작동하기 때문이다\.

## Structured Programming \+ Asynchronous Code

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-004.png>)

기존에 쓰여진 비동기 코드를 봐보자\. 이 코드는 구조적이지 않습니다\.

해당 코드에서는 비동기에 대한 결과를 알려주는 것을 Completion Handler를 통해 알려주는 패턴을 사용하기 때문에 언제 데이터가 올지 모르며 error, throw를 할 수 없고 동일한 비동기 동작을 수행하기 위한 반복문을 사용할 수 없다\.

→ 제어 흐름으로서의 에러 처리, response가 아닌 ` 그저 에러를 던지고, 그것만 처리하는거에 초점을 맞춤. `

→ 함수의 배열 안에 있는 url과 매칭되는 딕셔너리를 만들어서 Completion Handler에 넘겨줘야 그걸 처리하던 말던 하는데 그러려면 중첩\. 재귀를 사용해야함\. 하지만 재귀함수를 사용할 수 없다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-005.png>)

이런식으로 async / await를 사용하여 구조화된 프로그래밍 코드를 작성할 수 있다\.

하지만 이렇게 하면 문제가 있다\.

다운로드할 이미지가 엄청 많다면 비동기로 동작을 하긴 하는데 순차적으로 하나씩 이미지를 다운받는다\. 

또한 이미지를 고정 크기가 아닌 다른 URL에서 다운로드를 한다면 어떻게 해야할 것인가?

이제 우리는 concurrency를 추가할 수  있으므로, 여러 다운로드를 병렬적으로 할 수 있다\. 이를 하기 위해서는 프로그램에 Addition Task를 생성할 수 있다\.

## Task

Task는 비동기 함수와 함께 동작하는 Swift의 기능이다\. 비동기 코드를 실행하기 위한 새로운 실행 context를 제공하며, 각각의 Task는 다른 실행 context와 동시에 실행된다\. 즉, Task는 App의 ` 실행 컨텍스트(작업 플로우) `를 나타낸다\.

` → 그냥 작업을 실행할 새로운 명세서를 던져주는 느낌? 이슈파고 브랜치까지 느낌?으로 이해하면 될 것 같습니다. `

안전하고 효율적인 타이밍에 병렬로 작업이 실행되도록 자동으로 스케쥴링이 된다\. 한 가지 주의할 점은 비동기 함수를 호출한다고 해서 새로운 Task가 생성되는 것이 아니라, Task는 명시적으로 생성해줘야 한다는 점이다\.

구조적인 동시성 프로그래밍은 유연성과 단순성 사이에서의 균형을 적절하게 이루는 것에 관한 것이기 때문에 Swift에는 몇가지 다른 Task가 있다\.

### Async\-let tasks

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-006.png>)

우리가 기본적으로 사용하고 있던 ` let Binding `이다\. 

```swift
 let (data, response) = try await URLSession.shared.data(for: request)
```

위 코드의 경우 URLSession의 비동기 처리가 다 끝난 후 data와 response에 값을 할당한 후에 다음 코드를 실행하는 플로우로 흘러간다\. 때문에 비동기 처리가 오래 걸리는 작업의 경우 성능이 떨어질 수 있다\.

우리는 이 플로우에서 다운로드 시간이 오래 걸릴 수 있으니 프로그램이 다운로드를 시작하고 데이터가 실제로 필요할 때까지 다른 작업을 하길 원한다\. 따라서 우리는 ` concurrent binding `을 사용한다\. 

```swift
 async let (data, response) = URLSession.shared.data(for: request)
```

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-007.png>)

concurrent binding의 동작은 다음과 같다\.

1. Swift가 새로운 child task를 만든다\.
1. child task는 비동기 작업을 수행하고, parent task는 placeholder value를 변수에 할당한다\.
1. child task가 비동기 작업을 수행하는 동안 parent task는 이후 작업을 수행한다\.
1. 결과값이 실제로 필요한 상황이 오면, parent task는 child task의 작업이 완료될 때 까지 기다린다\.

> 💡 <strong>좋은 비유</strong>
> 
> placeholder value \- 개집
> child task 결과 \- 개
> 
> Child task가 끝나면 개집에 개가 들어간다\.
> 
> 1\. ` 엄마(Parent task) `가 ` 아들(Child task) `에게 ` 개를 찾아오라(비동기 작업) `고 시킨다\.
> 2\. 엄마는 아들이 개를 찾아올 동안에 ` 개집(Placeholder) `을 준비해놓고, 그밖의 다른 집안일도 한다\.
> 3\. 아들이 ` 개을 찾아오면(비동기 작업이 끝나고 결과값을 가져오면) ` 개를 개집에 넣는다\.

이렇게 concurrent binding을 적용하게 되면 다음과 같아진다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-008.png>)

async\-let을 사용하는 경우 비동기 작업이 다 끝나고 할당하는 변수를 읽는 곳에 try await을 붙여줘야 한다\.

` → 뭐야 이거 약간 조삼모사? 돌려막기? 그런거랑 비슷한데?  `

try await를 하는 쪽에서 Error나 Suspend가 Observing 된다\.

따라서 이제 다운로드는 Child Task들에서 동시에 발생한다\. Error나 Suspend가 Child Task에서 발생하지 않고 Parent Task와 Child Task가 동시에 Binding한 값을 실제로 쓰는 부분에서 Observing된다\.

### Structured task guarantees

위의 코드를 예시로 들면 data를 가져오는 child task, metadata를 가져오는 child task 두개가 만들어진다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-009.png>)

이렇게 두개의 child task가 만들어지면, 이들은 현재 함수가 실행중인 Task의 자식이 된다\. 즉 이들의 수명은 해당 함수의 범위로 지정이 될 수 있다\.

Task Tree는 트리구조이기 때문에 하위 child Task가 모두 완료되어야지 상위 Parent Task가 완료될 수 있다\.

이러한 상태에서 만약 metadata를 읽는 중에 error가 발생했다면 어떻게 될까?

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-010.png>)

만약 metadata를 읽는 중에 error가 발생했다면, parent task가 즉시 종료되는 것이 아닌 다른 child task\(위에서는 data가 되겠네요\.\)를 cancel 상태로 표시한 후에 해당 작업이 완료될 때 까지 기다린다\.

→ data를 읽는 child task가 cancel되면 해당 task의 하위 task도 모두 cancel 된다\.

task가 cancel 상태라고 해서 task가 중단이 되는 것이 아니라 task의 결과가 더이상 필요하지 않다라는 것을 표시한다\.

정리하면,

상위 Task에서 Error가 발생하면 하위 Task와 상위 Task 모두 Cancel 상태가 된다\.

모든 Task가 Cancel되거나 Finish되면 호출한 Function도 모두 끝나길 기다리다가 에러를 방출하며 종료된다\.

> 💡 <strong>좋은 비유</strong>
> 
> 1\. ` 엄마(Parent task) `가 ` 아들1(Child task1) `에게 ` 개를 찾아오라(비동기 작업) `고 시킨다\.
> 2\. 그리고 엄마는 ` 아들2(Child task2) `에게 ` 개밥을 준비하라(비동기 작업) `고 시킨다\.
> 3\. 엄마는 아들이 개를 찾아올 동안에 ` 개집(Placeholder) `을 준비해놓고, 그밖의 다른 집안일도 한다\.
> 4\. 아들이 ` 개를 못찾아왔다…(에러)
>  `5\. 개밥을 준비하는 아들 캔슬\(그만두는게 아니라, 어차피 개밥 준비해도 안쓴다\.\)
> 6\. 에러 방출

### Task Cancellation

Task는 cancel 됐다고 해서 곧바로 종료되는 것은 아니다\. 

현재 task 어디에서든 cancel 상태를 알 수 있다\.

작업이 긴 task의 경우에는 cancel을 염두에 두고 구현해야 한다\.

Task가 어떻게든 에러가 나서 Cancel이 될 수 있다고 해보자\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-011.png>)

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-012.png>)

우리는 이렇게 Task\.checkCancellation\(\)을 사용하여 cancel이 됐을 때 에러를 던질 수도 있고,

Task\.isCancelled를 사용해서 도중에 멈추게 할 수도 있다\.

### Group tasks

Group tasks는 async\-let tasks보다 더 많은 유연성을 제공한다\.

async\-let은 비동기 처리할 작업의 수가 고정적일 때 유용하다\.

아래 코드를 보면 반복문\(for id in ids\)을 돌면서 비동기로 얻은 UIImage를 Dictionary에 넣어주기 때문에 비동기 작업이 끝나야지 즉,

async let \(data, \_\) = URLsession ~

async let \(metadata, \_\) = URLSession ~ 가 끝나야지만 다음 루프가 반복된다\. 즉 비효율적이라는 소리다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-013.png>)

하지만 모든 썸네일을 동시에 가져오는 작업을 시작하도록 하려면 어떻게 해야할까? 그러면 동시성의 양은 배열의 ID 수에 따라 달라지므로 정적으로 알 수 없다\.

→ 여기서는 ids라는 정적 배열이 있지만, 루프가 몇 개 돌지도 모르고 만약 그게 엄청 많아진다는 전제하에\.

이런 상황에서 대응할 수 있는게 Task Group이다\.

Task Group은 ` 동적인 양의 비동기 작업의 수가 결정 되었을 때 동시성을 제공 `하도록 설계된 구조적 프로그래밍의 한 형태이다\.

` withThrowungTaskGroup ` 클로저 안의 group을 사용해서 동적으로 task를 추가할 수 있다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-014.png>)

group\.async method를 통해서 에러를 던질 수 있는 Child Task를 만들 수 있다\. group을 나가면 Task의 수명이 다하고, group 블록 안에 for\-in\-loop를 배치했기 때문에 동적인 양의 Task를 동시에 생성할 수 있다\. 

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-015.png>)

하지만 이대로는 Data\-race 이슈가 발생\. thumbnail 딕셔너리는 한번에 두 개 이상의 액세스를 처리할 수 없는데 group 블록 안에서 여러개의 Task가 많이 생겨나기 때문에 컴파일 에러가 발생한다\. 

이러한 Data\-race를 예방하려면 다음을 지켜야 한다\.

Task가 수행할 작업의 클로저가 @Sendable 타입이여야 된다\.

> 💡 💡<strong>@Sendable</strong>
> 
> 하나의 concurrency domain에서 다른 domain으로 sendable type을 안전하게 pass 할 수 있도록 해준다\. 쉽게 말해서 concurrency 홤경에서 안전하게 공유될 수 있는 타입\.

@Sendable 클로저 내부에서 클로저가 시작된 후 수정될 수 있는 변수를 캡처하면 안된다\. 왜냐하면 캡쳐된 변수가 Task가 실행된 후 수정될 수 있기 때문이다\.

그렇기 때문에 Task안에서 캡쳐된 값은 공유하기에 안전한 value Type, actor, 자체 동기화를 구현한 클래스 객체 같은 것들이어야 한다\.

위의 코드는 클로저가 시작되고서 수정될 수 있는 변수를 캡쳐했기 때문에 Data\-race가 발생할 수 있다\. 따라서 다음과 같이 수정하면 된다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-016.png>)

1. child task에서 Dictionary를 직접 수정하지 않고 parent task가 처리할 데이터를 한 번에 만들어서  return 한다\.
1. parent task가 처리할 데이터 타입을 정의한다\.
1. parent task에서 for\-await를 사용해서 순차적으로 child task한테 데이터를 전달받을 때마다 Dictionary를 수정한다\. 이는 순차적으로 돌아가기 때문에 Data\-race로부터 안전하다\.

만약에 에러가 발생하면 async\-let 처럼 종료되지 않고 cancel, wait 하다가 함수가 종료될 때 같이 끝난다\.

### Unstructured tasks

async\-let이나 TaskGroup처럼 항상 명확한 계층 구조에 속한 작업만 있는 것은 아니다\. 훨씬 더 많은 수동관리가 필요한 대신 유연성을 제공하는 Unstructured한 방식이 있다\.

#### Not all tasks fit a structured pattern

structured task를 사용할 수 없는 상황이 여럿 있다\. 

- 비동기 코드에서 비동기 task를 하기 위한 parent task가 없을 수 있다\.
- task 생명주기가 특정 scope나 특정 함수에 제한되지 않을 수 있다\.
   → 객체를 active 상태로 전환하는 메소드 호출에 대한 응답으로 Task를 시작한 다음 객체를 deactivate 상태로 전환하는 메소드 호출에 대한 응답으로 Task를 취소하고 싶을 수도 있다\.

이런 상황은 주로 UIKit의 delegate 패턴에서 발생한다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-017.png>)

CollectionViewCell에 네트워크에서 가져온 썸네일을 가져와서 띄우려고 한다\. 하지만 Delegate는 비동기 함수가 아니기 때문에 Delegate 안에서 await 함수를 호출할 수 없다\. 메인 스레드에서 동작하기 때문에 await할 수 없기 때문이다\.

UI작업은 메인 스레드에서 발생해야 하기 때문에, Swift는 @MainActor라고 표기함으로써 이걸 보장한다\. 만약 우리가 Delegate 메서드 안에서 Task를 생성하면, 우리는 이 Task가 메인 스레드에서 실행되길 원한다\. 이럴 땐 아래처럼 async Task 클로저 안에 비동기 작업을 넣어서 Unstructured task를 생성할 수 있다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-018.png>)

Task를 생성하는 시점에 도달하면 Swift에서 자동으로 스케줄링 한다\. 즉 썸네일을 받아오는 Task는 Delegate 함수 안에서 메인 스레드를 차단하지 않고 기회가 있을 때 메인 스레드 자체에서 실행된다\. 이런식으로 Task를 실행하면 구조화된 코드와 구조화 되지 않은 코드 사이의 중간지점을 제공할 수 있다\. 

#### Unstructured task 특징

이렇게 직접 생성한 Task는 다음과 같은 특징을 가진다\.

- 직접 생성된 Task는 이미 시작되어있는 Actor를 상속하며, Group Task, async\-let과 마찬가지고 original Task의 우선순위 및 기타 특성도 상속한다\.
- 생명주기가 범위에 상속되지 않는다\.
- 어디서나 만들 수 있다\. 심지어 비동기 함수가 아니여도 만들 수 있다\.
- cancel과 error가 자동으로 전파되지 않으며, 명시적인 조치를 취하지 않는 한 자동으로 await 하지 않는다\.

#### cancel과 error를 명시해줘야 한다\.

위의 코드에서 collectionView를 표기할 때 썸네일이 다운로드 되서 표기가 되기 전에 아래로 스크롤을 하게 되면 해당 Task도 취소해야한다\. 위의 코드의 Task는 unscoped task이기 때문에 Task cancel이 자동이 아니기 때문에 명시적으로 넣어주어야 한다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-019.png>)

이런식으로 저장해 두었다가

\(defer은 자신의 실행을 맨 마지막으로 미루는 것을 뜻한다\. 근데 마지막에 nil은 왜하지?\)

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-020.png>)

이렇게 cancel 시킬 수 있다\.

### Detached tasks

완전한 자율성을 위해서 아무것도 상속하고 싶지 않은 Task도 있다\.

cancel, await를 manually하게 관리해줘야 하며 lifeTime이 unscope하다\. 

예를 들어 서버에서 썸네일을 가져온 후 나중에 가져오려고 할 때 네트워크에 다시 연결되지 않도록 로컬 디스크 캐시에 기록하려고 한다고 가정해보자\. 캐싱은 메인 액터에서 발생할 필요가 없으며 모든 썸네일 가져오기를 취소하더라도 가져온 썸네일을 캐시하는 것이 유용하다\.

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-021.png>)

## Task 정리

![](<../../assets/blog/wwdc-explore-structured-concurrency-in-swift-1160d0f75cd6805b9766cefc9fdf3984/image-022.png>)

정해진 수의 child task가 필요하다면 async\-let tasks를 사용한다\.

child task의 수가 동적으로 정해져 있다면 task group을 사용한다\.

origin context와 연관되었지만 scope에 종속되지 않았다면 unstructured task을 사용한다\.

origin context로부터 아무것도 상속받고 싶지 않다면 detached task을 사용한다\.

## 참고

<a class="notion-resource-card" href="https://velog.io/@yoosa3004/iOSWWDC-Explore-structured-concurrency-in-Swift#-1"><span class="notion-resource-label">링크</span><span>https://velog.io/@yoosa3004/iOSWWDC-Explore-structured-concurrency-in-Swift#-1</span></a>

<a class="notion-resource-card" href="https://phillip5094.tistory.com/266"><span class="notion-resource-label">링크</span><span>https://phillip5094.tistory.com/266</span></a>

---
schemaVersion: 2
title: "WWDC) Data Flow Through SwiftUI"
description: "SwiftUI에서는 데이터가 1급 시민입니다."
tags: ["SwiftUI", "상태 관리"]
publishedAt: "2024-08-27T07:14:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 19
---

## What is Data?

SwiftUI에서는 데이터가 1급 시민입니다\.

데이터는 UI를 구동하는 모든 정보들이라고 얘기할 수 있습니다\.

데이터에는 다양한 종류와 모양이 있습니다\.

ex\) 토글의 상태와 같은 UI 상태, 메세지 목록과 같은 List가 있을 때 이를 구동하는 모델

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-001.png>)

## SwiftUI를 이해하기 위한 두가지 원칙

### 뷰에서 데이터를 읽을 때마다, 뷰에는 데이터에 대한 의존이 발생

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-002.png>)

데이터가 변경될 때마다, 새 값을 반영하기 위해 뷰가 변경되어야 하기 때문에 이는 종속성을 만들게 됩니다\.

지금까지는 이 작업을 코드로 직접 처리했지만, SwiftUI에서는 더이상 데이터와 뷰의 동기화를 우리가 해줄 필요가 없습니다\. SwiftUI는 선언적 프로그래밍을 따르며, SwiftUI에서의 Data Dependency\(데이터에 대한 의존성\) 역시 선언적 프로그래밍을 따릅니다\. 

→ 알아서 데이터의 변경을 감지하고 UI의 갱신 명령을 내립니다\.

### 뷰의 계층에서 읽어들이는 모든 데이터들은 Source Of Truth를 가진다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-003.png>)

Source Of Truth\(SOT\)는 View 계층 안에 살아있습니다\.

이 말은 뷰에서 읽는 모든 데이터들은 결국 하나의 원천을 가지고 있다는 뜻입니다\.\(SSOT\)

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-004.png>)

만약 데이터가 중복되어 존재할 경우\(복제\) 항상 싱크를 맞춰줘야하므로, 일관성있는 UI를 유지하기 힘들며, 버그가 발생할 수 있습니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-005.png>)

데이터를 한 곳으로 모은 다음에 두개의 다른 뷰가 참조를 하게 한다면 데이터의 정합성, 일관성을 지킬 수 있습니다\.

## 실전에서 볼 수 있는 Data Flow

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-006.png>)

이렇게 하면 이제 에러가 뜰껍니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-007.png>)

PlayerView는 Struct, 즉 값타입이기 때문에 내부에서 프로퍼티 값이 변경될 수가 없기 때문에 해당 에러가 뜨는 겁니다\(이는 struct의 프로퍼티의 값을 변경할 수 없는 이유와 동일합니다\.\)

→ Swift에서는 mutating을 명시함으로써 이 함수 안에서는 Self의 상태가 변경될 수 있다는 것을 시스템에게 알려줍니다\.

이와 유사하게 SwiftUI에서도 내부값을 변경할 수 있게 @State라는 Property Wrapper를 적용합니다\.

### @State

구조체 내부에 @State 프로퍼티 래퍼를 적용하여 “이 프로퍼티는 값이 변경될 수 있으며, 이 값에 따라 상태도 변경될 수 있다”고 시스템에게 알려줄 수 있습니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-008.png>)

@State를 붙인 isPlaying 프로퍼티는 SwiftUI의 Persistent storage\(영구적인 저장공간\)에 할당되며, 시스템은 그것을 의존성으로써 추적합니다\. 

→ 시스템이 저장공간을 만들어주는거기 때문에 초기값이 필수적입니다\.

@State 프로퍼티 래퍼가 붙은 프로퍼티는 같은 뷰에 여러번 업데이트가 되어도 그 저장공간을 계속 유지하고, \(그래서 private가 붙으면 좋은겁니다\.\) SwiftUI는 @State값을 계속 추적하여 값이 변경되면 뷰의 랜더링이 달라져야 한다는걸 알고 있습니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-009.png>)

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-010.png>)

그림과 같이 유저가 버튼과 상호작용하여 isPlaying 변수가 바뀌었다면,

뷰 자신과 자식 뷰들의 Body가 모두 새롭게 랜더링됩니다\. 단 View의 상태가 변경된 부분만 다시 랜더링 해주기 때문에 효율적입니다\.

이것이 “프레임워크가 종속성을 관리해준다”는 것입니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-011.png>)

State를 정의할 때 마다, 뷰가 소유하는 Source of truth가 새롭게 하나 정의된다는 것입니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-012.png>)

뷰는 더이상 연속된 이벤트의 집합이 아닙니다\. 상태를 가지는 함수입니다\.

이전에는 유저의 인터렉션이 발생할 때 마다 직접 서브뷰를 추가/제거 하거나 뷰의 알파값을 변경하는 코드를 실행하는 방식으로 구동했었습니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-013.png>)

SwiftUI에서는 단순히 State을 변경하면 됩니다\. State가 Source of  truth로써 동작하여, 자연스럽게 뷰가 변경됩니다\.

→ SwiftUI의 선언적 구문이 빛나는 부분

### @Binding

우리는 여러개의 재사용 가능한 컴포넌트로 UI를 구성합니다\. 

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-014.png>)

이부분을 따로 빼서 새로운 컴포넌트로 만들면

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-015.png>)

이렇게 State로 선언을 해버리면 새로운 Source of truth가 생성이 됩니다\. 

이 State 변수는 SuperView인 PlayerView와 싱크가 되어있어야 합니다\. 

isPlaying은 한번에 한곳에만 존재하면 되는 데이터입니다\. 우리는 단순히 PlayerView가 소유하고 있는 isPlaying 변수의 값을 읽고 변경하기만 하면 됩니다\.

즉 SuperView인 PlayerView의 isPlaying State를 참조하기만 하면 되는거죠\.

이때 사용하는게 Binding입니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-016.png>)

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-017.png>)

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-018.png>)

기존의 방식에서는 뷰 컨트롤러의 서브뷰들이 동일한 프로퍼티를 들고있고, 뷰 컨트롤러에서 데이터의 값이 변경되면 자신의 모든 서브뷰들의 싱크를 맞춰주는 작업을 했었습니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-019.png>)

바인딩을 사용하면 Source of truth에 대한 명시적인 의존을 소유 없이 사용할 수 있습니다\.

오직 하나의 데이터값만 관리하면 되는거에요\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-020.png>)

SwiftUI에서 제공해주는 컴포넌트에서도 바인딩이 여럿 들어가있는 것을 볼 수 있습니다\.

## Working With External Data

외부에서의 변화가 발생하는 경우에는 어떤 것들이 있고, 어떠한 결과를 낳는지 알아봅시다\.

Time Fired → State 변경

Notifiaction → State 변경

그 외 등등 → State 변경

뭐야 결국 State 변경으로 이어지네? 

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-021.png>)

SwiftUI에서는 이러한 외부 이벤트를 Publisher라고 통칭합니다\. Publisher는 Combine Framework로부터 발생됩니다\.

#### 외부에서 변화가 있다면?

Combine :  시간에 따라 값을 처리하기 위한 통합적이고 선언적인 API

```swift
struct PlayerView: View {
 let episode: Episode
 @State private var isPlaying: Bool = false
 @State private var currentTime: TimeInterval = 0.0
 
 var body: some View {
  VStack {
   // ...
   Text("\(playhead, formatter: currentTimeFormatter)")   
  }
  .onReceive(PodcastPlayer.currentTimePublisher) { newCurrentTime in
   self.currentTime = newCurrentTime
  }
 }
}
```

퍼블리셔를 미리 만들어두고, 퍼블리셔로 OnReceive 모디파이어에 전달해서 사용합니다\.

퍼블리셔에서 방출하는 값을 클로저에서 처리해주면 끝입니다\.

#### 외부에 데이터가 있다면?

ObservableObject: 이미 소유/관리중인 모델이 있을 경우, 이 모델과 뷰의 동기화를 편하게 만들어주는 프로토콜\.

→ 데이터가 변경되었을 때 그 상태를 알릴 필요가 있는 모델이라면 ObservableObject 프로토콜을 채택하게 하면 됩니다\.

ObservableObject 프로토콜이 요구하는 것은 데이터가 변경되었을 때를 위한 Publisher이며, objectWillChange 프로퍼티에 이 Publisher를 정의해두어야 합니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-022.png>)

```swift
class PodcastPlayerStore: ObservableObject {
    
    // ...
    
    var objectWillChange = PassthroughSubject<Void, Never>()
    
    func advance() {
        self.currentEpisode = nextEpisode
        self.currentTIme = 0.0
        // Notify subscribers that the player changed
        self.objectWillChange.send()
    }
}
```

objectWillChange 프로퍼티에 PassthroughSubject라는 Publisher를 하나 정의하고, 데이터의 변경이 일어나는 advance 함수에서 send를 호출해준다\. 이 Publisher를 subscribe하여 데이터의 변경 시점을 정확히 알 수 있게 됩니다\.

→ 언제 뷰를 업데이트 해야할지 알게 됩니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-023.png>)

뷰의 ObservedObject라는 프로퍼티 래퍼를 사용하여 ObservableObject 모델에 의존할 수 있습니다\.

```swift
struct MyView: View {
    @ObservedObject var model: PodcastPlayerStore
    ...
}

MyView(model: modelInstance)
```

이런식으로 하면 됩니다\.

## EnvironmentObject

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-024.png>)

environmentObject를 통해 사용하고 View에서 @Environment 프로퍼티 래퍼를 붙여서 의존성을 정의할 수 있습니다\.

### 언제 ObservedObject를 쓰고 언제 EnvironmentObect를 쓸까요?

기본적으로 ObservedObject를 쓰면 모델이 변경되었음을 여러 뷰를 거치며 전달해야합니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-025.png>)

모델 변경시에 특정 뷰들이 업데이트 되어야한다면 이것은 낭비겠지요…

이럴때 EnvironmentObject를 사용하면 깔끔하게 처리할 수 있습니다\.

![](<../../assets/blog/wwdc-data-flow-through-swiftui-03d9b635f2624f33bd5a666474d713c1/image-026.png>)

## 정리

@State

- 값타입
- 뷰의 로컬 데이터
- 뷰가 소유되고 관리해야하는 데이터

ObservableObject

- 참조타입
- 이미 관리하고 있는 데이터에 적용하면 좋음
- 외부로부터의 데이터를 표현할 때

## 참고

<a class="notion-resource-card" href="https://woozoobro.medium.com/wwdc-%EC%B1%99%EA%B2%A8%EB%B3%B4%EA%B8%B0-data-flow-through-swiftui-c03ed1302165"><span class="notion-resource-label">링크</span><span>https://woozoobro.medium.com/wwdc-챙겨보기-data-flow-through-swiftui-c03ed1302165</span></a>

<a class="notion-resource-card" href="https://wlaxhrl.tistory.com/91"><span class="notion-resource-label">링크</span><span>https://wlaxhrl.tistory.com/91</span></a>

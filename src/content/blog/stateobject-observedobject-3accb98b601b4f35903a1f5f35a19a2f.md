---
schemaVersion: 2
title: "StateObject \u0026 ObservedObject"
description: "StateObject"
category: "미분류"
categorySlug: "uncategorized"
tags: ["SwiftUI", "상태 관리"]
publishedAt: "2024-08-27T07:14:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 19
---

## StateObject

Observable object를 생성하는 프로퍼티 래퍼 타입\.

## Overview

뷰 계층에 저장한 참조 타입에 대한 SSOT로써 state object를 사용해라\. ObervableObject를 채택하는 초기 값을 제공하고 @StateObject를 프로퍼티 선언에 적용해서 App, Scene 또는 View에 state object를 생성해라\. SwiftUI가 제공하는 저장소 관리와 충돌을 일으킬 수 있는 멤버와이즈 생성자로부터 클래스를 세팅하는 것을 막기 위해 private로 state object를 선언해라:

```swift
class DataModel: ObservableObject {
    @Published var name = "Some Name"
    @Published var isEnabled = false
}


struct MyView: View {
    @StateObject private var model = DataModel() // Create the state object.


    var body: some View {
        Text(model.name) // Updates when the data model changes.
        MySubView()
            .environmentObject(model)
    }
}
```

SwiftUI는 state object를 선언하는 컨테이너의 라이프타임 동안 오직 한 번만 모델 객체의 새 인스턴스를 생성한다\. 예를 들어, SwiftUI는 뷰의 입력이 변한다고 해도 새 인스턴스를 생성하지 않지만, 뷰의 ID가 변경되면 새 인스턴스를 만듭니다\. Observable object의 published 프로퍼티가 바뀔 때, SwiftUI는 그 프로퍼티를 의존한 모든 뷰를 업데이트한다\. 위의 텍스트 같이\.

> **Note**
> 만약 구조체, 문자열, 정수와 같은 값 타입을 저장하고 싶으면, State 프로퍼티 래퍼를 대신 사용해라\. 또한 Observable\(\) 프로토콜을 채택하는 참조 타입을 저장하고 싶어도 State를 써라\. To learn more about Observation in SwiftUI, see [Managing model data in your app](<https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app>)\.

### Share state objects with subviews

ObservedObject 속성을 가지는 프로퍼티를 통해 하위 뷰로 state object를 넘겨줄 수 있다\. 대안으로, 아래의 MySubView 같이 뷰에 enviromentObject\(\) modifier를 적용해서 뷰 계층의 환경에 객체를 추가해라\. EnviromentObject 속성을 사용해서 MySubView 또는 모든 하위 뷰 안에 객체를 읽을 수 있다\.

```swift
struct MySubView: View {
    @EnvironmentObject var model: DataModel


    var body: some View {
        Toggle("Enabled", isOn: $model.isEnabled)
    }
}
```

$를 사용해서 state object의 프로퍼티에 Binding을 줘라\. 양방향 연걸을 만들고 싶을 때 Binding을 사용해라\.

### Initialize state object using external data

State object의 초기 상태가 그것의 컨테이너 외부로부터 오는 데이터에 의존할 때, 컨테이너의 생성자 내에서 객체의 생성자를 명시적으로 호출할 수 있습니다\. 예를 들어, 이전 예제의 데이터 모델이 생성 중에 이름을 입력하고 뷰의 외부에서 오는 이름에 대한 값을 사용하고 싶다고 가정해봅시다\. 뷰를 위해 만든 명시적 생성자 내부의 state object의 생성자를 호출하여 이 작업을 할 수 있습니다\.

```swift
struct MyInitializableView: View {
    @StateObject private var model: DataModel


    init(name: String) {
        // SwiftUI ensures that the following initialization uses the
        // closure only once during the lifetime of the view, so
        // later changes to the view's name input have no effect.
        _model = StateObject(wrappedValue: DataModel(name: name))
    }


    var body: some View {
        VStack {
            Text("Name: \(model.name)")
        }
    }
}
```

이걸 쓸 때 주의해라\. SwiftUI는 주어진 뷰에 state object의 생성자를 호출한 첫 시점에 state object를 생성한다\. 이것은 뷰의 입력 변경이 일어나도 객체가 안정적인 저장소를 제공하도록 보장한다\. 그러나, state object를 명시적으로 초기화하면 예상치 못한 동작이나 원치 않는 부작용이 발생할 수 있습니다\.

위의 예에서, MyInitializableView에 입력된 이름이 바뀌면, SwiftUI는 뷰의 생성자를 새 값으로 재실행합니다\. 그러나, SwiftUI는 state object의 생성자를 처음 호출할 때만 state object의 생성자에 제공하는 오토 클로저를 실행하므로 모델의 저장된 이름 값은 변경되지 않습니다\.

명시적 state object 생성자는 객체가 의존하는 외부 데이터가 객체 컨테이너의 주어진 인스턴스에 대해 변경되지 않을 때 잘 작동합니다\. 예를 들어 상수 이름이 다른 두개의 뷰를 만들 수 있습니다\.

> **Important**
> 생성 가능한 state object의 경우에도, private로 선언해라\. 이렇게 하면 뷰의 멤버와이즈 이니셜라이저를 통해 실수로 매개 매개변수를 설정할 수 없습니다\. 왜냐하면 그렇게 하면 프레임워크의 저장소 관리와 충돌하고 예상치 못한 결과를 초래할 수 있기 때문입니다\.

### Force reinitialization by changing view identity

만약 SwiftUI가 뷰의 입력이 바뀔 때 state object를 다시 생성하고 싶을 때, view ID를 동시에 바뀌라\. 사용중인 id\(\) modifier 사용하여 변경되는 값에 바인딩 하는 것입니다\. 예를 들어, 이름 입력이 변경될 때 MyInitializableView 인스턴스의 ID가 변경되도록 할 수 있습니다:

```swift
MyInitializableView(name: name)
    .id(name) // Binds the identity of the view to the name property.
```

> **Note**
> 만약 뷰가 내부에 ForEach를 가진다면, 뷰는 해당 데이터 요소의 ID를 사용하는 id\(\) Modifier를 암시적으로 받습니다\.

만약 하나 이상의 값의 변경사항게 기반하여 상태를 재생성하고 싶다면 Hasher를 사용한 단일 ID에 값을 결합할 수 있다\. 예를 들어, 만약 name이나 isEnabled의 값이 병경 될 때 MyInitializableView에 데이터 모델을 업데이트 하고 싶다면, 단일 해시에 두 변수를 결합할 수 있다:

```swift
var hash: Int {
    var hasher = Hasher()
    hasher.combine(name)
    hasher.combine(isEnabled)
    return hasher.finalize()
}
```

그러고 나서 ID로써 뷰에 결합된 해시를 적용해라:

```swift
MyInitializableView(name: name, isEnabled: isEnabled)
    .id(hash)
```

매번 입력이 변경될 때마다 state object를 재성성하는 것의 성능에 유념해라\. 또한 뷰의 id를 바꾸는 것은 사이드 이펙트를 가질 수 있다\. 예를 들어, SwiftUI는 동시에 뷰의 ID가 바뀐다면 뷰 내부의 변경 사항을 자동으로 애니메이션화 하지 않습니다\. 또한, ID를 바꾸면 State, FocusState, GestureState 등으로 관리하는 값을 포함한 뷰가 보유한 모든 상태가 재설정됩니다\.

## ObservedObject

**observable object를 구독하고 observable object가 바뀔 때마다 뷰를 무효화하는 프로퍼티 래퍼**

## Overview

입력이 ObservableObject일 때와 객체의 Published 프로퍼티가 바뀔 때마다 뷰를 업데이트하길 원할 때 SwiftUI View의 파라미터에 @ObservedObject를 추가해라\. 보통 하위 뷰에 StateObject를 넘겨줄 때 이것을 쓴다\.

아래의 예시는 ObservableObject로써 데이터 모델을 정의하고, state object로 뷰에 보델을 생성하고, ObservedObject로 하위 뷰에 인스턴스를 넘겨준다:

```swift
class DataModel: ObservableObject {
    @Published var name = "Some Name"
    @Published var isEnabled = false
}


struct MyView: View {
    @StateObject private var model = DataModel()


    var body: some View {
        Text(model.name)
        MySubView(model: model)
    }
}


struct MySubView: View {
    @ObservedObject var model: DataModel


    var body: some View {
        Toggle("Enabled", isOn: $model.isEnabled)
    }
}
```

ObservableObject의 모든 Published 프로퍼티가 바뀔 때, SwiftUI는 그 객체에 의존하는 모든 뷰를 업데이트한다\. 하위 뷰는 또한 뷰 계층 구조 전반에 걸쳐 다른 관찰자에게 전파되는 위의 예의 토글과 같은 모델 속성을 업데이트 할 수 있습니다\.

observed object에 대한 기본 또는 초기 값을 특정하지 마라\. 위의 예에서와 같이 뷰의 입력 역할을 하는 프로퍼티에서만 이 래퍼를 사용해라\.

> **Note**
> @Observable 프로토콜을 채택하는 객체에 @ObservedObject를 쓰지 말아라\. SwiftUI는 자동적으로 body 내부에 사용된 @Observable 객체의 의존성을 추적하고 그 객체의 데이터가 바뀔 때 의존하는 뷰를 업데이트한다\. @Observable 객체를 @ObservedObject 객체로 감싸려고 시도하는 것은 컴파일 에러를 유발할 수도 있다\. 왜냐하면 ObservableObject 프로토콜을 채택한 객체에 ObservedObject를 쓸 수 있기 때문이다\.
> 
> 만약 body에 Observable 객체의 프로퍼티에 바인딩을 하고 싶다면, Bindable 프로퍼티 래퍼를 대신 써라; 예를 들어, @Bindable var model: DataModel 이런 식으로\. 더 많은 정보를 얻고 싶으면 [Managing model data in your app](<https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app>)\. 이거를 봐라

## 참고

<a class="notion-resource-card" href="https://velog.io/@minsang/SwiftUI-StateObject-ObservedObject-EnvironmentObject#%EC%A0%95%EB%A6%AC-2"><span class="notion-resource-label">링크</span><span>https://velog.io/@minsang/SwiftUI-StateObject-ObservedObject-EnvironmentObject#정리-2</span></a>

---
schemaVersion: 2
title: "MV패턴 날 것으로 이해하기 쉽게 정리하기- Swift Journey"
description: "각 화면마다 ViewModel이 생성되는데, 이는 새로운 SoT를 정의하는 것"
tags: ["SwiftUI", "아키텍처", "상태 관리"]
publishedAt: "2024-09-21T06:47:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 10
---

## MVVM 패턴의 문제점

각 화면마다 ViewModel이 생성되는데, 이는 새로운 SoT를 정의하는 것

→ 추가적인 SoT를 만들기 때문에 불필요한 복잡도를 만든다\.

그냥 SwiftUI 자체가 SoT가 있는데 뭐하러 또 만드냐 귀찮게 라는 뜻\.

## MV패턴

MV 패턴은 상태 관리를 간소화하고 보일러플레이트 코드를 줄이며 성능을 향상시키는 미니멀하고 간단한 접근 방식을 제공한다\. 

모델과 뷰 간의 단순성과 직접적인 데이터 바인딩을 강조하는 앱 아키텍쳐세 대한 미니멀리스트적 접근 방식\. 앱에서 데이터가 흐르는 방식에 대한 명확성을 유지한다\.

## MV패턴의 구조 \- MV layer

상단의 각 MV 묶음

View가 기존의 MVVM 패턴에서 View\+ViewModel 역할을 한다\.

View에서는 UI는 물론, View의 @State변수와 model, 그리고 View의 로직까지 갖고 잇다\.

### View\(뷰\)

UI를 담당하고 데이터가 사용자에게 어떻게 표시되는지 정의

#### @State 변수

```swift
 @State private var name = ""
 @State private var exampleName = ""
 @State private var errors = ExampleError()
```

#### Model\(View에서 선언 하는 것\)

```swift
 @EnvironmentObject private var model: Model
```

#### View에서만 사용하는 로직

```swift
extension ExampleView {
    var isFormValid: Bool {
        if name.isEmpty {
            errors.name = "Name cannot be empty!"
        }
        
        if exampleName.isEmpty {
            errors.exampleName = "Coffee name cannot be empty"
        }
        
        return errors.name.isEmpty && errors.exampleName.isEmpty
    }
        
    private func update(_ example: Example) async {
        try? await model.update(order)
    }
}

// 이처럼 View에 한정된 로직은 View 내에 함수나 연산 프로퍼티로 만든다.
```

코드가 길어지면 View 내부의 프로퍼티나 로직을 State로 묶을 수 있는 ViewState를 사용해보자\.

```swift
struct ExampleView: View {
    @State private var state = ExampleState()
    ...
}

struct ExampleState {
    var name = ""
    var exampleName = ""
    var errors = ExampleError()
    
    mutating func isValid() -> Bool {
        if name.isEmpty {
            errors.name = "Name cannot be empty!"
        }
        
        if exampleName.isEmpty {
            errors.exampleName = "Coffee name cannot be empty"
        }
        
        return errors.name.isEmpty && errors.exampleName.isEmpty
    }
}

//이렇게 하면 테스트를 하기도 유용하다.
```

재사용이 가능한 컴포넌트 뷰를 사용하고 싶다면 Reusable 뷰를 사용해보자\.

```swift
enum Events {
    case onChecked(Int)
    case onDelete(Int)
}

struct ContainerScreen: View {
    var body: some View {
        List(1...20, id: \.self) { index in
            PresenterView(index: index) { event in
                switch event {
                    case .onChecked(let index):
                        print(index)
                    case .onDelete(let index):
                        print(index)
                }
            }
        }
    }
}
// Container는 데이터를 fetch하거나, filter하는 등의 로직을 가지고 있다.

struct PresenterView: View {
    let index: Int
    let onEvent: (Events) -> Void
    
    var body: some View {
        HStack {
            Image(systemName: "square")
                .onTapGesture {
                    onEvent(.onChecked(index))
                }
            Text("\(index)")
            Spacer()
            Image(systemName: "trash")
                .onTapGesture {
                    onEvent(.onDelete(index))
                }
        }
    }
}
// Presenter는 어디서는 재사용 가능하게 model이 아닌 부모 뷰에서 데이터를 전달 받아야 한다.
```

### Model

에플리케이션의 데이터와 비즈니스 로직 구현, 도메인별로 로직이 있는 데이터 CRUD

#### Model Class

model은 class로 만든다\. data 관련된 코드가 들어있고, @Published 프로퍼티로 View와 바로 연결한다\.

Entity를 불러와서 사용한다\.

```swift
enum ModelError: Error {
    case custom(String)
}

@MainActor
class Model: ObservableObject {
    @Published var examples: [Example] = []
    
    let service: ExampleService
    
    init(service: ExampleService) {
        self.service = service
    }
    
    func sort() { ... }
    
    func filter() { ... }
    
    func get() async throws {
        self.examples = try await service.get()
    }
    
    func update(_ example: Example) async throws {
        guard let updated = try await service.update(example) else {
            throw ModelError.custom("Unable to update.")
        }
        
        guard let index = examples.firstIndex(where: { $0.id == updated.id }) else {
            return
        }
        
        examples[index] = updated
    }
}
```

#### Entity

Codable, Identifiable, Equatable 등을 준수할 Entity도 Model 레이어에 포함된다\.

```swift
struct Example: Codable, Identifiable {
    let id: String
    let name: String
    let exampleName: String
}
```

## MV패턴의 구조 \- Service layer

View의 상태가 없는 데이터 접근 레이어

API 서비스, 네트워크 통신에 해당하는 작업을 여기서 한다\.

```swift
enum ServiceError: Error {
    case badURL
}

struct Service {
    let baseURL: URL
    
    func get() async throws -> [Example] { ... }
    
    func update(_ example: Example) async throws -> Example? { ... }
}
```

#### Service layer에 포함되는 Network layer

<a class="notion-resource-card" href="https://www.hohyeonmoon.com/blog/swift-network-layer"><span class="notion-resource-label">링크</span><span>https://www.hohyeonmoon.com/blog/swift-network-layer</span></a>

## MV패턴의 구조 \- Core layer

SharedUI \- 디자인 시스템

Shared \- 공유 가능한 코드

Resources \- assets, localizables, fonts

Preview Content \- SwiftUI와 Test mocks

## MV패턴을 사용하는 경우는 언제일까?

중소 규모 애플리케이션 개발 \- MV는 간단해서 소규모 앱이나 프로토타입을 빠르게 빌드하려는 경우에 좋다\.

보일러플레이트 최소화 \- 코드의 양을 줄이고 여러 파일과 레이어를 관리하는 것을 피할때 사용한다\.

SwiftUI의 반응형 특성 활용 \- MV 패턴은 데이터와 상태를 관리하는 명확하고 간단한 방법을 제공한다\.

## MV패턴을 피해야하는 경우는 언제일까?

대규모 복잡한 애플리케이션 \- 앱이 커질수록 중간 계층이 없으면 코드가 밀접하게 결합되고 유지 관리가 어려워짐

높은 테스트 용이성 필요 \- 광범위한 테스트가 필요한 경우 비즈니스 로직이 분리되어 있지 않아 힘듬

복잡합 비즈니스 로직 처리 \- 코드 기반을 체계적으로 유지해야할 때는 다른 아키텍쳐가 적합할 수 있음

## <strong>결론</strong>

MV\(Model\-View\) 패턴은 SwiftUI의 선언적이고 반응적인 접근 방식과 잘 맞는 간단하고 가벼운 아키텍처를 제공합니다\. 단순성과 보일러플레이트 감소 측면에서 장점이 있지만, 특히 복잡성이 커짐에 따라 모든 애플리케이션에 적합하지 않을 수 있습니다\. 개발자는 MV 패턴을 효과적으로 사용하는 시기와 방법을 이해함으로써 SwiftUI의 기능을 활용하여 반응성이 뛰어나고 유지 관리가 가능한 애플리케이션을 쉽게 구축할 수 있습니다

## 참고

<a class="notion-resource-card" href="https://www.hohyeonmoon.com/blog/swiftui-mv-pattern"><span class="notion-resource-label">링크</span><span>https://www.hohyeonmoon.com/blog/swiftui-mv-pattern</span></a>

<a class="notion-resource-card" href="https://www.swiftyjourney.com/swiftui-architecture-a-complete-guide-to-the-mv-pattern-approach"><span class="notion-resource-label">링크</span><span>https://www.swiftyjourney.com/swiftui-architecture-a-complete-guide-to-the-mv-pattern-approach</span></a>

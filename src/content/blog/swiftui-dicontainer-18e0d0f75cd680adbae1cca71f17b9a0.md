---
schemaVersion: 2
title: "SwiftUI 앱에서 DIContainer를 적용할 때의 고민"
description: "SwiftUI에서 여러 서비스 객체를 화면마다 직접 생성하면 중복 선언과 강한 결합 때문에 테스트·유지보수가 어려워질 수 있다. DIContainer에 객체를 등록하고 프로토콜 타입으로 resolve하는 패턴과 프로퍼티 래퍼로 호출을 줄이는 방법을 살펴본다."
tags: ["Swift", "아키텍처"]
publishedAt: "2025-02-02T06:41:00.000Z"
updatedAt: "2026-11-12T04:00:00.000Z"
manuscriptPages: 9
---

SwiftUI에서 여러 서비스 객체를 화면마다 직접 생성하면 중복 선언과 강한 결합 때문에 테스트·유지보수가 어려워질 수 있다\. DIContainer에 객체를 등록하고 프로토콜 타입으로 resolve하는 패턴과 프로퍼티 래퍼로 호출을 줄이는 방법을 살펴본다\.

아래 구현은 등록한 인스턴스를 중앙에서 보관하는 간단한 예시다\. 코드의 핵심은 register·resolve·초기화 순서이며 실제 서비스명은 가상 이름을 사용한다\.

### DIContainer의 역할

### DIContainer란

<strong>Dependency Container</strong>라고 하며 의존성을 주입을 해주는 컨테이너를 만들어서 해당 컨테이너가 모든 인스턴스를 다 가지고 있고 다 관리를 한다는 취지입니다\.

Container에 필요한 인스턴스를 만들어놓고\(register\), 필요한 시점에 Conatiner에서 특정 타입의 인스턴스를 꺼내서 사용하는\(resolve\) 방식이라 생각하면 됩니다\.

### DIContainer의 주요 역할

DIContainer는 의존성을 관리하고 주입하기 위해 담아두는 컨테이너입니다\. 즉, 앱에서 사용하는 클래스나 서비스의 객체 인스턴스를 생성하고 컨테이너에 담아서 관리합니다\.

#### Register\(의존성 등록\)

DIContainer에 의존성을 등록합니다\. 일반적으로 프로토콜을 채택한 클래스 인스턴스와 해당 프로토콜을 등록합니다\.

```swift
diContainer.register(AccountService(), for: (any AccountServiceProtocol).self)
```

#### Resolve\(의존성 해결\)

등록된 의존성을 필요로 하는 객체를 주입합니다\. 해당 객체를 직접적으로 생성해서 주입하는 것이 아닌 DIContainer에 등록된 객체를 주입 받습니다\. Register와 마찬가지고 해당 프로토콜을 통해 해결합니다\.

```swift
diContainer.resolve(for: (any AccountServiceProtocol).self)
```

### 구현

### DIContainer\.swift

```swift
class DIContainer {
    private var container: [String: Any] = [:]
    
    func register<T>(_ instance: T, for type: T.Type) {
        container["\(type)"] = instance
    }
    
    func resolve<T>(for type: T.Type) -> T {
        guard let instance = container["\(type)"] as? T else {
            fatalError("\(type)으로 등록된 인스턴스가 DIContainer에 없습니다.")
        }
        
        return instance
    }
}
```

#### Container

해당 인스턴스를 타입\(프로토콜이나 메타타입\)을 키값으로 하여 딕셔너리로 관리합니다\.

#### Register\(\), Resolve\(\)

container에 특정 타입 또는 프로토콜에 해당하는 인스턴스를 등록\(register\)하고, 컨테이너에 저장된 특정 타입 프로토콜에 해당하는 인스턴스를 가져옵니다\.\(resolve\)

이 구현은 등록 누락 시 fatalError로 즉시 종료한다\. 누락을 빠르게 드러내는 선택이므로 resolve 전에 등록이 끝났는지 확인해야 한다\.

### AppEnvironment\.swift

```swift
struct AppEnvironment {
    static let diContainer = DIContainer()
    
    static func setupDependency() {
        diContainer.register(DummyService(), for: (any DummyServiceProtocol).self)
    }
}
```

#### setupDependency\(\)

앱에서 사용하는 서비스의 인스턴스를 DiContaner에 등록합니다\.

### App\.swift

```swift
import SwiftUI

@main
struct ExampleApp: App {
    init() {
        AppEnvironment.setupDependency()
    }
    ...
}

```

앱단에 들어가게 되면 DIContainer에 의존성을 주입하는 setupDependency\(\)를 실행하여 의존성를 등록합니다\.

### Injected\.swift

DIContainer에 의존성을 주입한 후에 각각의 View에서 필요로 하는 서비스를 resolve 할 때는 다음과 같이 resolve를 해줘야 합니다\.

```swift
private let dummyService = AppEnvironment.diContainer.resolve(for: DummyServiceProtocol.self)
```

위와 같이 AppEnvironment의 diContainer를 가져와서 하는 것이 불편하고, 하나의 View에서 여려 서비스를 가져와서 사용하게 될 경우에 중복된 코드가 발생할 수도 있습니다\. 따라서 의존성을 주입하는 코드를 프로퍼티 래퍼를 만들어서 정의할 수 있다\.

```swift
@propertyWrapper
struct Injected<T> {
    let wrappedValue: T
    
    init() {
        wrappedValue = AppEnvironment.diContainer.resolve(for: T.self)
    }
}

// ContentView.swift
struct ContentView: View {
    @Injected private var dummyService: any DummyServiceProtocol
    
    ...
}  
```

이런식으로 프로퍼티 래퍼를 사용하여 주입을 받게 되면 중복된 코드도 없어지고 가독성도 생깁니다\.

### 정리

DiContainer를 사용함에 따라 의존성 객체의 무분별한 선언을 막고, 자원의 낭비를 최소화 하고 의존성을 중앙 집중화하여 관리를 더욱 수월하게 할 수 있습니다\.

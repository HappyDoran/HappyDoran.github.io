---
schemaVersion: 2
title: "NavigationStack 화면전환 방법"
description: "iOS 16+부터 사용할 수 있는 NavigationStack을 이용한 라우터 로직"
tags: ["SwiftUI", "상태 관리", "아키텍처"]
publishedAt: "2024-08-27T07:35:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 3
---

iOS 16\+부터 사용할 수 있는 NavigationStack을 이용한 라우터 로직

## 하나의 Screen Enum타입을 이용한 라우팅

```swift
//NavigationManager.swift

enum PathType {
    case pageA
    case pageB
}

extension PathType {
    @ViewBuilder
    func navigationView() -> some View {
        switch self {
        case .pageA :
            PageAView()
        case .pageB :
            PageBView()
        }
    }
}

@Observable
class NavigationManager {
    static let shared = NavigationManager()
    
    private init() {}
    
    var path : [PathType] = []
}

extension NavigationManager {
    func Push(to pathType: PathType) {
        path.append(pathType)
        print(path)
    }
    
    func pop() {
        path.removeLast()
        print(path)
    }
    
    func popToRoot() {
        path.removeAll()
        print(path)
    }
}
```

라우터 코드입니다\. 모든 화면의 타입을 정의하고, 기본적인 기능만 가능하도록 정의했습니다\.

클래스의 인스턴스를 생성함으로써, 전역적으로 접근할 수있는 단일 인스턴스를 제공합니다\.

→ 싱글톤 패턴을 따릅니다\.

라우터로 인한 모든 화면을 정의하며, 실제로 이동될 뷰를 @ViewBuilder를 통해 정의합니다\.

```swift
import SwiftUI

@main
struct NavigationStackTestApp: App {
    @State private var navigationManager = NavigationManager.shared
    var body: some Scene {
        WindowGroup {
            NavigationStack(path: $navigationManager.path){
                ContentView()
                    .navigationDestination(for: PathType.self){ path in
                        path.navigationView()
                    }
            }
        }
    }
}
```

앱의 시작점입니다\. 라우터 인스턴스와 NavigationStack의 정의가 위치합니다\. 

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Button(action: {
                NavigationManager.shared.Push(to: .pageA)
            }){
                Text("Go to Page A")
            }
        }
        .padding()
    }
}
```

App\.swift 아래의 하위뷰는 기본적으로 정의해놓은 화면 전환 메소드를 통해서 Navigate가 가능합니다\.

<a class="notion-resource-card" href="https://nsios.tistory.com/199"><span class="notion-resource-label">링크</span><span>https://nsios.tistory.com/199</span></a>

<a class="notion-resource-card" href="https://nsios.tistory.com/210"><span class="notion-resource-label">링크</span><span>https://nsios.tistory.com/210</span></a>

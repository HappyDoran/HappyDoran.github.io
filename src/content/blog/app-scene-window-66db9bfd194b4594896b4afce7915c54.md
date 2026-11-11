---
schemaVersion: 2
title: "App, Scene, Window"
description: "Scenes, Apps 프레임워크를 추가해서 SwiftUI 만으로 모든 앱을 만들 수 있습니다."
category: "미분류"
categorySlug: "uncategorized"
tags: ["SwiftUI", "아키텍처"]
publishedAt: "2024-09-04T11:46:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 11
---

![](<../../assets/blog/app-scene-window-66db9bfd194b4594896b4afce7915c54/image-001.png>)

Scenes, Apps 프레임워크를 추가해서 SwiftUI 만으로 모든 앱을 만들 수 있습니다\.

## View, scene, and apps

### View

뷰는 아주 작은, 화면을 보여주는 요소입니다\. 우리가 아는 것처럼 화면을 구성하는 모든 UI컴포넌트 이미지, 레이블 등이 예시가 될 수 있습니다\.

![](<../../assets/blog/app-scene-window-66db9bfd194b4594896b4afce7915c54/image-002.png>)

### Scene

![](<../../assets/blog/app-scene-window-66db9bfd194b4594896b4afce7915c54/image-003.png>)

앱이 전체화면을 완벽하게 제어할 수 없기 때문에 모든 View가 동일한 앱에 속하지는 않습니다\. 특정 플랫폼에서는 전체 화면을 서로 다른 영역으로 쪼개서 앱을 표시합니다\. SwiftUI에서는 서로 다른 영역을 Scene이라고 부릅니다\. Window는 Scene의 콘텐츠를 화면에 표시합니다\.

![](<../../assets/blog/app-scene-window-66db9bfd194b4594896b4afce7915c54/image-004.png>)

macOS의 경우 위처럼 다른 Scene의 콘텐츠를 여러 window로 표시할 수도 있습니다\.

![](<../../assets/blog/app-scene-window-66db9bfd194b4594896b4afce7915c54/image-005.png>)

macOS에서는 관련 창을 하나의 탭 창으로 모을 수가 있는데, 이 경우 Scene은 개별 탭으로 표시됩니다\.

### Apps

모든 Scene들이 App의 콘텐츠가 됩니다\. 즉, 앱은 다음과 같은 구조를 가집니다\.

![](<../../assets/blog/app-scene-window-66db9bfd194b4594896b4afce7915c54/image-006.png>)

View들이 모여서 복잡한 View를 이루고, 이러한 View는 Scene의 콘텐츠를 형성하고 이러한 Scene들이 모여서 복잡한 Scene을 이루고, 이게 App의 콘텐츠를 구성합니다\.

## 공식문서로 살펴보는 App, Scene, View

### App

App 프로토콜을 따르는 구조체를 선언해 앱을 만들 수 있습니다\.

body 연산 프로퍼티를 구현하여 앱 콘텐츠를 정의합니다\.

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            Text("Hello, world!")
        }
        Settings {
            SettingsView()
        }
    }
}
```

- 이 경우 App 구조체 선언 윗줄에 들어가는 @main Attribute는 MyApp이 앱의 시작점\(entry point\)이 된다는 것을 가리킵니다\.
- App 프로토콜은 기본적으로 앱을 실행할 수 있는 main\(\) 메소드 구현을 제공하지만, 전체 앱 파일 중에서 딱 1개에만 시작점이 있어야 합니다\.
- App의 body는 Scene 프로토콜을 따르는 객체들로 구성할 수 있으며, 각 scene은 뷰 계층의 루트 뷰를 포함하고 시스템에 관리되는 생명주기를 가집니다\.

### Scene

프로토콜로써, 시스템에 의해 관리되는 앱의 생명주기와 앱의 UI의 부분을 구성하는 한 부분입니다\.

Scene은 사용자들에게 보여주고 싶은 뷰 계층의 컨테이너 역할을 합니다\. 

시스템은 플랫폼에 맞게, 또 앱의 현재 상태에 따라 언제, 어떻게 뷰 계층을 보여줄지 결정합니다\. 

Scene의 some Scene을 반환하는 body 연산 프로퍼티에 하나 혹은 그 이상의 Scene 프로토콜을 따르는 Scene들을 넣어 조합해 커스텀 씬에 들어갈 콘텐츠를 지정할 수 있습니다\.

```swift
struct MyScene: Scene {
    var body: some Scene {
        WindowGroup {
            MyView()
        }
    }
}
```

- WindowGroup 같은 SwiftUI가 기본 제공하는 Built\-In Scene들을 사용할 수 있고, 커스텀 Scene을 만들어서 다른 Scene들과 조합할 수도 있습니다\.
- 커스텀 Scene을 만들려면 Scene 프로토콜을 따르는 타입을 선언해 만들 수 있습니다\.

### View

앱의 UI 부분을 나타내고, 뷰를 설정하는데 쓰이는 모디파이어들을 제공하는 프로토콜입니다\. 

Scene에 들어가는 뷰 계층의 기초가 됩니다\. 

View 프로토콜을 따르면 커스텀 뷰를 만들 수 있습니다\. 

어떤 View를 반환하는 body 연산 프로퍼티를 구현해 커스텀 뷰에 들어갈 콘텐츠를 지정합니다\. 

SwiftUI에 제공하는 Text 같은 빌트인 뷰들을 조합해 뷰의 body 프로퍼티를 채울 수 있습니다

```swift
struct MyView: View {
    var body: some View {
        Text("Hello, World!")
    }
}
```

### 각각에서 body Property의 역할

App, Scene, View에서의 body 프로퍼티는 각각의 콘텐츠와 행위를 나타냅니다\.

## 정리

App은 빌드될 수 있는 단위로 프로젝트 자체에서 다루는 앱\. 그 자체를 이루는 프로토콜입니다\.

Scene은 App의 body 프로퍼티에 들어갈 수 있는, View보다는 좀 큰 개념의 프로토콜입니다\. View hierachy의 가장 최상위 루트 뷰를 담고 있습니다\. 

View는 사용자에게 보이는 UI를 나타내는 프로토콜입니다\. View는 또다른 View를 포함할 수 있습니다\.

## 참고

<a class="notion-resource-card" href="https://medium.com/daily-monster/app-essential-in-swiftui-ft-scene-view-b1b3bad0a8bd"><span class="notion-resource-label">링크</span><span>https://medium.com/daily-monster/app-essential-in-swiftui-ft-scene-view-b1b3bad0a8bd</span></a>

<a class="notion-resource-card" href="https://phillip5094.tistory.com/226"><span class="notion-resource-label">링크</span><span>https://phillip5094.tistory.com/226</span></a>

<a class="notion-resource-card" href="https://dev-dain.tistory.com/165?source=post_page-----b1b3bad0a8bd--------------------------------"><span class="notion-resource-label">링크</span><span>https://dev-dain.tistory.com/165?source=post_page-----b1b3bad0a8bd--------------------------------</span></a>

## 나중에 보면 좋을 것

<a class="notion-resource-card" href="https://developer.apple.com/videos/play/wwdc2022/10061/"><span class="notion-resource-label">링크</span><span>https://developer.apple.com/videos/play/wwdc2022/10061/</span></a>

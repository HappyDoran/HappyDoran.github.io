---
schemaVersion: 2
title: "Declaring a custom view"
description: "View를 정의하고 계층 구조로 조합하는 방법에 대해서 알아봅시다."
category: "미분류"
categorySlug: "uncategorized"
tags: ["Swift", "SwiftUI"]
publishedAt: "2024-08-27T07:14:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 13
---

View를 정의하고 계층 구조로 조합하는 방법에 대해서 알아봅시다\.

## Overview

![](<../../assets/blog/declaring-a-custom-view-db7c5d34256048a0955eb197df5c7076/image-001.png>)

기존의 UIKit 방식의 경우 명령형 접근방식으로, UI를 표시하기 위해서 UILabel과 같은 인스턴스를 선언하고, 레이아웃도 구성하는 등 여러 조건을 명령형 식으로 표현 했었습니다\.

UI를 업데이트 할 경우에도 UI 업데이트 관련된 코드를 컨트롤러 내에서 관리하는 등 방대한 작업도 직접 해줘야 했습니다\.

SwiftUI에서는 선언형 접근방식으로 개선하여 UI를 간단하게 계층구조로 구성하고, 상태변화에 따른 UI 업데이트를 SwiftUI가 자동으로 관리 해줍니다\!

위의 이미지의 두개의 Text 조합처럼 여러개의 View들을 계층구조로 UI를 표현하면 됩니다\.

그리고 각 View들은 modifier를 제공하는데, 이미지처럼 font 크기를 설정할 수 있습니다\.

## Conform to the view protocol

```swift
struct MyView: View {
	...
}
```

View 프로토콜을 준수하는 struct를 정의하여 custom view를 만들 수 있습니다\.

custom view를 뷰 계층 내에 삽입하는 방식으로 UI에 추가할 수 있습니다\.

그리고 SwiftUI는 이러한 뷰 계층을 화면에 표시합니다\.

## Declare a body

```swift
struct MyView: View {
		var body: some View {
				...
		} 
}
```

View 프로토콜은 항상 body 연산 프로퍼티가 정의 되어야 합니다\.

SwiftUI는 View를 UI로 화면에 표시할 때 body 속성값을 읽어서 표시하며 사용자 입력, 또는 시스템 이벤트에 따라 반복적으로 일어납니다\.

View 프로토콜이 반환하는 것은 SwiftUI가 화면에 그리는 UI요소입니다\.

View 프로토콜을 채택하면 body 연산 프로퍼티가 정의가 되어있어야 하며, body 연산 프로퍼티의 View를 준수하는 관련 유형도 명시 되어있어야 합니다\. 

하지만 명시적으로는 하지 않고 View를 준수한다는 것을 나타내기 위해 some View 구문을 사용하여 body 속성을 불투명한 유형으로 선언합니다\.

이렇게 하면 Swift가 자동으로 유추합니다\.

## Assemble the view’s content

```swift
struct MyView: View {
		var body: some View {
				Text("Hello, World!")
		} 
}
```

View의 body 속성에 SwiftUI가 제공하는 내장 View와 다른 Custom View를 통해 계층구조로 UI를 구현하면 됩니다\.

Text, Toggle, ProgressView 같은 내장 View도 제공하며 VStack과 같이 View들을 정렬하는데 사용하는 내장 View도 제공합니다\!

VStack을 통해서 여러 View들을 수직으로 나열하여 표시할 수도 있습니다\.

```swift
struct MyView: View {
		var body: some View {
				VStack{
						Text("Hello, World!")
						Text("Hello, World!")
						Text("Hello, World!")
				}
		} 
}
```

VStack같이 여러 View들을 통해 만들어지는 View들은 일반적으로 @ViewBuilder를 통해 클로저 형식으로 만들어집니다\. 간단하게 클로저 형식으로 복합적으로 UI를 구성할 수 있기에 다양한 Layout을 만들 수 있어요\.

## Configure views with modifiers

```swift
struct MyView: View {
		var body: some View {
				VStack{
						Text("Hello, World!")
								.font(.title)
						Text("Hello, World!")
						Text("Hello, World!")
				}
		} 
}
```

View의 \.font\(\.title\)과 같은 modifier를 통해 View를 configure할 수 있으며, 새롭게 변경된 View를 반환합니다\. View 프로토콜을 준수하는 View들은 사용가능한 원하는 modifire들을 사용하여 View의 UI를 구성할 수 있습니다\.

## Manage data

```swift
struct MyView: View {
    let helloFont: Font
    
    var body: some View {
        VStack {
            Text("Hello, World!")
                .font(helloFont)
            Text("Glad to meet you.")
        }
    }
}
```

View 프로토콜을 준수하는 struct 내에 Property를 지닐 수 있습니다\.

값이 바뀌게 되면 SwiftUI가 알아서 사용자 입력, 또는 상태 변경시 UI 표시, UI 업데이트를 합니다\. 이때 영향을 받는 View의 일부분만 다시 그립니다\.

하지만 상황에 따라 View 전체가 다시 그려질 수 있으므로, View의 초기화 코드에서 중요한 작업을 수행하지 않는 것이 중요합니다\. 

그저 아무런 init 함수를 명시하지 않는게 오히려 SwiftUI가 대신하여 초기화를 합성할 수 있는 좋은 방법이라고 합니다\.

## Add your view to the view hierarchy

```swift
struct ContentView: View {
    var body: some View {
        MyView(helloFont: .title)
    }
}
```

Custom View를 정의한 후에는 다른 내장 View들 처럼 사용하여 View를 계층구조로 사용할 수 있습니다\. 이렇게 만들어진 View는 macOS의 설정창이나 watchOS의 알림창 승 새로운 Scene에서 root view로도 사용이 가능합니다\.

## 정리

View 프로토콜을 준수하는 struct를 통해서 Custom View를 생성할 수 있으며, body 연산 프로퍼티를 준수해야 하며, 이 body를 통해 UI로 표시됩니다\.

View들은 modifier를 통해 커스터마이징이 된 새로운 View들이 반환되고, 이 View들을 조합하는 경우 ViewBuilder를 통해 조합됩니다\.

이렇게 body내 계층구조로 만들어진 View들은 SwiftUI가 자동으로 UI로 표시해주며 UI업데이트시 필요한 View 영역만 다시 그리는 식으로 그려집니다\.

그리고 이렇게 만들어진 Custom VIew들은 내장 View들 처럼 사용이 가능하고, scene의 root View로도 사용 가능합니다\.

## 참고

<a class="notion-resource-card" href="https://developer.apple.com/documentation/swiftui/declaring-a-custom-view"><span class="notion-resource-label">링크</span><span>https://developer.apple.com/documentation/swiftui/declaring-a-custom-view</span></a>

<a class="notion-resource-card" href="https://velog.io/@minsang/SwiftUI-View#declaring-a-custom-view"><span class="notion-resource-label">링크</span><span>https://velog.io/@minsang/SwiftUI-View#declaring-a-custom-view</span></a>

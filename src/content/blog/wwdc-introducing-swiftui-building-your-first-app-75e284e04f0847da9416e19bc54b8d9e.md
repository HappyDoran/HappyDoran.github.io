---
schemaVersion: 2
title: "WWDC) Introducing SwiftUI: Building Your First App"
description: "swiftUI에서 뷰는 UI뷰와 같은 기본 클래스에서 상속되는 클래스가 아니라 뷰 프로토콜을 준수하는 구조체."
tags: ["SwiftUI", "상태 관리", "렌더링"]
publishedAt: "2024-08-27T07:14:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 9
---

## SwiftUI의 View 작동 방식

swiftUI에서 뷰는 UI뷰와 같은 기본 클래스에서 상속되는 클래스가 아니라 뷰 프로토콜을 준수하는 구조체\.

→ 뷰가 저장 프로퍼티를 상속하지 않음을 의미한다\(?\)

스택에 할당되고 값으로 전달됨

추가 할당이나 참조 계산 오버헤드가 없다\.

그 뒤에서 swiftUI는 뷰 계층 구조를 렌더링하기 위한 효율적인 구조로 적극적으로 축소한다\.

→ 이래서 우리가 작은 뷰로 잘게 뿌셔서 사용할 수 있는 것\.

swiftUI는 엄청 가볍다\.

하위 뷰 추출에서 런타임 오버헤드가 거의 없기 때문에 리팩토링 해야 한다\.

swiftUI의 뷰와 UIKit의 뷰는 동일한 역할을 수행한다\.

뷰 프로토콜에는 단일 요구사항, 즉 그 자체가 뷰인 body property만 요구한다\.

→ 어떤 뷰던지 작성하게 되는건 사실 이 뷰 안의 body에 있는 뷰를 랜더링한다는 뜻\.

→ 뷰의 새로운 렌더링을 가져올 때를 지가 알고있다는 것\.

## View Defines its Dependencies

swiftUI에서는 view 자체가 dependencies를 정의한다\.

![](<../../assets/blog/wwdc-introducing-swiftui-building-your-first-app-75e284e04f0847da9416e19bc54b8d9e/image-001.png>)

@State로 선언된 프로퍼티는 View 뒷단으로 해당 프로퍼티가 할당 된다\.\(스유가 직접 관리하는 곳\)

→이게 혹시 SSOT랑 관련이 된건가 싶은데, 의논을 나눠보고 싶습니다\.

State 프로퍼티의 특별한 특성중 하나 SwiftUI가 읽고 쓸때 이 프로퍼티를 관찰할 수 있다는 것입니다\.

State로 감싸진 우리의 프로퍼티의 값이 바뀐다 → 상태값이 바뀐다

SwiftUI는 body에게 다시 물어본다\.

그래서 view가 랜더링이 되는거다\.

### 그럼 여기서 전에 공부한거를 연관해보면…

@State로 선언한 프로퍼티가 있음

이 친구는 View의 뒷단에 swiftUI 그자체의 공간에 할당이 되어있음\.

@State라는 Property wrapper의 특성상 wrappedValue를 ProjectedValue를 통해서 바인딩값으로 만들어서 하위뷰로 전달을 함

전달된 바인딩 값을 $를 이용하여 사용하여 상태를 변경하게 되면 뒷단의 값이 변경이 되는 것 같습니다\.

그래서 State와 바인딩이 둘다 struct, 즉 값타입이여도 연결이 되있는 거 같습니다\.

이 일련의 과정을 SSOT라고 하는 거 같아요\.

![](<../../assets/blog/wwdc-introducing-swiftui-building-your-first-app-75e284e04f0847da9416e19bc54b8d9e/image-002.png>)

## Managing Dependencies is Hard

기존의 UIView를 생각해보면 데이터가 바뀐다? → UIView도 업데이트 해줘야한다\.

→ 전통적인 UI 프레임워크는 뷰와 데이터간의 암묵적인 의존성이 생깁니다\.\(데이터가 바뀌면 뷰가 새로운 값을 반영해야하기 때문에\!\)

![](<../../assets/blog/wwdc-introducing-swiftui-building-your-first-app-75e284e04f0847da9416e19bc54b8d9e/image-003.png>)

변경된 데이터에 의해 View가 바뀌다가 업데이트에 실패하게 되면

![](<../../assets/blog/wwdc-introducing-swiftui-building-your-first-app-75e284e04f0847da9416e19bc54b8d9e/image-004.png>)

이렇게 버그가 생겨버립니다\.

![](<../../assets/blog/wwdc-introducing-swiftui-building-your-first-app-75e284e04f0847da9416e19bc54b8d9e/image-005.png>)

![](<../../assets/blog/wwdc-introducing-swiftui-building-your-first-app-75e284e04f0847da9416e19bc54b8d9e/image-006.png>)

UIKit의 경우 이렇게 점점 경우의 수가 많아지고 로직이 많아질 수록 고려해야할 부분은 엄청 많아지고, 버그는 엄청 많아질 것입니다\. 수동적으로 관리를 아무리 잘해도 버그는 생기기 마련이지 암\.\.

#### SwiftUI의 출현

이 복잡함을 줄이기 위해서\(zoom, enhance, zoomIn, completion\)을 하나로 묶어서 처리한다면 편하겠죠?

![](<../../assets/blog/wwdc-introducing-swiftui-building-your-first-app-75e284e04f0847da9416e19bc54b8d9e/image-007.png>)

바디만 신경을 쓰게된다면? 데이터의 변화를 감지하고 랜더링까지 SwiftUI에서 알아서 다 해줄 수 있다\!\.

![](<../../assets/blog/wwdc-introducing-swiftui-building-your-first-app-75e284e04f0847da9416e19bc54b8d9e/image-008.png>)

해\-피

## Number of States

![](<../../assets/blog/wwdc-introducing-swiftui-building-your-first-app-75e284e04f0847da9416e19bc54b8d9e/image-009.png>)

SwiftUI는 프레임워크가 상태를 관리해요\. 그래서 개발자가 상태를 직접 관리하던 전통적인 프레임 워크의 단점을 보완하고 있습니다\.

→ UIKit, AppKit 등에서는 상태가 어떻게 들어오거나 실행될지 모르기 때문에 기능이 추가됨에 따라 버그 발생율이 증가하지만, SwiftUI는 body만 관리하면 되므로 버그가 발생하지 않을 것이에요\.

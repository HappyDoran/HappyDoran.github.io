---
schemaVersion: 2
title: "WWDC) SwiftUI Essentials"
description: "SwiftUI는 기존에 우리가 사용하던 UIKit의 다양한 컴포넌트, 다양한 기능들을 사용하는 방법을 그저 바꿨을 뿐입니다."
tags: ["Swift", "SwiftUI"]
publishedAt: "2024-08-27T07:14:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 19
---

## Intro

SwiftUI는 기존에 우리가 사용하던 UIKit의 다양한 컴포넌트, 다양한 기능들을 사용하는 방법을 그저 바꿨을 뿐입니다\.

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-001.png>)

기본적인 것을 쉽게 구현할 수 있게 돕고, 자유롭게 커스텀할 수 있도록 도와주려고 만들어진 SwiftUI

## View and Modifiers

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-002.png>)

SwiftUI에서는 계층구조와 코드가 작성됩니다\. 

SwiftUI에서는 UIKit과 다르게 addSubView와 같은 함수가 없습니다\.

→ View구조체를 하나 만들고 추가하고 하나 만들고 추가하는 방식이 아닌 완성된 구조체를 만들고 그것을 초기화 하기 때문이죠\.

## 명시적 vs 선언적

쉽게 말하면 UIKit은 명시적으로 작동하고, SwiftUI는 선언적으로 작동을 합니다\.

### 명시적

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-003.png>)

명시적인 방법으로 아보카도 토스트를 만드는 과정은 다음과 같습니다\.

친구한테 전화를 해서 어떻게 아보카도 토스트를 만드는지 설명을 다 해줘야 합니다\. 

그러니까 어느 하나라도 설명을 잘못하거나 뭐가 없으면 제대로 된 아보카도 토스트가 나오지 않습니다\.

UIKit = 친구

### 선언적

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-004.png>)

선언적인 방법으로 아보카도 토스트를 만드는 과정은 다음과 같습니다\.

아보카도 전문가에게 “아보카도 토스트 만들어주세요” 하고 토스트를 주문하는 것입니다\.

그러니까 저렇게 주문만 하면 알아서 아보카도 전문가가 뚝딱 토스트를 만들어서  주는 것이죠\.

SwiftUI = 아보카도 전문가

이러한 개발자와 프레임워크간의 관계를 정의한 구조체를 초기화함으로서 뷰 사이의 뷰와 뷰사이의 계층적 관계를 선언합니다\.

> 💡 <strong>그렇다면 왜 SwiftUI에서는 View를 구조체로 생성하나요?</strong>
> 
> 일단은 <strong>성능 이슈</strong>가 있습니다\.
> 
> <strong>UIKit</strong>의 경우 UIView는 제약, 배경, 렌더링을 위한 레이어, 정렬 방법 등 수많은 속성과 메소드가 있는 클래스입니다\. 그런데 실제로 우리가 사용하는 UIKit에서의 뷰는 UIView를 상속받는 서브 클래스입니다\. 그렇기 때문에 간단한 뷰를 만들더라고 그 안에 있는 속성들은 이미 많아서 크기가 큽니다\.
> 
> SwiftUI의 경우에는 기본으로 제공되는 모든 뷰 컴포넌트들은 작던 크던 구조체이며 자유롭게 생성할 수 있습니다\. 또한 상위로부터 오는 어떠한 상속된 값도 없어서 딱 생성하려는 구조체 만큼의 크기를 가집니다\.
> 
> → 뷰 자체가 라이트해집니다\.
> 
> 두번째로 <strong>클린한 상태를 유지</strong>할 수 있습니다\.
> 
> UIKit은 클래스의 뷰를 생성하므로서 모든 뷰 상태를 체크하며 어떤 변화가 일어날지 신경써야합니다\.
> 
> 반면에 SwiftUI에서는 구조체로 해당 뷰를 딱 정의하고 생성하는 곳에서만 사용될 것이므로 그부분만 신경쓰면 됩니다\.
> 
> → 독립적인 뷰단위로 체크가 가능하다\!
> 
> 세번째로 <strong>메모리 관리가 효율적</strong>입니다\. 
> 
> SwiftUI의 뷰는 구조체이며 값타입입니다\. 따라서 참조가 아니기 때문에 메모리가 누수될 일이 없습니다\.

## View Container Syntax

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-005.png>)

Container의 클로저는 ViewBuild라는 특수한 것으로 되어있습니다\.

→ 그 클로저안에 선언하기만 하면 View를 볼 수 있읍니다\.

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-006.png>)

VStack을 예시로 봐봅시다\. 안에 다른 View들이 들어가있습니다\.

VStack의 내부 구현을 보면 content라는 파라미터가 있고 우리는 위와 같은 방식으로 후행클로저를 통해 사용하고 있습니다\. 

Image, Text와 같은 뷰들은 ViewBuilder라는 클로저 안에 나열된다\. 

이로써 알 수 있는 것은 ViewBuilder를 사용한 바디는 클로저 안에 뷰를 넣을 수 있는 것을 뜻합니다\. 

@ViewBuilder라는 속성이 붙어 있으면, Swift 컴파일러가 이 클로저 안에 있는 모든 뷰들이 하나로 모여진 단일 뷰\(하나의 컨텐츠뷰\)로 다시 리턴 하는 법을 알고 있습니다\.

이러한 클로저를 뷰 컨테이너의 생성자에 전달해줌으로써 뷰 컨테이너와 컨텐트 뷰들은 들여쓰기 형태로 구분될 수 있습니다\.

## Binding Syntax

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-007.png>)

SwiftUI는 @State란 속성이 붙어있으면 내부적으로 지속성 있는 형태로 생성하고 관리하며, 해당 상태를 읽기 및 쓰기합니다\.

@Binding은 일종의 관리되는 참조로, 이를 통해 하나의 뷰가 다른 뷰의 상태를 변경할 수 있습니다\.

## Modifier

SwiftUI는 View 계층을 하나하나씩 구축해 나가는 것이 아니라, 완성된 구조체를 만들고 그것을 초기화 한다는 말을 이해하려면 Modifier를 이해해야 합니다\. 

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-008.png>)

SwiftUI에서는 \.modifier를 사용하여 새로운 개념을 계속해서 추가할 수 있습니다\.

기존의 UIKit에서는 계층 구조를 가볍게 유지하도록 했습니다\.\(명령적 구조라 명령이 복잡하면 안되니까\)

그치만 선언적 구조인 SwiftUI의 특성상 자세하고, 여러개를 체이닝 하듯이 모든 modifier를 View에 붙여 View를 리턴합니다\.

→ 완성된 구조체를 만들고 그것을 초기화 한다는 말을 이해하려면 Modifier를 이해해야 합니다\.

#### Modifier의 특징

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-009.png>)

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-010.png>)

## Building Custom View

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-011.png>)

OrderHistory라는 구조체를 View 프로토콜을 채택해서 만들었습니다\.

View에는 view를 반환을 해주는 body라는 이름의 Computed Property가 있습니다\.

이 body는 body안에 선언된 view들을 하나로 묶어서 반환해줍니다\.

### 그렇다면 SwiftUI에서 View는 뭘까요?

#### UIKit의 경우

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-012.png>)

기존의 UIKit에서는 View를 클래스로 만들고 Super Class를 상속하는 걸로 만들었습니다\.

UIView는 alpha 값을 가지고 있고, backgroundColor도 프로퍼티로 가지고 있습니다\.

#### SwiftUI의 경우

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-013.png>)

개별적인 뷰에 상속이 되는 대신에 modifier가 각각의 뷰 계층 구조에 분산이 됩니다\.

각각의 modifier는 고유한 뷰를 만들기 떄문에, 덕지덕지 붙인 뷰보다 무게가 덜나가고 최적화가 가능합니다\.

\(이해가 안가는 부분입니다\.\)

→ 이 모든 것은 View 프로토콜을 채택하기만 하면 됩니다\.

#### View 프로토콜을 채택하는 모든 요소는 다음과 같다\.

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-014.png>)

나는 UI의 요소다\.

## View의 재귀

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-015.png>)

자꾸 View 프로토콜을 채택하게 되면 내부에서 View를 리턴하고 그렇게 또 리턴된 View는 View프로토콜을 채택하고… View를 리턴하고…\. 이상하지 않나요?

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-016.png>)

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-017.png>)

재귀가 계속 일어나지 않도록 View를 채택하고 있는 타입들의 내부 구현이

```swift
extension Text : View {
    public typealias Body = Never
}
```

이런식으로 Body가 never를 채택하고 있어서 계속적인 재귀가 일어나지 않습니다\.

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-018.png>)

이러한 애들을 Privative View\(원시 뷰\)라고 부르며, 이 원시 뷰들은 스스로 컨텐츠를 갖지 않고 다른 뷰들이 이들 위에 구축되는 원자적 빌딩 블록을 나타냅니다\.

이러한 기본적인 요소들을 모두 View는 채택하고 있습니다\. 

## SwiftUI에서 View와 Modifier를 적절하게 쓰기

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-019.png>)

이렇게 코드를 작성하면 자연스럽게 들어가는 애니메이션이 아니라, 이상한 cross fade 애니메이션이 생깁니다\.

→ 기본적으로 swiftUI에서 제공해주는 애니메이션은 fade\-in,fade\-out 입니다\.

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-020.png>)

한개의 뷰에서 modifier를 바꿔주는 형식으로 쓰면 자연스러운 애니메이션이 들어갑니다\.

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-021.png>)

이렇게 쓰면 토핑이 추가될 때마다 코드를 추가해줘야한다\. 

![](<../../assets/blog/wwdc-swiftui-essentials-c6282476e8854a1fb52c405df9eefaaf/image-022.png>)

이렇게 하면 토핑을 추가해도 따로 뭘 해줄게 없다\.

## 참고

<a class="notion-resource-card" href="https://green1229.tistory.com/315"><span class="notion-resource-label">링크</span><span>https://green1229.tistory.com/315</span></a>

<a class="notion-resource-card" href="https://serynana.tistory.com/entry/WWDC19-SwiftUI-Essentials"><span class="notion-resource-label">링크</span><span>https://serynana.tistory.com/entry/WWDC19-SwiftUI-Essentials</span></a>

<a class="notion-resource-card" href="https://protocorn93.github.io/2019/12/21/SwiftUI-Essentials-1/"><span class="notion-resource-label">링크</span><span>https://protocorn93.github.io/2019/12/21/SwiftUI-Essentials-1/</span></a>

<a class="notion-resource-card" href="https://protocorn93.github.io/2019/12/26/SwiftUI-Essentials-2/"><span class="notion-resource-label">링크</span><span>https://protocorn93.github.io/2019/12/26/SwiftUI-Essentials-2/</span></a>

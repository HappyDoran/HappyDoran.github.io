---
schemaVersion: 2
title: "SwiftUI는 어떤 디자인 패턴이 좋을까?"
description: "위의 제목에 답을 하기 전에 각각의 디자인 패턴을 살짝 훑어봅시다."
tags: ["SwiftUI", "아키텍처", "상태 관리"]
publishedAt: "2024-09-09T00:57:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 20
---

위의 제목에 답을 하기 전에 각각의 디자인 패턴을 살짝 훑어봅시다\.

## MVC

[MVC 패턴](<https://app.notion.com/p/b1a928cab6e941e1967eceec02bd0779>) 

` Model `\-` View `\-` Controller `의 약자로, 비즈니스 처리 로직과 사용자 인터페이스 요소들을 분리시켜 서로 영향없이 개발하기 수월하다는 장점이 있습니다\.

#### Model

애플리케이션이 ` 무엇을 ` 할건지를 정의하고, 내부 비즈니스 로직을 처리하기 위한 역할을 합니다\.

처리되는 알고리즘, DB와 상호작용\(CRUD\), 데이터 등등

#### View

화면에 ` 무엇 ` 인가를 ` 보여주기위한 역할 `을 합니다\. 최종 사용자에게 UI를 보여줍니다\.

#### Controller

모델이 ` 어떻게 ` 처리되는지 알려주는 역할을 할 것이고, 모바일에서는 화면의 로직 처리 부분입니다\. 화면에서 사용자로부터 입력을 받고 Model 또는 View의 중개인 역할을 합니다\.

![](<../../assets/blog/swiftui-7c96a5bbc4b143b1bdb3f44a3cc59dff/image-001.png>)

유저의 이벤트가 발생하면 컨트롤러가 이를 제어합니다\. 컨트롤러는 비즈니스 로직을 거쳐서 모델의 값을 변경하고 이 값을 기반으로 뷰가 바뀝니다\.

### MVC의 한계

MVC에서 View는 Controller에 연결되어 화면을 구성하는 단위요소이므로 다수의 View를 가질 수 있습니다\. 그리고 Model은 Controller를 통해서 View와 연결되어지지만, 이렇게 Controller를 통해서 하나의 View에 연결될 수 있는 Model도 여러개가 될 수 있습니다\.

View와 Model이 서로 의존성을 띄게 됩니다\.

즉 화면에 복잡한 화면과 데이터의 구성이 필요하다면, Controller에 다수의 Model과 View가 복잡하게 연결되어 있는 상황이 생길 수 있습니다\. 이를 Massive ViewController\(대규모 MVC 어플리케이션\)이라고 합니다\.

![](<../../assets/blog/swiftui-7c96a5bbc4b143b1bdb3f44a3cc59dff/image-002.png>)

View와 Controller가 라이브사이클에 강하게 연결되어 있고, 더불어 Controller를 통해 View와 Model간에도 관계가 복잡하게 연결되어있어서 수정시 테스트가 힘들고, 파악이 어렵기 때문에 여러 Side\-Effect를 불러오게 되는 문제점이 있습니다\.

## MVVM

` Model `\-` View `\-` ViewModel ` 약자로, Apple이 SwiftUI를 처음 출시한 2019년에 처음 소개한 디자인 패턴입니다\. 데이터 바인딩을 통해 뷰가 UI \+ UI 로직만을 가질 수 있고  View\-ViewModel간 상태 관리가 용이합니다\.

> 💡 <strong>데이터 바인딩</strong>
> 
> 데이터 바인딩이란 뷰와 뷰모델 사이에서 데이터의 동기화를 자동으로 처리하는 기술입니다\. 데이터 바인딩은 뷰의 변경사항을 뷰모델에 자동으로 업데이트하고, 뷰모델의 변경사항을 뷰에 자동으로 반영하는 역할을 합니다\.
> 
> 예를 들어, 사용자가 텍스트 필드에 텍스트를 입력하면 이 정보는 뷰모델로 자동으로 전달되어 저장되며, 뷰모델의 데이터가 변경되면 이 변경사항은 자동으로 뷰에 반영되어 UI가 업데이트됩니다\.
> 
> 데이터 바인딩은 코드의 양을 줄이고 가독성을 향상시키는 데 도움이 됩니다\. 또한 UI와 비즈니스 로직을 분리하여 각 부분의 테스트와 유지 관리를 용이하게 해줍니다\.
> 
> 
> → 쉽게 말해서 Model과 UI요소간의 싱크를 맞추는거라고 할 수 있습니다\. 로직이 분리되어 있어도 한쪽이 바뀌면 다른 쪽도 업데이트가 이루어저 데이터의 일관성을 유지할 수 있습니다\.

#### Model

애플리케이션이 무엇을 할 것인지 정의\(비즈니스 로직, 데이터\)

데이터베이스와의 상호작용, 네트워크 통신

#### View

사용자에게 보여지는 UI 요소를 담당합니다\. 사용자의 입력을 받아 화면을 업데이트하는 역할을 합니다\.

#### ViewModel

뷰와 모델 사이에서 어떻게 데이터를 처리하고 변환할지 결정하는 연결고리 역할을 합니다\.
뷰모델은 뷰를 위한 모델을 준비하고, 데이터 변환등의 작업을 수행합니다\. 또한 뷰의 상태와 행동을 관리하고, 뷰에게 필요한 데이터를 제공합니다\.

### Flow

![](<../../assets/blog/swiftui-7c96a5bbc4b143b1bdb3f44a3cc59dff/image-003.png>)

모델은 뷰와 직접적으로 데이터를 통신하지 않고, 대신 반응형 뷰를 사용하여 통신합니다\. 모델은 뷰모델에 데이터에 대한 변경 사항을 알리고, 뷰모델은 이러한 변경사항을 뷰에 “게시”합니다\. 뷰는 ObservableObjects 또는 EnvironmentObjects를 사용하여 이러한 변경 사항을 관찰합니다\. 뷰의 모든 기능은 뷰모델에 구현됩니다\.

뷰에서 입력이 들어오면 뷰모델의 상태가 바뀌고, 미리 정의된 로직을 통해 해당 상태가 유스케이스로 전달되며, 리턴된 값으로 상태를 바꿉니다\. 뷰에서는 해당 상태를 옵저빙하고 있다가 뷰 표현을 바꿉니다\.

### MVVM 패턴의 장단점

#### 장점

View와 Model이 서로 전혀 알지 못하기에 ` 독립성을 유지 `할 수 있습니다\. 따라서 ` 효율적인 유닛테스트 `가 가능하고 View와 ViewModel을 바인딩 하기 때문에 코드의 양이 줄어듭니다\. 

#### 단점

간단한 UI에서 오히려 ViewModel을 설계하는 어려움이 있을 수 있습니다\.

복잡해질수록 Controller 처럼 ViewModel이 빠르게 비대해지고, ` 표준화된 틀이 존재하지 않아 ` 사람마다 이해가 다릅니다\. 

## MVP

` Model `\-` View `\-` Presenter ` 의 약자로 기존 MVC 패턴의 문제점으로 두각되었던 ` Fat Controller ` 문제를 해결하기 위해 등장했습니다\. MVC 패턴에 비해 ` 더 많은 양의 코드 `가 필요하지만 View와 Presenter가 분리되면서 ` Testability `를 보장합니다\.

![](<../../assets/blog/swiftui-7c96a5bbc4b143b1bdb3f44a3cc59dff/image-004.png>)

#### Model

애플리케이션이 ` 무엇 ` 을 할 것인지 정의합니다\. 데이터 구조, DB와의 상호작용, 비즈니스 로직

#### View

화면에 무엇인가를 ` 보여주기 위한 역할 `, 사용자에게 UI를 제공합니다\.

#### Presenter

` Model `과 ` View ` 의 ` 중재자 ` 역할을 합니다\. View를 그리는 ` View Logic `은 ` Presenter `에 담겨 있지 않습니다\. ` Presenter `는 ` View `와 ` Model `의 ` 데이터 및 상태 관리 `만 담당

### MVP만의 특징

![](<../../assets/blog/swiftui-7c96a5bbc4b143b1bdb3f44a3cc59dff/image-005.png>)

MVC에서는 View 카테고리가 Controller와 강하게 연관되어 있습니다\. MVP의 도식도와 같기를 바랬지만 그렇지 않았다\. 반면에 MVP의 중재자인 ` Presenter ` 는 Passive View의 life cycle과 아무런 연관이 없습니다\. ` 독립성이 확보 `된다는 뜻입니다\. Presenter는 View의 데이터와 상태를 ` updating `해주는 역할을 맡을 뿐입니다\.

MVC의 View는 쉽게 ` mocked ` 될 수 있으므로, Presenter에는 어떠한 layout code도 담겨있지 않습니다\.

> 💡 <strong>mocking</strong>
> 
> 유닛 테스트에서 쓰이는 핵심 기술로, <strong>실제와 똑같은 fake 버전을 만들어 테스트하는 기술</strong>을 말합니다\. 실제로 네트워크를 통해서는 어떠한 요청도 수행하지 않으면서도 네트워크 동작을 정확히 제어할 수 있도록 테스트 코드에서 가짜 세션을 사용하여 테스트 하는 방법입니다\.

### MVC와의 차이점

MVC에서는 Controller가 ` UIViewController와 관련된 기능을 수행 `했습니다\. MVP에서는 UIViewController subclasses들은 ` Presenters `가 아니라 ` Views `입니다\. 이러한 차이가 엄청난 ` testability `를 제공합니다\. 다만 manual data나 event binding을 만들어야하므로 개발 속도 비용도 따라옵니다\.

### MVP의 장단점

#### 장점

코드가 깔끔해지고 Model과 View의 결합도를 낮춤으로서, 새로운 기능 추가 및 변경을 할 때마다 관련된 부분만 코드를 수정하면 되기 때문에 확장성이 개선됩니다\.\(UI, Data 각각의 파트를 나누어서 해야할 일이 명확해집니다\.\)

#### 단점

어플리케이션이 복잡해질수록 View와 Presenter 사이의 의존성이 강해지는 문제가 있습니다\. MVC의 Controller 처럼 추가 비즈니스 로직에 집중되는 경향이 있습니다\. 

## MVI

## 참고

<a class="notion-resource-card" href="https://medium.com/@jang.wangsu/%EB%94%94%EC%9E%90%EC%9D%B8%ED%8C%A8%ED%84%B4-mvc-%ED%8C%A8%ED%84%B4%EC%9D%B4%EB%9E%80-1d74fac6e256"><span class="notion-resource-label">링크</span><span>https://medium.com/@jang.wangsu/디자인패턴-mvc-패턴이란-1d74fac6e256</span></a>

<a class="notion-resource-card" href="https://zeromin-code.tistory.com/137"><span class="notion-resource-label">링크</span><span>https://zeromin-code.tistory.com/137</span></a>

<a class="notion-resource-card" href="https://velog.io/@ryuhyewon/MVVM-%EA%B0%9C%EB%85%90%EA%B3%BC-%EC%9E%A5%EB%8B%A8%EC%A0%90"><span class="notion-resource-label">링크</span><span>https://velog.io/@ryuhyewon/MVVM-개념과-장단점</span></a>

<a class="notion-resource-card" href="https://frtt0608.tistory.com/94"><span class="notion-resource-label">링크</span><span>https://frtt0608.tistory.com/94</span></a>

<a class="notion-resource-card" href="https://nightohl.tistory.com/entry/iOS-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-%ED%8C%A8%ED%84%B4-MVP"><span class="notion-resource-label">링크</span><span>https://nightohl.tistory.com/entry/iOS-아키텍처-패턴-MVP</span></a>

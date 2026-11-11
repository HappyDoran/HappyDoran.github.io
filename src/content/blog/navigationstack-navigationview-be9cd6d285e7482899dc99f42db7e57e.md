---
schemaVersion: 2
title: "NavigationStack(NavigationView 안녕)"
description: "WWDC22에서 NavigationView가 deprecated되고 ,"
tags: ["SwiftUI", "상태 관리"]
publishedAt: "2024-08-27T07:35:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 5
---

WWDC22에서 NavigationView가 deprecated되고 ,

NavigationStack/NavigationSplitView가 소개되었습니다\.\(iOS 16\+\)

## NavigationStack

RootView를 표시하고, Root View에 대한 추가 View를 제공할 수 있는 View

→ 쉽게 말하면 View에서 다른 View로의 이동할 때 <strong>제일 최상단</strong>에 작성하는 View

#### Stack이기 때문에 항상 제거되지 않은 가장 최근에 쌓인 View를 표시합니다\.

```swift
NavigationStack {
	/*content*/
}
```

## NavigationLink과 \.navigationDestination

### NavigationLink

- Presentation을 제어하는 View

```swift
import SwiftUI

struct AnimalView: View {
    
    var animals : [Animal] = animalData
    
    var body: some View {
        NavigationStack{
            List(animals) { animal in
                NavigationLink(animal.title, value: animal)   
            }
        }
    }
}
```

#### 쉽게 이해하기

```swift
NavigationLink("화면에 표시될 텍스트", "내가 다음 화면에 넘기고싶은 Parameter(인자)")
```

### navigationDestination\(for: destination: \) 

- Destination View를 NavigationLink에서 제시된 Data 타입과 연결해주는 Method

```swift
import SwiftUI

struct AnimalView: View {
    
    var animals : [Animal] = animalData
    
    var body: some View {
        NavigationStack{
            List(animals) { animal in
                NavigationLink(animal.title, value: animal)
            }
            .navigationDestination(for: Animal.self) { animal in
		            AnimalListView(animal: animal)
            }
        }
    }
}
```

#### 쉽게 이해하기

```swift
.navigationDestination(for:"내가 넘기고싶은 타입 자체"){
		Navigation할페이지(페이지의 Parameter)
}
```

→왜 Animal타입이 아닌 Animal\.self를 넘기는 거죠? 

Mosu왈

navigationDestination은 &quot;이 타입에 대해서 들어온다면 이 뷰를 쌓아줘&quot;를 의미합니다\. for에 들어가는 인자는 &quot;이 타입&quot; 그 자체를 넣어야 해요\. 

저기서 Animal만 쓴다면 컴파일 에러를 뱉습니다\. 컴파일러 입장에서는 &quot;Animal 타입에 접근은 했는데 그래서 뭐\.\.\.?&quot;로 이해한거죠\. 여기서 Animal\.self를 쓴다면 &quot;Animal 타입에 접근 했고, 그 타입 자체를 가져오는거군\!&quot;으로 제대로 이해할 수 있어요\!

## 응용

### List에 여러 타입이 들어있거나, 여러타입의 NavigaionLink가 있을 때

```swift
NavigationLink("Mint", value: Color.mint) ➡️ Color Type
NavigationLink("Black", value: "Black") ➡️ String Type
```

```swift
.navigationDestination(for: Color.self) { color in
    ColorDetailForColor(color: color) // Color Type
}
.navigationDestination(for: String.self) { color in
    ColorDetailForString(color: color) // String Type
}

```

→navigationDestination을 여러개 쓰면 된다\!

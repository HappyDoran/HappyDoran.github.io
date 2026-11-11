---
schemaVersion: 2
title: "Manage Navigation State"
description: "NavigationStack(NavigationView 안녕)"
tags: ["SwiftUI", "상태 관리", "아키텍처"]
publishedAt: "2024-08-27T07:35:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 3
---

[NavigationStack\(NavigationView 안녕\) ](<https://app.notion.com/p/be9cd6d285e7482899dc99f42db7e57e>) 

위에 내용과 이어지는 내용입니다\.

기본적으로 NavigationStack은 state를 관리하여 stack에 있는 view들을 추적합니다\.

이 작업을 내가 직접 관리하기 위해서 path라는 걸 사용합니다\.

#### 그렇다면 이걸 어디서 언제 쓰는거죠?

무신사에서 상품 공유하기 기능을 사용하여 다른 사람에게 카톡이던 뭐던 공유하기를 하였을 때, 공유를 받은 사람은 해당 링크를 통해 앱에 접속을 합니다\. 앱에 접속을 하면 공유하기 상품 view가 stack으로 쌓여서 먼저 보이게 되는 그런 컨트롤을 할 수 있습니다\. 

#### path

```python
@State private var presentedColor: [Color] = []

var body: some View {
       NavigationStack(path: $presentedColor) { ... }
}
```

presentedColor라는 State 변수를 만들고 path 파라미터에 넣어주면

NavigationStack은 내가 만든 presentedColor의 State를 관찰하게 됩니다\.

```python
@State private var presentedColor: [Color] = [Color.brown, Color.cyan]
```

이런식으로 작성을 하면 앱을 실행했을 때, Color\.cyan에 해당하는 View가 제일 위에, 그다음 Color\.brown이,그다음 root View가 보입니다\.

NavigationLink를 사용하지 않고도

```python
List {
    NavigationLink("Mint", value: Color.mint)
    NavigationLink("Pink", value: Color.pink)
    NavigationLink("Teal", value: Color.teal)
    Button("DeepLink", action: {
        self.showColors()
    })
}
func showColors() {
    self.presentedColor = [Color.gray, Color.green]
}
```

이런식으로도 사용이 가능합니다\.

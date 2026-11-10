---
schemaVersion: 2
title: "@AppStorage와 UserDefaults"
description: "App에 간단하게 값들을 저장하고 싶을 때는 UserDefaults와 iOS14 이후에 생긴 @Appstorage가 있습니다."
category: "미분류"
categorySlug: "uncategorized"
tags: ["SwiftUI", "상태 관리"]
publishedAt: "2024-08-27T07:35:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 4
---

App에 간단하게 값들을 저장하고 싶을 때는 UserDefaults와 iOS14 이후에 생긴 @Appstorage가 있습니다\.

## UserDefaults

- 공식 문서
   - App을 실행하는 동안 지속적으로 Key\-value로 저장하는 사용자의 기본 Database에 대한 Interface
      → 별도의 데이터베이스 없이 App내에서 내가 원하는 값을 어떤 Key값과 함께 저장하고, 언제든 그 Key를 통해 값을 불러낼 수 있습니다\.
- String, Bool, Int, Array 등 단일 Data를 저장하는 데에 적합하기 때문에 대량의 Data를 저장하고 싶다면 Database를 만들어서 하는 것을 추천합니다\.

### Save

```swift
UserDefaults.standard.set("Medium", forKey: "clothSize")
```

### Load

```swift
//string값을 가져오는 경우에는 nil을 반환할 수도 있기 때문에 옵셔널 바인딩을 써줘야 합니다.
let size = UserDefaults.standard.string(forKey: "clothSize") ?? ""
```

### Remove

```swift
UserDefaults.standard.removeObject(forKey: "clothSize")
```

## @AppStorage

- 데이터를 가져오는 코드를 예시로 들어보겠습니다\.

```swift
@State private var size = UserDefaults.standard.string(forKey: "clothSize") ?? ""
```

```swift
@AppStorage("clothSize") private var size = "Anonymous"
```

- UserDefaults 처럼 값을 불러오거나 저장하는 코드를 직접 구현 해야하는 번거로움 대신 @AppStorage 속성만으로 프로퍼티를 선언하고 초기 값만 대입해주면 됩니다\.
- **@AppStorage는 데이터 추출이 쉽게 때문에 개인 데이터를 저장하면 안됩니다\. **

### @AppStorage의 예시

앱 최초로 접속시 나오는 OnboardingView

- \(튜토리얼, 앱의 소개 뷰같이 한 번 보고 건너뛰기, 다시 보지않기에 따라 보이거나 안보이는 뷰\)
- @AppStorage\(&quot;onboarding&quot;\) var isOnboarindViewActive: Bool = true를 사용하여 안보이게 가능

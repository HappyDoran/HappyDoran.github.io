---
schemaVersion: 2
title: "Observation"
description: "Observation은 Swift에서 observer 디자인 패턴의 견고하고 유형이 안전하며 성능이 뛰어난 구현을 제공합니다. 이 패턴을 사용하면 관찰 가능한 객체가 observer 목록을 유지하고 특정 또는 일반적인 상태 변경 사항을 알릴 수 있습니다. 이는 객체를 직접 결합하지 않고 잠재적인 여러 observer에 업데이트를 암묵적으로 분배할 수 있다는 장점이 있습니다."
tags: ["Swift", "SwiftUI", "상태 관리"]
publishedAt: "2024-09-05T11:37:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 4
---

Observation은 Swift에서 observer 디자인 패턴의 견고하고 유형이 안전하며 성능이 뛰어난 구현을 제공합니다\. 이 패턴을 사용하면 관찰 가능한 객체가 observer 목록을 유지하고 특정 또는 일반적인 상태 변경 사항을 알릴 수 있습니다\. 이는 객체를 직접 결합하지 않고 잠재적인 여러 observer에 업데이트를 암묵적으로 분배할 수 있다는 장점이 있습니다\.

Observation 프레임 워크는 다음과 같은 기능을 제공합니다\.

- 유형을 관찰 가능한 것으로 표시
- 관찰 가능한 유형의 인스턴스 내에서 변경 사항 추적
- 앱의 사용자 인터페이스 등 다른 곳에서 해당 변경 사항을 관찰하고 활용

유형을 관찰 가능한 것으로 선언하려면 @Observable 매크로를 선언에 첨부합니다\. 이 매크로는 Observable 컴파일 타임에 유형에 대한 프로토콜 준수를 선언하고 구현합니다\.

```swift
@Observable
class Car {
    var name: String = ""
    var needsRepairs: Bool = false
    
    init(name: String, needsRepairs: Bool = false) {
        self.name = name
        self.needsRepairs = needsRepairs
    }
}
```

변경을 추적하려면 ` withObservationTracking ` 함수를 사용합니다\. 예를 들어, 다음 코드에서 함수는 car의 name이 변경될 때 클로저를 호출합니다\. 그러나 neadRepairs가 변경될 때는 클로저를 호출하지 않습니다\. 그 이유는 함수가 클로저에서 읽은 속성만 추적하고 클로저는 속성을 잃지 않기 때문입니다\.

```swift
func render() {
    withObservationTracking {
        for car in cars {
            print(car.name)
        }
    } onChange: {
        print("Schedule renderer.")
    }
}
```

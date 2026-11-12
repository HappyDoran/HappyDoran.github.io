---
schemaVersion: 2
title: "Swift extension으로 화면 코드의 책임 나누기"
description: "Swift extension은 기존 타입에 기능을 더하고 관련 코드를 묶는 데 사용할 수 있다. SwiftUI 달력 화면을 예로 들어 저장 상태·뷰 표현·날짜 계산을 나눠 읽기 쉽게 구성하는 방법을 살펴본다."
tags: ["Swift", "언어 기초"]
publishedAt: "2024-08-27T07:35:00.000Z"
updatedAt: "2026-11-12T04:06:00.000Z"
manuscriptPages: 5
---

Swift extension은 기존 타입에 기능을 더하고 관련 코드를 묶는 데 사용할 수 있다\. SwiftUI 달력 화면을 예로 들어 저장 상태·뷰 표현·날짜 계산을 나눠 읽기 쉽게 구성하는 방법을 살펴본다\.

### extension의 역할

클래스·구조체·열거형에 메서드, 연산 프로퍼티, 초기화 기능 등을 확장할 수 있다\. 저장 프로퍼티를 새로 추가하는 용도로 사용하지 않는다\.

뷰의 저장 상태와 body는 본체에 두고 날짜 계산과 포맷 같은 역할을 extension으로 묶을 수 있다\.

### 상태와 화면 표현

```swift
import SwiftUI

struct CalendarView: View {
    @State var month: Date

    var body: some View {
        Text(Self.dateFormatter.string(from: month))
    }
}
```

실제 화면에는 선택한 날짜, 이동량, 일정 목록 등 추가 상태가 있을 수 있다\. extension으로 분리하더라도 어떤 상태가 화면을 구동하는지 본체에서 찾을 수 있게 한다\.

### 타입 프로퍼티 분리

```swift
extension CalendarView {
    static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter
    }()

    static let weekdaySymbols =
        Calendar.current.veryShortWeekdaySymbols
}
```

화면의 모든 인스턴스가 사용하는 포맷터·요일 기호를 타입 프로퍼티로 묶는 예시다\. 연산 프로퍼티를 추가할 때도 확장하는 타입의 값으로 계산할 수 있는지 확인해야 한다\.

### 날짜 계산 메서드 분리

```swift
private extension CalendarView {
    func getDate(for day: Int) -> Date {
        Calendar.current.date(
            byAdding: .day,
            value: day,
            to: startOfMonth()
        )!
    }

    func startOfMonth() -> Date {
        let components = Calendar.current.dateComponents(
            [.year, .month],
            from: month
        )
        return Calendar.current.date(from: components)!
    }

    func numberOfDays(in date: Date) -> Int {
        Calendar.current.range(
            of: .day,
            in: .month,
            for: date
        )?.count ?? 0
    }

    func firstWeekdayOfMonth(in date: Date) -> Int {
        let components = Calendar.current.dateComponents(
            [.year, .month],
            from: date
        )
        let firstDay = Calendar.current.date(from: components)!
        return Calendar.current.component(.weekday, from: firstDay)
    }

    func changeMonth(by value: Int) {
        if let newMonth = Calendar.current.date(
            byAdding: .month,
            value: value,
            to: month
        ) {
            month = newMonth
        }
    }
}
```

위 코드는 날짜 계산 helper를 묶는 구조를 보여준다\. 원문의 Calendar 계산과 강제 언래핑 패턴은 유지했으며, 날짜 생성 실패를 어떻게 처리할지는 사용하는 계약에 맞춰 판단해야 한다\.

### 가독성을 위한 분리 기준

함수끼리·프로퍼티끼리 모으는 것으로 시작할 수 있지만, 더 중요한 기준은 기능과 책임이다\. 뷰 표현을 읽는 과정에서 날짜 계산의 세부 구현을 모두 지나가지 않도록 배치한다\.

extension으로 파일을 나눴다는 사실만으로 의존성이 분리되는 것은 아니다\. 본체의 상태를 어떤 helper가 읽고 바꾸는지 계속 추적할 수 있어야 한다\.

### 정리

저장 상태와 body, 공통 타입 값, 내부 계산을 구분해 extension으로 묶는다\. 단순한 분량 분할보다 관련 책임을 함께 찾을 수 있는 구조를 목표로 한다\.

### 참고

- [Swift extension 정리](<https://babbab2.tistory.com/124>)

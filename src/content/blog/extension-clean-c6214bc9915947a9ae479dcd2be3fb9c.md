---
schemaVersion: 2
title: "extension을 얼마나 잘 다루느냐가 clean한 코드를 작성하는데 영향을 미칩니다."
description: "Swift 문법 중에 엄청 많이 쓰는 extension에 대해서 알아봅시다."
tags: ["Swift", "언어 기초"]
publishedAt: "2024-08-27T07:35:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 3
---

## Extension

Swift 문법 중에 엄청 많이 쓰는 extension에 대해서 알아봅시다\.

### extension이란?

기존 클래스, 구조체, 열거형 타입에 새로운 property, Method, Initializer 등을 추가하는 것

#### 코드로 봐봅시다\.

```swift
struct CalendarView: View {
    ...
    
    
    var body: some View {
		    ...
		}
		
}

extension CalendarView {
	...
	//해당 부분에 원하는 property, Method, Initializer를 추가하는 것입니다.
}
```

#### extension에서 property 추가하기

extension에서는 연산프로퍼티 및 타입 프로퍼티만 추가가 가능합니다\. \(저장 프로퍼티는 추가가 안돼요\.\)

```swift
extension CalendarView {
		//static이 붙은 type property
    static let dateFormatter: DateFormatter = { 
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter
    }()
    
    //static이 붙은 type property
    static let weekdaySymbols = Calendar.current.veryShortWeekdaySymbols
    
    //computed property
    var half: Int {
        return self / 2
    }
}
```

#### extension에서 method 추가하기

extension에서는 인스턴스 메서드, 타입 메서드 모두 추가가 가능합니다\.

```swift
extension CalendarView {
    /// 특정 해당 날짜
    private func getDate(for day: Int) -> Date {
        return Calendar.current.date(byAdding: .day, value: day, to: startOfMonth())!
    }
    
    /// 해당 월의 시작 날짜
    func startOfMonth() -> Date {
        let components = Calendar.current.dateComponents([.year, .month], from: month)
        return Calendar.current.date(from: components)!
    }
    
    /// 해당 월에 존재하는 일자 수
    func numberOfDays(in date: Date) -> Int {
        return Calendar.current.range(of: .day, in: .month, for: date)?.count ?? 0
    }
    
    /// 해당 월의 첫 날짜가 갖는 해당 주의 몇 번째 요일
    func firstWeekdayOfMonth(in date: Date) -> Int {
        let components = Calendar.current.dateComponents([.year, .month], from: date)
        let firstDayOfMonth = Calendar.current.date(from: components)!
        
        return Calendar.current.component(.weekday, from: firstDayOfMonth)
    }
    
    /// 월 변경
    func changeMonth(by value: Int) {
        let calendar = Calendar.current
        if let newMonth = calendar.date(byAdding: .month, value: value, to: month) {
            self.month = newMonth
        }
    }
}
```

### extension을 쓰는 이유

필자의 NC1 경험으로 인해 얻은 extension을 쓰는 이유는 

extension을 사용할 경우, 코드의 유지보수나, 가독성면에서 좋다고 생각합니다\.

#### 코드 예시

```swift
struct CalendarView: View {
    @Environment(\.modelContext) private var modelContext
    
    @Query private var schedules : [Schedule]
    @Bindable var selectedDate : SelectedDate
    
    @State var month: Date
    @State var offset: CGSize = CGSize()
    @State var clickedDates: Set<Date> = []
		//    ...그밖의 View 구성에 사용되는 저장 프로퍼티들 
    
    var body: some View {
	    ...
    }
}


// MARK: - CalendarView 안에서 쓰이는 내부 메서드
private extension CalendarView {
    /// 특정 해당 날짜
    private func getDate(for day: Int) -> Date {
        return ...
    }
    
    /// 해당 월의 시작 날짜
    func startOfMonth() -> Date {
        let components = Calendar.current.dateComponents([.year, .month], from: month)
        return ...
    }
    
    /// 해당 월에 존재하는 일자 수
    func numberOfDays(in date: Date) -> Int {
        return ...
    }
    
    /// 해당 월의 첫 날짜가 갖는 해당 주의 몇 번째 요일
    func firstWeekdayOfMonth(in date: Date) -> Int {
        ...
        return ...
    }
    
    /// 월 변경
    func changeMonth(by value: Int) {
        ...
    }
}


// MARK: - CalendarView 안에서 쓰이는 내부 프로퍼티
extension CalendarView {
    static let dateFormatter: DateFormatter = {
        ...
    }()
    
    static let weekdaySymbols = Calendar.current.veryShortWeekdaySymbols
}
```

이런식으로 함수는 함수끼리, 프로퍼티는 프로퍼티끼리

→ 더 나아가 기능별로 분리를 한다면 코드가 더 깔끔해 질 수 있을 것 같습니다\. 

#### 참고

<a class="notion-resource-card" href="https://babbab2.tistory.com/124"><span class="notion-resource-label">링크</span><span>https://babbab2.tistory.com/124</span></a>

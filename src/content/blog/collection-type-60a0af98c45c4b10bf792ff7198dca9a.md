---
schemaVersion: 2
title: "Collection Type"
description: "배열, 집합, 그리고 딕셔너리를 사용하여 데이터를 구성"
tags: ["Swift", "언어 기초"]
publishedAt: "2024-08-27T07:14:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 8
---

## 콜렉션 타입

배열, 집합, 그리고 딕셔너리를 사용하여 데이터를 구성

Array \- 넣은 순서대로 저장되는 콜렉션

Set \- 값이 중복되지 않는 순서 없는 콜렉션

Dictionary \- Key\-Value 관계를 가지는 순서 없는 콜렉션

![](<../../assets/blog/collection-type-60a0af98c45c4b10bf792ff7198dca9a/image-001.png>)

Swift의 배열, 집합, 그리고 딕셔너리는 저장할 수 있는 값의 타입과 키에 대해서 항상 명확합니다\.

→ 타입에 대해서 엄격하다는 것을 의미합니다\.

배열, 집합, 딕셔너리 타입은 제네릭 콜렉션으로 구현됩니다\.\(제네릭에 대한 공부에서 추가적으로 공부할 것\)

## 콜렉션의 가변성

배열, 집합, 딕셔너리를 생성하고 변수\(var\)에 할당하면 생성된 콜렉션 타입은 변경 가능\(Mutable\)합니다\.

→ 콜렉션이 생성된 이후에 해당 아이템을 추가, 삭제, 변경할 수 있다는 뜻입니다\.

상수\(let\)에 할당하면 변경이 불가능합니다\.

→ 변경할 필요가 없는 모든 경우에는 Swift 컴파일러가 생성한 콜렉션의 성능을 최적화 하고, 코드에 대해 쉽게 추론하기 위해 상수로 할당하는 것이 좋습니다\.

## 배열\(Array\)

순서대로 같은 타입의 값을 저장, 중복값이 존재할 수 있습니다\.

```swift
//배열 선언 방법
var someInts: [Int] = []
```

```swift
var threeDoubles = Array(repeating: 0.0, count: 3) //[0.0, 0.0, 0.0]
var anotherthreeDoubles = Array(repeating: 0.0, count: 3) //[0.0, 0.0, 0.0]

var sixDoubles = threeDoubles + anotherthreeDoubles //[0.0, 0.0, 0.0, 0.0, 0.0, 0.0]

print(sixDoubles)
```

```swift
//초기값을 가지는 배열 생성
[<#value 1#>, <#value 2#>, <#value 3#>]

var shoppingList: [String] =  ["Eggs", "Milk"]
```

Swift의 타입 추론 덕분에 같은 타입의 값을 포함하는 배열을 리터럴을 통해 초기화 하면 배열의 타입을 명시할 필요가 없습니다\.

```swift
var shoppingList = ["Eggs", "Milk"]
```

### 배열 사용하기

```swift
//배열에 새로운 요소 추가
shoppingList.append("bread")

//배열 합치기
shoppingList+=["bacon", "juice"]
shoppingList.append(contentsOf: ["bacon", "juice"])

//특정 인덱스에 새로운 요소 추가
shoppingList.insert("jam", at: 2)

//배열 전체 삭제
shoppingList = []
shoppingList.removeAll()

//특정 인덱스의 요소 삭제하기
shoppingList.remove(at: 5)

//배열의 마지막 요소 삭제
shoppingList.removeLast()

//배열이 비어있는지 확인
shoppingList.isEmpty

//배열의 크기 확인
shoppingList.count

//해당 값을 가지고 있는지 확인
shoppingList.contains("milk") 
```

### 더 많은 배열 사용

<a class="notion-resource-card" href="https://medium.com/eunjios-dev-blog/swift-%EB%AC%B8%EB%B2%95-%EC%BB%AC%EB%A0%89%EC%85%98-%ED%83%80%EC%9E%85-collection-types-%EC%A0%95%EB%A6%AC-1%ED%8E%B8-%EB%B0%B0%EC%97%B4-array-e2685af54ea1"><span class="notion-resource-label">링크</span><span>https://medium.com/eunjios-dev-blog/swift-문법-컬렉션-타입-collection-types-정리-1편-배열-array-e2685af54ea1</span></a>

## 집합\(Set\)

콜렉션의 순서와 상관없이 같은 타입의 다른 값을 저장, 순서가 중요하지 않고 반복하면 안될 때 사용합니다\.

### 집합 타입을 위한 해쉬 값

집합\(set\)에 저장하기 위해서는 해당 타입이 반드시 hashable 해야 합니다\. 즉, 해쉬 값\(hash value\)을 계산 할 수있는 방법을 제공해야 합니다\. 

a == b 이면 a\.hashValue == b\.hashValue

Swift의 모든 기본타입\(String, Int, Double, Bool 등\)은 기본적으로 hashable 하고 집합의 값 타입 또는 딕셔너리의 키 타입으로 사용할 수 있습니다\. 연관된 값이 없는 열거형의 케이스 값 또한 hashable합니다\.

\(프로토콜에 대한 공부에서 추가적으로 공부할 것\)

### 집합 사용하기

```swift
//빈 집합 생성
var someSet = Set<Int>()

//초기값을 가지는 집합 생성
var someSet: Set<Int> = [1, 2, 3, 1, 2]
//순서없이 {2,1,3} 출력

//집합에 새로운 요소 추가
someSet.insert(5)
//순서없이 {4,3,1,2} 출력

//집합에 특정 요소 제거
someSet.remove(1)

//집합이 비어있는지 확인
someSet.isEmpty

//집합의 요소 갯수
someSet.count

//해당 요소가 들어있는지 확인
someSet.contains(4)
```

## 딕셔너리\(Dictionary\)

순서와 상관없이 콜렉션에 같은 타입의 키\(Key\)와 같은 타입의 값\(value\)를 저장합니다\.

→ 각 값에 이름을 붙여 보관한다고 생각하면 됩니다\. 즉 유니크한 키값을 가져야합니다\.

딕셔너리는 의미 단위로 값을 찾을 때 사용합니다\.

→ 그래서 보통 셋은 잘 사용하지 않고, 배열\(순서 기반\), 딕셔너리\(의미 기반\)으로 관리합니다\.

### 딕셔너리 사용하기

```swift
//빈 딕셔너리 생성
var namesOfNumber = [Int: String]()

//초기값을 가지는 딕셔너리 생성
var scoresOfStudent: [String, Int] = ["Seo": 98, "Dong": 11, "Won": 26]

//딕셔너리 전체 삭제하기
namesofNumber = [:]

//key의 value값 불러오기
scoresOfStudent["Seo"] //98

//없는 값을 호출할 경우에는 nil이 출력이 되기 때문에 옵셔널 바인딩을 통해 값을 불러오는 것이 좋습니다.
if let score = scoresOfStudent["Dong"] {
     print(score)
} else {
}

//딕셔너리 크기 확인
scoresOfStudent.count

//딕셔너리가 비어있는지 확인
scoresOfStudent.isEmpty

//딕셔너리에 기존값 재할당
scoresOfStudent["Won"] = 27

//딕셔너리의 특정 key 삭제
scoresOfStudent["Won"] = nil
```

### 더 많은 집합과 딕셔너리의 사용

<a class="notion-resource-card" href="https://medium.com/eunjios-dev-blog/swift-%EB%AC%B8%EB%B2%95-%EC%BB%AC%EB%A0%89%EC%85%98-%ED%83%80%EC%9E%85-collection-types-%EC%A0%95%EB%A6%AC-2%ED%8E%B8-%EC%85%8B-set-%EB%94%95%EC%85%94%EB%84%88%EB%A6%AC-dictionary-b8f56daf3166"><span class="notion-resource-label">링크</span><span>https://medium.com/eunjios-dev-blog/swift-문법-컬렉션-타입-collection-types-정리-2편-셋-set-딕셔너리-dictionary-b8f56daf3166</span></a>

## 참고

<a class="notion-resource-card" href="https://bbiguduk.gitbook.io/swift/language-guide-1/collection-types#dictionaries"><span class="notion-resource-label">링크</span><span>https://bbiguduk.gitbook.io/swift/language-guide-1/collection-types#dictionaries</span></a>

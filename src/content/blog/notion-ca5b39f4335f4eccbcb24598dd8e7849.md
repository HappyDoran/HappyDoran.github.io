---
schemaVersion: 2
title: "기본 데이터 타입"
description: "true, false 만 가능한 데이터 타입"
tags: ["Swift", "언어 기초"]
publishedAt: "2024-08-27T07:31:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 1
---

#### Bool

true, false 만 가능한 데이터 타입

```swift
var someBool : Bool = true 
```

#### UInt

부호가 없는 정수, 양의 정수 타입

```swift
var someUInt : UInt = 100
```

#### Int

부호가 있는 정수 타입

```swift
var someInt1 : Int = -100
var someInt2 : Int = 100
```

#### Float

부동소수형 타입 32비트

```swift
var someFloat : Float = 3.14
```

#### Double

부동소수형 타입 64비트

```swift
var someDouble : Double = 3.14
```

#### Character

한글자의 문자를 표현하는 타입

```swift
var someCharacter : Character = "A"
//유니코드를 사용하기 때문에 이모티콘도 사용 가능
//큰 따옴표를 사용
```

#### String

여러 문자들이 이루는 문자열을 표현하는 타입

```swift
var someString : String = "하하하"
someString = someString + "웃으면 복이와요"
print(someString)
//하하하웃으면 복이와요
```

→ Swift에서는 서로 다른 타입간의 자료 교환은 암시적으로 불가능하다\.

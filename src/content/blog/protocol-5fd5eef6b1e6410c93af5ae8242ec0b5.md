---
schemaVersion: 2
title: "Protocol"
description: "프로토콜은 준수해야하는 타입이 구현해야하는 요구사항을 정의하는 것입니다."
tags: ["Swift", "언어 기초"]
publishedAt: "2024-08-27T07:14:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 19
---

## 프로토콜이란?

프로토콜은 준수해야하는 타입이 구현해야하는 요구사항을 정의하는 것입니다\. 

프로토콜은 메서드, 프로퍼티, 그리고 특정 작업이나 기능의 부분이 적합한 다른 요구사항의 청사진을 정의합니다\. 

프로토콜은 요구사항의 구현을 제공하기 위해 클래스, 구조체 또는 열거형에 의해 채택될 수 있습니다\. 프로토콜의 요구사항에 충족하는 모든 타입은 프로토콜에 준수한다고 합니다\.

> 💡 <strong>쉽게 말하면</strong>
> 
> 프로토콜 = 약속
> 밴드를 구성할 때 필요한 것은 보컬, 기타 피아노, 드럼… 이렇게 꼭 필수적으로 필요한 것들을 선언 해두는 것을 프로토콜이라고 합니다\.

## 프로토콜을 사용하는 이유?

객체지향 시스템의 목적은 ` 사용자의 요구를 만족시키는 기능 ` \+ ` 이해하기 쉽고 단순한, 유연한 상호작용을 제공하는 객체들의 공동체 구축 `이다\.

그렇다면 객체 지향 언어는 역할과 책임이 존재한다\. 하지만 이 역할이 객체가 아닌, 무엇인가를 응답해줄 책임자\. 즉 추상화된 무언가를 뜻한다\. 이 추상화를 프로토콜로써 해결하고, 누구나 해당 역할을 할 수있게 해준다\.

## 프로토콜 구문

```swift
protocol someProtocol {
	...
}
```

```swift
struct SomeStructure: FirstProtocol, AnotherProtocol {
	...
}

class SomeClass: SomeSuperClass, FirstProtocol, AnotherProtocol {
	...
}
```

사용자가 정의한 프로토콜은 :로 구분된 타입의 이름 뒤에 프로토콜의 이름을 위치시켜 채택합니다\.

이렇게 선언한 클래스, 구조체, 열거형은 채택한 프로토콜을 준수합니다\.

→ 프로토콜을 따르지 않을 경우 컴파일시 에러가 발생합니다\.

## 프로퍼티 요구사항

프로퍼티 요구사항은 항상 var 키워드와 함께 변수 프로퍼티로 선언됩니다\. 

프로토콜은 프로퍼티를 요구할 때 항상 gettable인지 gettable,settable인지도 지정해줘야 합니다\.

```swift
protocol SomeProtocol {
    var mustBeSettable: Int { get set } //읽기 쓰기 프로퍼티
    var doesNotNeedToBeSettable: Int { get } //읽기 전용 프로퍼티
    static var someTypeProperty: Int { get set } //타입 프로퍼티
}


```

다음은 단일 인스턴스 프로퍼티 요구사항을 가지는 프로토콜의 예시입니다\.

```swift
protocol FullyNamed {
    var fullName: String { get }
}
```

해당 프로토콜을 준수하는 구조체, 클래스는 fullName이라는 gettable 인스턴스 프로퍼티를 가져야 합니다\.

```swift
struct Person: FullyNamed {
    var fullName: String //저장 프로퍼티
}
let john = Person(fullName: "John Appleseed")
// john.fullName is "John Appleseed"
```

```swift
class Starship: FullyNamed {
    var prefix: String?
    var name: String
    init(name: String, prefix: String? = nil) {
        self.name = name
        self.prefix = prefix
    }
    var fullName: String { //연산 프로퍼티
        return (prefix != nil ? prefix! + " " : "") + name
    }
}
var ncc1701 = Starship(name: "Enterprise", prefix: "USS")
// ncc1701.fullName is "USS Enterprise"
```

## 메서드 요구사항

프로토콜에서 메서드의 경우 함수의 헤더 부분만 위처럼 작성해두고, 바디 부분은 해당 프로토콜을 채택하는 곳에서 직접 구현하면 됩니다\. 

```swift
protocol RandomNumberGenerator {
    func random() -> Double
}

class LinearCongruentialGenerator: RandomNumberGenerator {
    var lastRandom = 42.0
    let m = 139968.0
    let a = 3877.0
    let c = 29573.0
    func random() -> Double {
        lastRandom = ((lastRandom * a + c)
            .truncatingRemainder(dividingBy:m))
        return lastRandom / m
    }
}
let generator = LinearCongruentialGenerator()
print("Here's a random number: \(generator.random())")
// Prints "Here's a random number: 0.3746499199817101"
print("And another one: \(generator.random())")
// Prints "And another one: 0.729023776863283"
```

## 변경 메서드 요구사항

메서드가 속한 인스턴스를 수정, 변경해야하는 경우 ` mutating `을 위치시켜 수정 가능함을 나타냅니다\.

```swift
protocol Togglable {
    mutating func toggle()
}

enum OnOffSwitch: Togglable {
    case off, on
    mutating func toggle() {
        switch self {
        case .off:
            self = .on
        case .on:
            self = .off
        }
    }
}
var lightSwitch = OnOffSwitch.off
lightSwitch.toggle()
// lightSwitch is now equal to .on
```

## 초기화 구문 요구사항

프로토콜은 준수하는 타입에 초기화 구문을 구현하도록 요구할 수 있습니다\. 지정된 초기화 구문을 프로토콜을 준수하는 클래스 에서는 ` required ` 을 위치시킵니다\.

```swift
protocol SomeProtocol {
    init(someParameter: Int)
}

class SomeClass: SomeProtocol {
    required init(someParameter: Int) {
        // initializer implementation goes here
    }
}
```

하위 클래스가 상위 클래스의 지정된 초기화 구문을 재정의하고 프로토콜로 부터 일치하는 초기화 구문 요구사항이구현되면 ` required `와 ` override `  수식어 둘 다 사용합니다\.

```swift
protocol SomeProtocol {
    init()
}

class SomeSuperClass {
    init() {
        // initializer implementation goes here
    }
}

class SomeSubClass: SomeSuperClass, SomeProtocol {
    // "required" from SomeProtocol conformance; "override" from SomeSuperClass
    required override init() {
        // initializer implementation goes here
    }
}
```

> 💡 <strong>Note</strong>
> final 클래스의 경우 하위 클래스가 될 수 없으므로 재정의를 할 수 없습니다\.

## 타입으로서의 프로토콜

프로토콜은 1급 객체이기 때문에 독립적인 하나의 타입으로 볼 수 있다\.

> 💡 <strong>1급 객체?</strong>
> 
> 어떤 객체가 독립적인 하나의 타입으로 사용될 수 있다면 이 객체는 1급 객체로 취급된다\.
> ex\) Function, Closer, Protocol

### 변수 타입

```swift

protocol Band {
    var piano: String { get }
}

struct Beatles: Band {
    var piano: String = "sodeul"
    var bandName: String = "Beatles"
}

let beatles: Band
```

프로토콜을 변수의 타입으로 선언하면, 프로토콜은 구조체, 클래스, 열거형도 아니라 인스턴스 생성을 못하는데 어떻게 하나요?

→ 프로토콜을 타입으로 한다는 말은, 해당 프로토콜을 채택한 구조체/클래스/열거형의 인스턴스를 프로토콜로 타입캐스팅 해서 사용하겠다 라는 말입니다\. 

```swift
let beatles: Band = Beatles.init()
```

때문에 Beatles의 인스턴스를 이 프로토콜 타입을 가진 변수 beatles에 대입할 수 있는 것입니다\.

### 파라미터 타입, 반환 타입

```swift
func doSomething(band: Band) -> Band {
    return Beatles.init()
}
```

이것 또한 해당 프로토콜을 채택한 구조체/클래스/열거형의 인스턴스를 프로토콜로 타입캐스팅 해서 사용하겠다 라는 말입니다\. 

```swift
let beatles = Beatles.init()
doSomething(band: beatles)
```

### 정리

> 너 Band란 프로토콜을 준수하고 있구나? 그러면 반드시 piano란 프로퍼티를 갖고 있겠군\!
> 너가 어떤 프로퍼티/ 메서드를 선언 했는지는 관심 없어\.
> 너가 Band라는 약속으로 인해 구현해놓은 piano란 프로퍼티에 접근할 뿐이야…

## 위임\(Delegation\)

Delegate pattern은 한 객체가 특정 작업을 다른 객체에 위임하는 디자인 패턴입니다\. 이는 코드의 유연성과 재사용성을 증가시키고, 의존성 역전의 원칙을 잘 따르게 해줍니다\. 과적합으로 인한 객체간의 강한 결합성을 피할 수 있게 됩니다\. 

### 델리게이트 프로토콜 정의

델리게이트 패턴을 사용하기 위해 먼저 델리게이트 프로토콜을 정의해야 합니다\. 이 프로토콜에는 델리게이트가 구현해야 하는 메서드들이 선언됩니다\.

```swift
protocol DoorDelegate: AnyObject {
    func doorDidOpen(_ door: Door)
    func doorDidClose(_ door: Door)
}
```

### 델리게이트 속성 추가

델리게이트 프로토콜을 따르는 객체를 위임 객체로 사용하기 위해 클래스에 델리게이트 속성을 추가합니다\.

```swift
class Door {
    weak var delegate: DoorDelegate?
    
    func open() {
        // Some code to open the door...
        delegate?.doorDidOpen(self)
    }
    
    func close() {
        // Some code to close the door...
        delegate?.doorDidClose(self)
    }
}
```

### 델리게이트 설정

델리게이트를 설정하여 델리게이트 메서드를 수행할 객체를 결정합니다\.

```swift
class DoorObserver: DoorDelegate {
    func doorDidOpen(_ door: Door) {
        print("The door did open.")
    }
    
    func doorDidClose(_ door: Door) {
        print("The door did close.")
    }
}

let door = Door()
let observer = DoorObserver()
door.delegate = observer
```

### 델리게이트 패턴의 장단점

#### 장점

재사용성 

- 동일한 작업을 다른 컨텍스트에서도 쉽게 재사용할 수 있습니다\.

유연성 

- 런타임 시간에 객체의 동작을 변경할 수 있습니다\. 이는 클래스간 강한 결합을 방지하고 객체의 동작을 유연하게 변경할 수 있게 해줍니다\.

의존성 역전

- 객체가 직접 작업을 수행하는 대신 델리게이트에게 작업을 위임하기 때문에 의존성 역전을 따릅니다\.

#### 단점

복잡성

- 코드의 복잡성이 증가합니다, 디버깅이 어려워집니다\.

오버헤드

- 추가적인 클래스나 인터페이스를 정의해야할 수 있습니다\. 코드 베이스의 크기를 증가시키고 메모리와 시간을 소비하는 결과를 가져옵니다\.

## 프로토콜의 확장

### 확장\(extension\)을 통해 프로토콜 메서드의 기본 구현 제공

```swift
protocol Band {
    func play()
}

struct ABand: Band {
    func play() {
        print("play!")
    }
}
 
struct BBand: Band {
    func play() {
        print("play!")
    }
}
 
struct CBand: Band {
    func play() {
        print("play!")
    }
}
```

특별한 일이 없는 한 Band프로토콜을 채택하는 구조체는 print\(&quot;play\!&quot;\)를 실행하는 메서드를 선언해야합니다\.

이럴 때 확장을 통해 프로토콜 메서드의 기본 구현을 합니다\.

```swift
protocol Band {
    func play()
}
 
extension Band {
    func play() {
        print("play!")
    }
}

struct ABand: Band { }

struct BBand: Band {
    func play() {              //직접 이렇게 구현을 하면 우선순위가 더 높기 떄문에 여기가 실행됩니다,
        print("BBand play!")
    }
}
 
ABand().play()  // "play!"

BBand().play()  // "BBand play!"
```

### 조건적으로 프로토콜 준수

where을 통해서 기본 메서드를 제공하는 것에 제한을 둘 수도 있습니다\.

```swift
protocol Human { }
protocol Band {
    func play()
}
 
extension Band where Self: Human {
    func play() {
        print("play!")
    }
}
```

where를 통해서 제한을 둘 경우

Human 클래스를 채택하고 있는 경우에만 확장을 제공하겠다라는 뜻이 됩니다\.

따라서,

```swift
struct ABand: Band { }
ABand().play()                  // X! Type 'ABand' does not conform to protocol 'Band'
 
struct BBand: Human, Band { }
BBand().play()                  // O! "play!"
```

Human 프로토콜을 채택하지 않은 ABand의 경우 extension에 구현된 기본 메서드가 제공되지 않기 때문에 사용할 수 없습니다\.

### 확장을 통해 프로토콜의 프로퍼티 기본값 제공

```swift
protocol Band {
    var piano: String { get }
}
 
extension Band {
    var piano: String {
        return "sodeul"
    }
}
 
struct ABand: Band {}   
```

## 합성된 구현을 사용하여 프로토콜 채택

Swift는 많은 경우에 Equatable, Hashable, Comparable에 대해 프로토콜 준수성을 자동으로 제공할 수 있습니다\. 합성된 구현을 사용하면 프로토콜 요구사항 구현을 위해 반복적인 상용구 코드를 작성할 필요가 없습니다\.

### Equatable

` == `, ` ! = ` 제공

```swift
struct Vector3D: Equatable {
    var x = 0.0, y = 0.0, z = 0.0
}

let twoThreeFour = Vector3D(x: 2.0, y: 3.0, z: 4.0)
let anotherTwoThreeFour = Vector3D(x: 2.0, y: 3.0, z: 4.0)
if twoThreeFour == anotherTwoThreeFour {
    print("These two vectors are also equivalent.")
}
// Prints "These two vectors are also equivalent."
```

### Hashable

hash를 직접 구현하지 않고 원래 선언을 포함한 파일에서 Hashable에 대한 준수성을 제공합니다\.

### Comparable

` <, <=, >, >= ` 제공

```swift
enum SkillLevel: Comparable {
    case beginner
    case intermediate
    case expert(stars: Int)
}
var levels = [SkillLevel.intermediate, SkillLevel.beginner,
              SkillLevel.expert(stars: 5), SkillLevel.expert(stars: 3)]
for level in levels.sorted() {
    print(level)
}
// Prints "beginner"
// Prints "intermediate"
// Prints "expert(stars: 3)"
// Prints "expert(stars: 5)"
```

## 프로토콜 타입의 콜렉션

```swift
let things: [TextRepresentable] = [game, d12, simonTheHamster]

for thing in things {
    print(thing.textualDescription)
}
```

이런식으로 배열에 항목을 반복할 수 있고, 각 항목의 설명을 출력할 수 있습니다\.

## 프로토콜 상속

```swift
protocol InheritingProtocol: SomeProtocol, AnotherProtocol {
    // protocol definition goes here
}

protocol PrettyTextRepresentable: TextRepresentable {
    var prettyTextualDescription: String { get }
}
```

프로토콜은 하나 또는 그 이상의 다른 프로토콜을 상속할 수 있고, 상속한 요구사항 위에 요구사항을 더 추가할 수 있습니다\. 

## 클래스 전용 프로토콜

```swift
protocol SomeClassOnlyProtocol: AnyObject, SomeInheritedProtocol {
    // class-only protocol definition goes here
}
```

` AnyObject ` 프로토콜을 추가하여 구조체 또는 열거형이 아닌 클래스 타입으로 제한할 수 있습니다\.

이렇게 하면 SomeClassOnlyProtocol은 클래스 타입에만 채택될 수 있습니다\.

## 프로토콜 혼합

동시에 여러개의 프로토콜을 준수하는 타입이 가능합니다\. 

프로토콜의 혼합은 ` SomeProtocol & AnotherProtocol ` 형식으로 가능합니다\.

```swift
protocol Named {
    var name: String { get }
}
protocol Aged {
    var age: Int { get }
}
struct Person: Named, Aged {
    var name: String
    var age: Int
}
func wishHappyBirthday(to celebrator: Named & Aged) { //&로 명시
    print("Happy birthday, \(celebrator.name), you're \(celebrator.age)!")
}
let birthdayPerson = Person(name: "Malcolm", age: 21) //두개의 프로토콜을 준수하는 변수
wishHappyBirthday(to: birthdayPerson) //parameter에 두개의 프로토콜을 준수하는 변수가 들어감
```

## 프로토콜 적합성

### 해당 인스턴스는 이 프로토콜을 채택하고 있나?

```swift
protocol Band { }
protocol Solo { }
 
struct Beatles: Band { }
 
let beatles = Beatles.init()
beatles is Band     // true
beatles is Solo     // false
```

` is ` 를 사용하면 인스턴스가 해당 프로토콜을 채택하고 있는지 아닌지를 Bool 값으로 리턴해줍니다\.

` as? ` 와 같은 다운 캐스트 연산자는 프로토콜의 타입의 옵셔널 값을 반환하고 인스턴스가 프로토콜을 준수하지 않으면 그 값은 ` nil ` 입니다\.

```swift
let betles: Band? = BBand.init() as? Band //nil일 수도 있습니다.
```

## 참고

<a class="notion-resource-card" href="https://bbiguduk.gitbook.io/swift/language-guide-1/protocols#protocol-composition"><span class="notion-resource-label">링크</span><span>https://bbiguduk.gitbook.io/swift/language-guide-1/protocols#protocol-composition</span></a>

<a class="notion-resource-card" href="https://babbab2.tistory.com/174"><span class="notion-resource-label">링크</span><span>https://babbab2.tistory.com/174</span></a>

<a class="notion-resource-card" href="https://velog.io/@go90js/Delegate-Pattern"><span class="notion-resource-label">링크</span><span>https://velog.io/@go90js/Delegate-Pattern</span></a>

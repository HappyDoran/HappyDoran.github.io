---
schemaVersion: 2
title: "WWDC) Embrace Swift generics"
description: "제네릭 정복하기"
tags: ["Swift", "언어 기초"]
publishedAt: "2024-08-27T07:14:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 45
---

## 들어가기전에 

[제네릭 정복하기](<https://app.notion.com/p/6f2232502a2440a386f7207b86b538f9>) 

제네릭은 Swift에서 추상화된 코드를 작성하기 위한 기본적인 도구로, 코드의 복잡성을 관리하는데 매우 중요한 역할을 합니다\.

## 추상화?

개념을 구체적인 디테일에서 분리하는 것을 뜻합니다\. 반복적으로 사용해야 하는 기능이나 값이 있다면 함수나 지역 변수를 사용하여, 따로 빼서 추상화를 할 수 있습니다\.

## 함수를 통한 추상화

```swift
let circleOneCircumference: Double = 2 * .pi * Double(circleOneRadius)
let circleTwoCircumference: Double = 2 * .pi * Double(circleTwoRadius)
```

원의 둘레를 계산하는 코드가 있다고 해보자\. 2 \* \.pi 부분이 중복되므로 이 기능을 함수로 만들 수 있을겁니다\.

```swift
func circumference(radius: Double) -> Double {
    return 2 * .pi * radius
}

let circleOneCircumference = circumference(radius: circleOneRadius)
let circleTwoCircumference: circumference(radius: circleTwoRadius)
```

이렇게 함수를 통해서 추상화를 하면 세부 정보를 반복하지 않고 현재 일어나고 있는 것에 대한 아이디어를 표현할 수 있을겁니다\.

## Type을 통한 추상화

Swift에서는 구체적인 타입\(Concrete type\) 또한 추상화 할 수 있다\.

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-001.png>)

같은 개념을 공유하지만 디테일이 다른 타입들의 집합이 있을 경우, 이 모든 구체적인 타입들을 다룰 수 있는 추상화된 코드를 작성할 수 있습니다\.

<strong>이러한 구체적인 타입들을 추상화하는 WorkFlow를 봐봅시다\.</strong>

## 구체적인 타입\(Concrete type\) 만들기

```swift
struct Cow {
    func eat(_ food: Hay) {}
}

struct Hay {
    static func grow() -> Alfalfa {
        return Alfalfa()
    }
}

struct Alfalfa {
    func harvest() -> Hay {
        return Hay()
    }
}

struct Farm {
    func feed(_ animal: Cow) {
        let alfalfa = Hay.grow()
        let hay = alfalfa.harvest()
        animal.eat(hay)
    }
}
```

해당 코드의 흐름은 다음과 같다\.

- Cow \- 먹이를 먹는다\(eat\)
- Hay\(먹이\) \- 작물을 키운다\(grow\)
- Alfalfa\(작물\) \- 먹이를 수확한다\(harvest\)

→ 키워서\(grow\) 작물\(Alfalfa\)이 되면 수확한다\(harvest\)  이건 소가 먹을\(eat\) 먹이\(Hay\)이다\.

이렇게 되면 소에게는 먹이를 먹일 수 있습니다\.

하지만 다른 종류의 동물들에게도 먹이를 주고싶다면 어떻게 해야 할까요?

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-002.png>)

### Many Concrete types\(Ad\-hoc polymorphism\)

```swift
// overloading
struct Farm {
    // 소
    func feed(_ animal: Cow) {
        let alfalfa = Hay.grow()
        let hay = alfalfa.harvest()
        animal.eat(hay)
    }

    // 말
    func feed(_ animal: Horse) {
        let root = Carrot.grow()
        let carrot = root.harvest()
        animal.eat(carrot)
    }

    // 닭
    func feed(_ animal: Chicken) {
        let wheat = Grain.grow()
        let grain = wheat.harvest()
        animal.eat(grain)
    }
}
```

이렇게 overload해서 소, 말, 닭 타입의 파라미터를 인자로 받을 수 있습니다\. 

하지만 이렇게 하게 되면 boilerplate가 생기게되고 코드를 계속해서 반복적으로 작성해야 합니다\.

이렇게 비슷하게 구현된 overload들을 작성해야하는 근본적인 이유는 동물들은 기능상 어떤 종류의 음식을 먹는다는 동작을 하는 것이 비슷하기 때문이다\.

## Common capabilitied 정의하기

위의 코드에서 동물들은 모두 어떤 종류의 음식을 먹는다는 동작을 하기 때문에 비슷하게 구현된 overloading된 코드가 적혔습니다\.

```swift
struct Cow {
    func eat(_ food: Hay) {
        // hay를 먹는다.
    }
}

struct Horse {
    func eat(_ food: Carrot) {
        // carrot을 우적 우적 씹어 먹는다.
    }
}

struct Chicken {
    func eat(_ food: Grain) {
        // grain을 쪼아 먹는다.
    }
}
```

위의 주석과 같이 동물들은 제각각 다른 방법으로 먹이를 먹을 수 있기 때문에, 위와 같이 eat\(\_: \)메서드의 내부 동작은 동물마다 다를 것입니다\. 

우리가 하고싶은 것은 추상화된 코드를 통해 eat\(\_:\) 메서드를 호출하면서 이를 실행하는 동물 타입에 따라 다르게 동작하게 하는 것입니다\.

### Polymorphism

다른 구체적인 타입들에게서 다르게 동작할 수 있는 추상화 코드의 능력을 polymorphism이라고 합니다\. 다형성은 한 코드가 코드가 어떻게 사용되는지에 따라 다양한 동작을 할 수 있게 합니다\.

### Different forms of polymorphism

다형성은 다양한 형태로 나타납니다\.

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-003.png>)

#### Ad\-hoc polymorphism 

함수를 overloading 하는 것을 의미합니다\. 함수를 overload하면 함수의 인자 타입에 따라 같은 함수 호출이 다른 의미를 가질 수 있습니다\. 위에서도 봤듯이, overloading은 반복적으로 코드를 작성하기 때문에 일반적인 해결 방법이 아닙니다\.

#### Subtype polymorphism

Supertype에서 실행되는 코드가 런타임에서 실제로 사용되는 특정 subtype에 따라 다르게 작동합니다\.

#### Parametric polymorphism

제네릭을 통해 나타낼 수 있습니다\. 제네릭 코드는 다양한 타입을 다룰 수 있는 하나의 코드를 작성할 수 있게 해주고, 구체적인 타입들은 그 자체로 인자로 사용된다\.

### Subtype polymorphism

Subtype 관계를 표현할 수 있는 방법은 클래스 계층을 사용하는 겁니다\.

```swift
class Animal {
    func eat(_ food: ???) {
        fatalError("Subclass는 eat 메서드를 꼭 구현해야 한다.")
    }
}

class Cow: Animal {
    override func eat(_ food: Hay) {
        // hay를 먹는다.
    }
}

class Horse: Animal {
    override func eat(_ food: Carrot) {
        // carrot을 우적 우적 씹어 먹는다.
    }
}

class Chicken: Animal {
    override func eat(_ food: Grain) {
        // grain을 쪼아 먹는다.
    }
}
```

Animal이라는 이름의 superclass를 하나 만들고, 모든 동물 개체를 구조체에서 Animal 클래스를 상속받는 subclass로 만들어주고 eat\(\_:\) 메서드를 오버라이딩하게 했습니다\.

Animal은 모든 구체적인 동물 타입들을 표현할 수 있는 추상화된 base\-class가 됩니다\. Animal 클래스의 eat\(\_:\)를 호출하면 subtype polymorphism을 통해 subclass에 구현된 eat\(\_:\) 메서드를 호출할 것입니다\.

#### 해당 코드의 문제점

- Animal의 eat\(\_:\) 메서드의 파라미터 타입을 정하지 못했기 때문에 코드를 작성하면 위와 같이 컴파일 에러가 납니다\.
- 모든 동물 타입을 구조체에서 클래스로 바꿔 사용하게 되면 다른 종류의 동물 인스턴스간에 공유하고 싶은 상태가 없음에도 불구하고 reference semantics\(객체를 참조를 통해 조작하는 방법\)을 사용하게 됩니다\.
   → ex\) 클래스로 만들어서 여러개의 Cow 타입의 데이터를 양산해낼 수 없다\!
   
   데이터의 취지에 어긋나는 느낌…\!
   
   배열에 추가가 안된다는 느낌으로 쓱
- 각 동물의 subtype이 다른 타입의 음식을 먹는데, 이런 의존성을 클래스 계층에서 표현하기 어렵다\.
   → ???에 Hay, Carrot, Grain을 모두 아우르는 타입이 들어가기가 힘들다\.

#### Any를 붙여봅시다\!

위 코드가 컴파일 에러가 나지 않게 하는 한 가지 방법은 Animal class의 eat\(\_:\) 메서드의 파라미터에 Any같은 특정화 되지 않은 타입을 사용하는 것입니다\. 

```swift
class Animal {
    func eat(_ food: Any) {
        fatalError("Subclass는 eat 메서드를 꼭 구현해야 한다.")
    }
}

class Cow: Animal {
    override func eat(_ food: Any) {
        guard let food = food as? Hay else { fatalError("Cow는 Hay만 먹을 수 있다.") }
    }
}

class Horse: Animal {
    override func eat(_ food: Any) {
        guard let food = food as? Carrot else { fatalError("Horse는 Carrot만 먹을 수 있다.") }
    }
}

class Chicken: Animal {
    override func eat(_ food: Any) {
        guard let food = food as? Grain else { fatalError("Chicken은 Grain만 먹을 수 있다.") }
    }
}
```

이러면 컴파일 에러는 안나긴 하지만 subclass의 구현부에서 런타임에 전달된 타입이 맞는 타입인지 확인해줘야한다\. 

#### 해당 코드의 문제점

→ 추상화된 base class의 인자의 타입을 Any로 설정하고 subclass에서 오버라이딩하게 되면

- 오버라이딩된 메서드들에서 추가적인 boilerplate가 발생합니다\.
- 잘못된 음식 타입을 실수로 전달할 경우 런타임에서만 확인할 수 있는 버그가 발생합니다\.

#### Type parameter

Any 대신에 Animal 슈퍼클래스에서 type parameter를 사용해서 type\-safe한 방법으로 동물의 먹이 타입을 표현할 수 있습니다\.

```swift
class Animal<Food> {
    func eat(_ food: Food) {
        fatalError("Subclass는 eat 메서드를 꼭 구현해야 한다.")
    }
}

class Cow: Animal<Hay> {
    override func eat(_ food: Hay) {
        // hay를 먹는다.
    }
}

class Horse: Animal<Carrot> {
    override func eat(_ food: Carrot) {
        // carrot을 우적 우적 씹어 먹는다.
    }
}

class Chicken: Animal<Grain> {
    override func eat(_ food: Grain) {
        // grain을 쪼아 먹는다.
    }
}
```

타입 파라미터는 각 서브클래스를 위한 특정 먹이 타입의 placeholder가 됩니다\. 즉 이 placeholder에 특정 먹이타입을 채우는게 약간 이상합니다\. 

#### 해당 코드의 문제점

- 동물들이 eat\(\_:\) 메서드를 위해 먹이가 필요한 것은 맞지만 먹이를 먹는 것이 동물의 주요 목적이 아닙니다\.
- 각 동물 클래스 내의 많은 코드들이 먹이를 사용하지 않을 확률이 더 높습니다\.

그러니까 먹이가 중요한게 아닌데 동물 클래스를 쓰는 모든 곳에서 먹이 타입을 명시해야하는 문제가 있습니다\. 이는 번거로움을 유발합니다\.

> 💡 <strong>subtype polymorphism의 문제점</strong>
> 
> 근본적인 문제는 클래스는 데이터 타입인데, 구체적인 타입들에 대한 개념을 추상화하기 위해 superclass를 복잡하게 만들고 있는 겁니다\.
> 
> → 클래스는 데이터로 사용하기에 적합하지 않다\!
> 
> 따라서 해당 문제에 직면했을 때는 각 타입이 구체적으로 어떻게 동작하는지에 대한 디테일 없이 각 타입의 능력을 표현할 수 있는 구조를 사용하는 것이 좋습니다\. 

## Interface 만들기

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-004.png>)

동물들은 두가지 공통적인 능력이 있습니다\.

- 특정 타입의 먹이
- 특정 타입의 먹이를 먹을 수 있는 연산

이 정의한 능력들을 표현할 수 있는 인터페이스를 만들기 위해서 Swift에서는 protocol을 제공합니다\.

### Protocol

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-005.png>)

Protocol은 프로토콜을 준수하는 타입의 기능을 명시하는 추상화 도구입니다\. 프로토콜을 사용해서 구체적인 구현 부분에서 타입이 무엇을 하는지에 대한 개념을 분리할 수 있습니다\.

### Interface of an animal

```swift
protocol Animal {
    associatedtype Food
    func eat(_ food: Food)
}


struct Cow: Animal {
    func eat(_ food: Hay) {
        // hay를 먹는다.
    }
}

struct Horse: Animal {
    func eat(_ food: Carrot) {
        // carrot을 우적 우적 씹어 먹는다.
    }
}

struct Chicken: Animal {
    func eat(_ food: Grain) {
        // grain을 쪼아 먹는다.
    }
}
```

#### 특정 타입의 먹이

타입 파라미터와 마찬가지로, 연관 타입\(associatedtype\)은 구체적인 타입들에서 사용할 수 있는 placeholder가 됩니다\. 연관 타입이 특별한 이유는 프로토콜을 준수하는 구체적인 타입에 의존한다는 것입니다\. 이 관계는 보장되기 때문에 프로토콜을 준수하는 한 구체적인 타입의 인스턴스들은 모두 같은 종류의 음식을 갖게 됩니다\.

#### 특정 타입의 먹이를 먹을 수 있는 연산 

eat\(\_:\) 메서드\. 프로토콜은 메서드를 구현하지 않고, 구체적인 동물 타입에서 이를 구현하도록 되어있습니다\.

### 프로토콜의 장점

- 프로토콜은 클래스에 한정되지 않기 때문에, 구조체, 열거형, actor에도 사용할 수 있습니다\.
   → 각 동물이 구조체로 존재해도 됩니다\.
- : Animal을 통해 conforanmance annotaion을 작성하면 컴파일러가 자동으로 각 구체적인 타입들이 프로토콜 요구사항을 구현하는지를 확인합니다\. 각 구체적인 동물 타입들은 eat\(\_:\) 메서드를 구현해야하고, 컴파일러는 인자에서 먹이 타입을 보고 Food가 무슨 타입인지를 추론할 수 있습니다\.

## Write generic code

```swift
protocol Animal {
    associatedtype Food
    func eat(_ food: Food)
}

struct Farm {
    func feed(_ animal: ???) {
    }
}
```

Animal 프로토콜을 사용해서 농장의 feed 메서드를 구현하는데 사용할 수 있습니다\. 

제네릭 코드를 사용하는 이유는 다양한 동물 타입이 만들어질 때마다 보일러플레이트 코드가 많이 생성되서 그런겁니다\. 따라서 우리의 목표는 Animal 프로토콜을 사용해서 모든 타입의 구체적인 동물 타입에서 동작할 수 있는 하나의 구현부를 작성하는 것입니다\.

### Parametric Polymorphism

```swift
struct Farm {
    // 방법 1
    func feed<A: Animal>(_ animal: A) {
    }

    // 방법 2
    func feed<A>(_ animal: A) where A: Animal {
    }
    
    // 방법 3
    func feed(_ animal: some Animal) {
    }
}
```

이 두가지 feed 함수는 표현하는 방식이 다를 뿐, 기능은 동일합니다\.

where를 사용하게 되면 정교한 요구사항 및 타입간의 관계를 표현할 수 있습니다\. 그치만 너무 길어요\.

some을 사용하게 되면 A라고 붙던 placeholder나 타입을 명시하던 것들이 다 간소화됐습니다\.

#### Some?

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-006.png>)

some은 특정한 구제적인 타입이 있음을 명시합니다\. some 뒤에는 항상 conformance 요구사항이 따라옵니다\. 여기서의 특정 타입은 꼭 Animal 프로토콜을 준수해야함을 나타내고, 파라미터를 통해 Animal 프로토콜에서 명시한 요구사항들을 사용할 수 있게 합니다\.

some 키워드는 파라미터와 결과 타입에서도 사용될 수 있습니다\.

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-007.png>)

swiftUI 뷰에서, body 프로퍼티는 특정 타입의 뷰를 리턴하지만, 코드는 특정 타입이 무엇인지 알 필요 없이 body 프로퍼티를 사용합니다\.

> ❓ <strong>Abstract Type == Opaque Type</strong>
> 특정 구체적인 타입의 placeholder를 나타냅니다\.

> ❓ <strong>Underlying Type</strong>
> opaque type이 사용된 placeholder를 대체하는 특정 구체적인 타입을 의미합니다\.
> 실제 타입, 내부에서 실제로 사용하는 타입, 특정 구체 타입입니다\.

### Opaque type declations

opaque type을 선언하는 방법은 두개가 있다\.

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-008.png>)

some 키워드 사용하기

대괄호 안에 타입 파라미터 사용하기

Opaque 타입은 input, output 모두에 사용할 수 있으므로 파라미터나 리턴 타입 부분에 사용할 수 있습니다\.

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-009.png>)

Opaque 타입의 위치는 프로그램의 어떤 부분이 추상화된 타입을 볼지, 그리고 어떤 타입이 구체적인 타입을 결정하는지를 결정합니다\.

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-010.png>)

타입 파라미터는 항상 input쪽에 정의되기 띠문에 호출하는 곳에서 underlying 타입을 정하고 구현하는 곳에서 abstract 타입을 사용합니다\.

```swift
protocol Liquid {
    func flow()
}

struct Water: Liquid {
    func flow() {}
}

struct Milk: Liquid {
    func flow() {}
}

struct Human {
    func drink(_ liquid: Liquid) {
        // 사용하는 곳
        print("Human drinks \(liquid)")
    }
}

let human = Human()
let water = Water()
// 값을 제공하는 곳. Water 타입의 인스턴스를 값으로 제공했다.
human.drink(water)
```

위의 코드를 보면 Liquid라는 프로토콜이 있고, 이를 준수하는 두개의 구조체가 있습니다\. 그리고 Human 구조체를 따르는 인스턴스는 Liquid 프로토콜을 준수하는 특정 타입의 인스턴스를 매개변수로 drink 메소드를 사용할 수 있습니다\.

이 파라미터를 사용하는 함수의 구현부에서는 liquid 파라미터를 사용해서 무언가를 할 때 Liquid 프로토콜을 보고, 이 프로토콜에서 명시하는 요구사항들을 사용할 수 있습니다\. 

#### 정리

값을 제공하는 부분 human\.drink\(water\)에서는 underlying type을 정하고,

값을 사용하는 부분 drink\(\_: \) 메서드의 구현부에서는 abstract 타입을 봅니다\.

### some의 underlying type 추론하기

Underlying 타입은 값에서 추론될 수 있습니다\. 

<strong>some은 항상 구체적인 타입이 있다는 것을 나타낸다는 것을 기억합시다\.</strong>

#### Local variables

```swift
let animal: some Animal = Horse()
```

opaque type인 지역 변수는 항상 초깃값을 가지고 있어야합니다\.

```swift
var animal: some Animal = Horse()
animal = Chicken() //cannot assign value of type 'Chicken' to type 'some Animal'
```

underlying 타입은 변수의 범위에서는 항상 고정되어 있기 때문에, underlying 타입을 바꾸려고 하면 에러가 발생합니다\.

#### parameters

```swift
func feed(_ animal: some Animal)
feed(Horse())
```

opaque type인 파라미터들의 경우, underlying 타입은 함수를 호출하는 곳에서 사용된 인자 값에서 추론합니다\. 

```swift
func feed(_ animal: some Animal)
feed(Horse())
feed(Chicken())
```

다른 타입의 인자 값을 제공해도 상관 없습니다\.

#### Results

```swift
func makeView(for farm: Farm) -> some View {
	FarmView(farm)
}
```

opaque result 타입의 경우, underlying 타입은 구현부에서 리턴되는 값에서 추론됩니다\.

```swift
func makeView(for farm: Farm) -> some View { //에러남
	if condition {
		return FarmView(farm)
	} else {
		return EmptyView()
	}
}
```

opaque result 타입을 갖는 메서드나 연산 프로퍼티는 프로그램 내의 어디에서도 호출될 수 있기 때문에, 이 결과 값의 범위는 전역적이라고 볼 수 있습니다\. <strong>따라서 underying return 타입이 모든 return 문에서 같아야합니다\.</strong>

ViewBuilder를 붙이면 해결이 되긴 합니다\.

### Back to farm…

```swift
protocol Animal {
	associatedtype Feed: AnimalFeed
	func eat(_ food: Feed) 
}

struct Farm {
	func feed(_ animal: some Animal) { ... }
}
```

opaque type을 다른 곳에서 참조할 필요 없으므로 매개 변수 목록에서 some을 사용할 수 있습니다\.

여러번 참조를 하는 경우에는 타입 파라미터를 쓰는 것이 유용합니다\.

#### Refer Opaque type multiple times

```swift
protocol Animal {
    associatedtype Food
    associatedtype Habitat
    func eat(_ food: Food)
}

struct Farm {
    func feed(_ animal: some Animal) {}

    func buildHome<A>(for animal: A) -> A.Habitat where A: Animal {}
}
```

이경우에는 result type은 특정 동물 타입에 따라 다르기 때문에 타입 파라미터 A를 파라미터 타입으로도 쓰고, result type에도 씁니다\. 

#### 제네릭

```swift
struct CandyFactory<Flavor> {
    private var flavors: [Flavor]

    init(flavors: [Flavor]) {
        self.flavors = flavors
    }
}

var candyFactor: CandyFactory<Chocolate>
```

opaque type을 여러 번 참조해야 하는 또 하나의 일반적인 위치는 제네릭입니다\.

### Farm Simulator again

```swift
protocol Animal {
	associatedtype Feed: AnimalFeed
	func eat(_ food: Feed) 
}

struct Farm {
	func feed(_ animal: some Animal) {
		let crop = type(of: animal).Feed.grow()
		let produce = crop.harvest()
		animal.eat(produce)
	}
}
```

기본적인 동물 유형이 고정되어 있기 때문에 컴파일러는 작물 타입과 먹이 타입간의 관계, 그리고 동물 타입을 알 수 있습니다\. 이러한 관계가 정해지면 동물에게 잘못된 먹이를 주는 것을 예방할 수 있습니다\. 

#### Any

이제 모든 동물들에게 먹이를 주는 메서드를 추가해봅시다\.

```swift
struct Farm {
    func feed(_ animal: some Animal) {
        let crop = type(of: animal).Food.grow()
        let food = crop.harvest()
        animal.eat(food)
    }

    func feedAll(_ animals: [???]) {}
}
```

이 상황에서는 ???에 들어가는 원소들은 Animal 프로토콜을 준수해야하는데 이 배열은 다양한 동물들을 담을 수 있어야합니다\. 

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-011.png>)

some을 사용할 경우 특정한 구체적인 underying 타입을 뜻하기 떄문에 다양한 타입을 담지 못합니다\. some을 사용하면 모든 원소는 같은 타입이어야 합니다\. 

여러 종류의 동물을 담기 위해서는 “어떤 종류의 동물” 을 나타낼 수 있는 super type이 필요합니다\.

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-012.png>)

여기에서는 어떤 불특정한 동물  타입을 any Animal로 표현할 수 있습니다\. 

any type은 어떠한 종류의 타입이라도 동적으로 저장할 수 있게 해주는 하나의 static type으로, 값타입으로도 subtype polymorphism을 사용할 수 있게 해줍니다\. 

여러 종류의 타입을 유연하게 저장할 수 있게 해주므로 any 타입은 메모리 상에서 특별한 표현 방식을 갖게 해줍니다\.

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-013.png>)

이 표현을 박스로 생각해볼 수 있습니다\.

어떤 경우에 값은 박스보다 작아서 박스 안에 들어갈 수 있습니다\. 하지만 박스에 들어가기에는 너무 큰 경우에는 값은 다른 곳에 할당되어야 하고, 박스는 그 값을 가리키는 포인터를 담는 방식으로 값을 저장해야 할 것입니다\. 

정적 타입인 any Animal이 동적으로 저장할 수 있는 구체적인 동물 타입을 공식적으로 <strong>existential type</strong>이라고 합니다\.

### Existential types provide type erasure

이렇게 다양한 종류의 구체적인 타입에 같은 표현을 쓸 수 있는, 즉 다양한 크기를 갖고 있을 다양한 종류의 구체적인 타입들을 같은 박스를 사용해서 유연하게 저장하는 전략을 type erasure라고 합니다\. 구체적인 타입은 컴파일 타임에 지워지고 런타임에서만 알 수 있습니다\.

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-014.png>)

위 그림에서 existential 타입 any Animal의 두 인스턴스는 같은 정적 타입\(상자\)을 갖지만, 다른 동적 타입\(동물\)을 갖습니다\.

Type erasure는 다른 동물 값들 간의 type\-level 차이를 없애서 다른 동적 타입 값들을 같은 정적 타입으로 바꿀 수 있게 합니다\.

```swift
protocol Animal {
	associatedtype Feed: AnimalFeed
	func eat(_ food: Feed) 
}

struct Farm {
    func feed(_ animal: some Animal) {
        let crop = type(of: animal).Food.grow()
        let food = crop.harvest()
        animal.eat(food)
    }

    func feedAll(_ animals: [any Animal]) {
        for animal in animals {
            animal.eat(Animal.Food) // Member 'eat' cannot be used on value of type 'any Animal'
        }
    }
}
```

> ❓ <strong> animal\.eat\(Animal\.Food\)에서 오류가 나는 이유</strong>
> 
> Type erasure\(any\)를 통해 ‘animals’ 배열에 저장하는 구체적인 동물 타입간의 ‘type\-level’ 차이를 없앴기 때문에, 연관 타입과 같이 특정 동물 타입에 의존하는 모든 type 관계도 지워졌기 떄문입니다\. 그래서 이 ‘animal’이 어떤 타입의 먹이를 기대하는지 알 수 없습니다\.

→ 쉽게 말해서 type erasure로 구체적인 구분을 제거해서 어떤 타입인지 모르는 겁니다\.

타입간의 관계를 이용하기 위해서는 특정 타입의 동물이 정해진 문맥으로 다시 돌아가야합니다\.

any Animal을 직접적으로 호출하는 대신, some Animal을 인자로 받는 feed 메서드를 호출해야합니다\.

```swift
struct Farm {
    func feed(_ animal: some Animal) {
        let crop = type(of: animal).Food.grow()
        let food = crop.harvest()
        animal.eat(food)
    }

    func feedAll(_ animals: [any Animal]) {
        for animal in animals {
            feed(animal)
        }
    }
}
```

any Animal은 타입간의 관계를 다 지워버렸기 때문에, feed 메서드의 파라미터인 some Animal을 사용해서 특정 구체적인 타입을 받아와서 해당 동물 타입의 먹이 타입을 사용할 수 있어야 합니다\.

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-015.png>)

컴파일러는 any Animal 의 인스턴스\(박스에 담긴 인스턴스\)를 unboxing 해서 some Animal로 바꿀 수 있고, 이를 바로 some Animal 파라미터로 전달할 수 있습니다\.

some Animal 파라미터 값은 고정된 Underlying 타입을 가지고 있기 때문에, 연관 타입을 포함해서 underlying 타입의 모든 연산에 접근할 수 있습니다\.

### Capabilities of some and any

#### Some

underlying 타입이 고정됩니다\.

제네릭 코드에서 underlying 타입의 타입 관계를 사용할 수 있습니다\. 

→ 사용하는 프로토콜의 API와 연관 타입을 모두 사용할 수 있습니다\.

#### Any

임의의 구체적인 타입을 저장할 때 사용합니다\.

Type erasure를 사용해서 다양한 collection을 표현할 수 있습니다\.

## 정리

![](<../../assets/blog/wwdc-embrace-swift-generics-b5a11200eeb8405f9e1ef6a3fd6f8c9b/image-016.png>)

기본적으로는 some을 쓰고, 임의의 값을 저장할 필요가 있을 때만 some을 Any로 바꿔서 사용합시다\. 이러면 type erasure를 사용하는 것에 대한 부담을 가지지만 유연한 저장을 사용할 수 있습니다\.

## 참고

<a class="notion-resource-card" href="https://nskg-yj.tistory.com/entry/WWDC22-Embrace-Swift-generics"><span class="notion-resource-label">링크</span><span>https://nskg-yj.tistory.com/entry/WWDC22-Embrace-Swift-generics</span></a>

<a class="notion-resource-card" href="https://woozoobro.medium.com/embrace-swift-generics-757b2be55e59"><span class="notion-resource-label">링크</span><span>https://woozoobro.medium.com/embrace-swift-generics-757b2be55e59</span></a>

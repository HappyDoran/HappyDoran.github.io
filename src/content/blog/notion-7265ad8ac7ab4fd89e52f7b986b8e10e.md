---
schemaVersion: 2
title: "순환 참조"
description: "순환 참조"
tags: ["Swift", "언어 기초", "성능 최적화"]
publishedAt: "2024-08-27T07:14:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 9
---

## 강한 참조

> 💡 <strong>ARC란?</strong>
> 
> 참조 횟수를 계산하여 0이 되는 시점에 힙에서 자동으로 해제되는 것

![](<../../assets/blog/notion-7265ad8ac7ab4fd89e52f7b986b8e10e/image-001.jpg>)

이런 식으로 인스턴스는 힙 영역에 할당되고, doran이란 지역 변수가 Human 인스턴스의 주소값을 할당 받기 때문에 힙 영역의 Human 인스턴스의 RC가 \+1 되는 것을 ` ARC `라고 합니다\.

이렇게 인스턴스의 주소값이 변수에 할당될 때 RC가 증가하면` 강한 참조 `라고 합니다\.

→ 별다른 선언이 없다면 default 값이 strong값인 겁니다\.

따라서 위의 doran으로 생성한 인스턴스는 default인 strong으로 선언되어 ` 강한 참조 객체 `인 겁니다\.

## 순환 참조

### 순환 참조란?

ARC의 단점 중에 ` 순환 참조가 발생시 영구적으로 메모리가 해제되지 않을 수 있다 `고 했었습니다\.

```swift
class A {
    var group: String
    var chain: B?
    
    init(group: String){
        self.group = group
    }
    
    deinit {
        print("A deinit")
    }
}

class B {
    var group: String
    var chain: A?
    
    init(group: String){
        self.group = group
    }
    
    deinit {
        print("A deinit")
    }
}
```

A 클래스에는 B 타입의 프로퍼티 chain이 있고, B클래스에는 A타입의 프로퍼티 chain이 있는 두개의 클래스가 있다고 해보자\. 

```swift
var aPresent: A? = .init(group: "A") //Class A RC+1
var bPresent: B? = .init(group: "B") //Class B RC+1

//여기까지
//Class A의 RC = 1
//Class B의 RC = 1
```

이렇게 생성을 하면 메모리에는 다음과 같이 할당이 됩니다\.

![](<../../assets/blog/notion-7265ad8ac7ab4fd89e52f7b986b8e10e/image-002.jpg>)

그 이후에 다음과 같이 코드를 작성하면

```swift
aPresent?.chain = bPresent //Class B RC+1
bPresent?.chain = aPresent //Class A RC+1

//여기까지
//Class A의 RC = 2
//Class B의 RC = 2
```

![](<../../assets/blog/notion-7265ad8ac7ab4fd89e52f7b986b8e10e/image-003.jpg>)

각각의 chain 프로퍼티는 기본값 strong이기 때문에 서로의 RC값이 1씩 증가합니다\.

이처럼 두개의 객체가 서로가 서로를 참조하고있는 형태가 ` 순환참조 ` 입니다\.

### 순환 참조의 문제점

```swift
aPresent = nil //Class A Rc-1
bPresent = nil //Class B Rc-1
```

이후에 이러한 코드를 작성했습니다\. 

그러면 이제 RC가 1만큼 감소하고, 0일 경우에는 메모리가 해제되어야 합니다\.

현재의 상황을 보면,

![](<../../assets/blog/notion-7265ad8ac7ab4fd89e52f7b986b8e10e/image-004.jpg>)

A와 B의 인스턴스를 다른 변수에 대입한 적도 없고, A와 B를 가리키던 변수에 nil을 할당했으니 RC가 0이 되어 메모리에서 해제되어야 하는 것이 정상인데 지금 현 상태로는 인스턴스가 힙에서 사라지지 않고 메모리를 잡아먹고 있습니다\. 

RC가 1인 이유는 순환 참조때문에 서로의 RC가 1씩 증가됐기 때문입니다\. 따라서 RC가 0이 아니기 때문에 메모리에서 해제가 되지 않는거죠…

이렇게 strong을 사용해서 순환참조에 문제가 생긴 경우를 ` 강한 순환 참조 `라고 합니다\.

그럼 어떻게 해결해야할까요?

## weak, unowned

### weak\(약한 참조\)

인스턴스를 참조할 시,`  RC를 증가시키지 않습니다. `

참조하던 인스턴스가 메모리에서 해제된 경우, ` 자동으로 nil이 할당 `되어 메모리에서 해제됩니다\.

→ 나중에 nil이 되기 때문에 ` 옵셔널 타입의 변수 `여야 합니다\.

둘중에 하나를 weak로 선언해주는 겁니다\.

```swift
class A {
    var group: String
    weak var chain: B?
    
    init(group: String){
        self.group = group
    }
    
    deinit {
        print("A deinit")
    }
}

class B {
    var group: String
    var chain: A?
    
    init(group: String){
        self.group = group
    }
    
    deinit {
        print("B deinit")
    }
}
```

여기서 순환 참조를 일으키는 코드를 똑같이 작성을 하면

```swift
var aPresent: A? = .init(group: "A") //Class A RC+1
var bPresent: B? = .init(group: "B") //Class B RC+1

//여기까지
//Class A의 RC = 1
//Class B의 RC = 1

aPresent?.chain = bPresent //Class A의 chain이 weak이므로 Class B RC가 올라가지 않음
bPresent?.chain = aPresent //Class A RC+1

//여기까지
//Class A의 RC = 2
//Class B의 RC = 1
```

![](<../../assets/blog/notion-7265ad8ac7ab4fd89e52f7b986b8e10e/image-005.jpg>)

A의 chain 프로퍼티가 weak이기 때문에 B 인스턴스의 주소값을 참조하긴 하지만 B 인스턴스의 RC값을 건들지는 않습니다\.

여기서 이렇게 nil을 때려주면

```swift
aPresent = nil //Class A Rc-1
bPresent = nil //Class B Rc-1
```

![](<../../assets/blog/notion-7265ad8ac7ab4fd89e52f7b986b8e10e/image-006.jpg>)

각각의 인스턴스에 대한 RC를 1씩 감소 시킵니다\.

![](<../../assets/blog/notion-7265ad8ac7ab4fd89e52f7b986b8e10e/image-007.jpg>)

![](<../../assets/blog/notion-7265ad8ac7ab4fd89e52f7b986b8e10e/image-008.jpg>)

RC가 0이 된 B 인스턴스는 메모리에서 해제가 되고 B 인스턴스를 가리키고 있던 A 인스턴스의 Chain이 nil이 되므로 A 인스턴스의 RC값도 \-1 되기 때문에 RC가 0이 됩니다\.

![](<../../assets/blog/notion-7265ad8ac7ab4fd89e52f7b986b8e10e/image-009.jpg>)

그럼 이렇게 A 인스턴스도 메모리에서 해제가 되겠네요\.

![](<../../assets/blog/notion-7265ad8ac7ab4fd89e52f7b986b8e10e/image-010.png>)

#### 그럼 A와 B 중에 어떤걸 weak로 선언해야 하나요?

둘중 수명이 더 짧은 인스턴스를 가리키는 애를 약한 참조로 선언해줘야 합니다\.

A가 먼저 죽는다 → B의 chain이 nil이 될 수도 있다 → B의 chain을 weak로 선언한다\.

B가 먼저 죽는다 → A의 chain이 nil이 될 수도 있다 → A의 chain을 weak로 선언한다\.

### unowned

왠만하면 쓰지 마세요\. 그리 중요하지 않으니 다음에 알아보도록 ㅎㅏㅈㅏ

## 정리

![](<../../assets/blog/notion-7265ad8ac7ab4fd89e52f7b986b8e10e/image-011.png>)

## 참고

<a class="notion-resource-card" href="https://babbab2.tistory.com/27"><span class="notion-resource-label">링크</span><span>https://babbab2.tistory.com/27</span></a>

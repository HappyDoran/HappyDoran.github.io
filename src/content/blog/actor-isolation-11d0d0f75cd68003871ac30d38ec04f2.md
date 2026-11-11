---
schemaVersion: 2
title: "Actor Isolation"
description: "immutable(변동 불가능한) state면 Actor를 쓸 필요가 없다. 근데 지금 공유 가변 상태여서 지금 문제가 발생할 여지가 있는 것이다. 그래서 우리가 Actor라는 걸 쓰고 있는 것이고, Actor가 mutable(변할 수 있는) 상태에 동시에 접근하지 않도록 막으니까(Swift가 근본적으로 보증하니까)…"
tags: ["Swift", "동시성"]
publishedAt: "2024-10-12T13:42:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 27
---

immutable\(변동 불가능한\) state면 Actor를 쓸 필요가 없다\. 근데 지금 ` 공유 가변 상태여서 지금 문제가 발생할 여지가 있는 것이다. ` 그래서 우리가 Actor라는 걸 쓰고 있는 것이고, Actor가 mutable\(변할 수 있는\) 상태에 동시에 접근하지 않도록 막으니까\(Swift가 근본적으로 보증하니까\)…

Actor Isolation은 ` Actor가 동시에 접근하지 않도록 막으니까 그걸 어떻게 하는건지 `에 대한 얘기이다\. 즉 ` Actor가 가변 상태를 보호하는 방법 `이다\.

```swift
actor BankAccount {
  let accountNumber: Int
  var balance: Double

  init(accountNumber: Int, initialDeposit: Double) {
    self.accountNumber = accountNumber
    self.balance = initialDeposit
  }
}
```

이렇게 BankAccount 라고 하는 actor가 있다\.

```swift
extension BankAccount {
  enum BankError: Error {
    case insufficientFunds
  }
  
  func transfer(amount: Double, to other: BankAccount) throws {
    if amount > self.balance {
      throw BankError.insufficientFunds
    }

    print("Transferring \(amount) from \(accountNumber) to \(other.accountNumber)")

    self.balance = balance - amount
    other.balance = other.balance + amount  // error: actor-isolated property 'balance' can only be referenced on 'self'
  }
}
```

이 BankAccount를 extension 해서 transfer\(amount: to:\)라는 메소드를 구현해준다\.

transfer 메소드의 balance를 업데이트 시키는 곳을 봐보자\. 만약에 BankAccount가 actor가 아니라 class였다면 위 코드는 문제가 없이 흘러가고, ` 비동기로 작동을 시키면 data race가 발생할 수 있다 `\. 왜냐하면 class 내부의 프로퍼티 balance의 값을 변화 시키니까\.

근데 지금은 actor라 컴파일러가 에러를 알려준다\. 

![](<../../assets/blog/actor-isolation-11d0d0f75cd68003871ac30d38ec04f2/image-001.png>)

other\.balance를 업데이트 시키는 쪽에서 컴파일 에러가 난다\. 왜냐하면 ` balance는 self에서만 참조될 수 있기 때문이다. `

그럼 여기서 알 수 있는 것은,

- ` actor 내부에서 정의된, 저장 프로퍼티, 연산 프로퍼티, 메소드, 서브스크립트는 기본적으로 actor-isolated 상태 `
- ` actor-isolated 친구들은 기본적으로 연결되거나 isolated된 특정 actor내에서만 접근할 수 있다. 즉 self를 통해서만 접근이 가능하다는 것이다. `

## cross\-actor reference

` actor 외부에서 actor-isolated 정의에 대해 참조 `하는 것

외부에서 참조가 가능하대\!

### 불변 상태\(let\)에 대한 cross\-actor reference

actor가 정의된 동일한 모듈의 어느 곳에서나 항상 허용

→ 한번 초기화 되면 해당 상태는 actor 내부에서는 외부에서든 수정할 수 없기 때문\)

```swift
actor BankAccount {
  let accountNumber: Int
  var balance: Double

  init(accountNumber: Int, initialDeposit: Double) {
    self.accountNumber = accountNumber
    self.balance = initialDeposit
  }
}
```

아까 여기서 other\.balance는 참조하면 에러가 났다\. 

하지만 other\.accountNumber는 참조해도 에러가 나지 않는다\. 왜냐하면 accountNumber는 let으로 선언되어 있기 떄문에 ` 불변 상태에 대한 cross-actor reference `에 해당한다\.

주의 해야할 사항은 actor가 정의된 ` 동일한 모듈의 어느 곳에서나 허용 `한다는 것이다\. 즉 ` 다른 모듈에서는 허용이 안된다. `

```swift
public actor BankAccount {
    public let accountNumber: Int
    public var balance: Double

    public init(accountNumber: Int, initialDeposit: Double) {
    self.accountNumber = accountNumber
    self.balance = initialDeposit
  }
}


// Same module
public class MyStaticLibrary {

    public init() {
        let account = BankAccount(accountNumber: 1, initialDeposit: 10)
        print(account.accountNumber)
    }
}
```

이렇게 같은 모듈에서는 되지만,

```swift
func outside_moudle_method() async {
    let account = BankAccount(accountNumber: 1, initialDeposit: 10)
    print(await account.accountNumber)
}
```

외부 모듈에서는 반드시 비동기 호출로 참조해야한다\.

왜냐면 account 상수가 var로 바뀌게 되면 반드시 비동기 호출만 되기 때문에\(외부에서 참조해야하니까\) BankAccount 모듈을 쓰는 클라이언트 코드가 싹 다 수정되어야 하기 때문에 그런 일이 발생하지 않도록 모듈 외부에서는 let이든 var든 비동기로 참조해야한다는 것이다\.

### 비동기 함수 호출로 수행되는 형식

비동기 함수 호출은 actor가 안전하게 수행할 수 있을 때 해당 작업을 실행하도록 요청하는 “메시지”로 바뀐다\. 이러한 메시지는 actor의 메일박스에 저장되고, 비동기 함수 호출을 시작한 호출자는 actor가 메일박스에 해당 메시지를 처리할 수 있을 때까지 suspend 될 수 있다\.\(await 때문에\) actor는 메일박스에 있는 메시지를 순차적으로 처리하므로 결론적으로 2개 이상의 동시에 실행되는 작업은 실행할 수 없다\. 즉 코드 자체에 동시성이 없어진다\. 

아까 오류가 났던 transfer 메소드를 다시 봐보자\.

```swift
func transfer(amount: Double, to other: BankAccount) throws {
  if amount > self.balance {
    throw BankError.insufficientFunds
  }

  print("Transferring \(amount) from \(accountNumber) to \(other.accountNumber)")

  self.balance = balance - amount
  other.balance = other.balance + amount // error: actor-isolated property 'balance' can only be referenced on 'self'
}
```

함수를 실행하면 내 잔액은 이체한 양만큼 줄어들어야하고, 다른 계좌의 잔액은 내가 이체한 양만큼 늘어나야한다\. 하지만 balance는 actor\-isolated 프로퍼티이기 때문에 self가 아니면 접근이 안된다\.

```swift
func deposit(amount: Double) async throws {
        assert(amount >= 0)
        balance += amount
}
```

이렇게 deposit이라는 메소드를 만들고 비동기 함수로 만들어준다\.

```swift
func transfer(amount: Double, to other: BankAccount) async throws {
  if amount > self.balance {
    throw BankError.insufficientFunds
  }

  print("Transferring \(amount) from \(accountNumber) to \(other.accountNumber)")

  self.balance = balance - amount
  await other.deposit(amount: amount)
}
```

그리고 other의 deposit을 호출해준다\. 

deposit이 async로 정의되어 있으니까 await로 호출해주고 transfer도 async로 정의해줘야한다\.

```swift
await other.deposit(amount: amount)
```

1. deposit이 메시지라고 치면,
1. other actor\(다른 종류의 actor\)이 메일박스
1. other actor는 메일 박스에서 작업을 검색하여 실행한다\.
   → 작업을 검색한다가 뭘까?
   
   > 💡 비동기 프로그래밍에서 특정 작업이나 요청을 처리하기 위해 큐에서 대기중인 작업을 가져오는 것
1. other의 balance가 업데이트 된다\.

## Compile\-time actor\-isolation checking

컴파일 타임에 이루어지는 actor\-isolation checking은 cross\-actor references인지 확인하고 위에서 설명한 두 가지 메커니즘 중 하나를 사용한다\. 이렇게 하면 actor 외부의 코드가 actor의 mutable state를 방해하지 않는다\. 

## Advanced

좀 더 나아가서 코드를 더 봐보겠다\.

```swift
func deposit(amount: Double) async throws {
        assert(amount >= 0)
        balance += amount
}
```

함수 내부를 보면 await를 호출하는 것도 아닌데… async throws는 빼도 될거 같다\.

```swift
func deposit(amount: Double) {
        assert(amount >= 0)
        balance += amount
}
```

엥 그럼 actor에서 await로 deposit을 호출했는데 async으로 해야하는거 아냐? 어 아니야\.

비동기에서 await \+ sync 함수를 호출하는건 컴파일 에러에 해당하지 않는다\. 

만약에 BankAccount가 class였다면 

![](<../../assets/blog/actor-isolation-11d0d0f75cd68003871ac30d38ec04f2/image-002.png>)

이런 경고가 떴을 것이다\. 하지만 actor로 해주면 이런 경고도 뜨지 않는다\.

BankAccount는 actor로 정의되어 있다\.

```swift
actor BankAccount {..}

extension BankAccount {
  func deposit(amount: Double) {
    assert(amount >= 0)
    balance = balance + amount
  }
}
```

deposit은 그런 actor 타입 내부의 sync 메소드이다\.

sync 메소드라고 하지만 actor 외부에서는 아래처럼 await 키워드와 함께 써줘야 한다\.

```swift
// actor 외부 
let account = BankAccount(accountNumber: 1, initialDeposit: 100)
await account.deposit(amount: 10)
```

actor 내부에서는 즉, self이면 동기적으로 호출할 수 있다\. 하지만 actor 외부에서 참조\. 즉 cross\-actor reference 일때는 비동기 호출을 해야한다\.

```swift
// actor 내부
func passGo() {
    self.deposit(amount: 200.0)
}
```

## 한계

아래 코드에는 한계가 존재한다\.

```swift
actor BankAccount {
  let accountNumber: Int
  var balance: Double

  init(accountNumber: Int, initialDeposit: Double) {
    self.accountNumber = accountNumber
    self.balance = initialDeposit
  }
  
  func deposit(amount: Double) {
    assert(amount >= 0)
    self.balance = self.balance + amount
  }
}
```

### deposit 메소드는 반드시 actor 내의 인스턴스로만 접근할 수 있다\.

예를 들어서, 어떤 계좌를 parameter로 주고 여기에 입금하라는 메소드로 사용할 수 있다\.

```swift
func deposit(amount: Double, to account: BankAccount) {
  assert(amount >= 0)
  account.balance = account.balance + amount
}
```

이렇게 global function으로 만들고 싶지만 안된다\. 이유는 balance를 참조할 때, balance는 actor\-isolated 프로퍼티이기 떄문이다\. 따라서 이부분은 cross\-actor reference에 해당한다\.

### actor 외부에서 동기적으로 사용할 수 있는 연산 프로퍼티를 만들 수 없다\.

```swift
actor BankAccount {
    let accountNumber: Int
    var balance: Double
    let accountName: String 

    var displayName: String {
        return self.accountName + "안녕하세요"
    }

    init(accountNumber: Int,
         initialDeposit: Double,
         accountName: String) {
        self.accountNumber = accountNumber
        self.balance = initialDeposit
        self.accountName = accountName
    }
}

let account = BankAccount(accountNumber: 1,
                          initialDeposit: 100,
                          accountName: "Zedd")
account.displayName // Actor-isolated property 'displayName' can not be referenced from a non-isolated context
```

다음과 같이 displayName은 accountName을 받아서 나타냅니다\.

그리고 actor 외부에서 BankAccount 인스턴스를 만들고 displayName을 호출하면 에러가 난다\. 위에서 얘기했듯 actor 내부에 정의된 저장,연산 프로퍼티, 인스턴스 메소드, 인스턴스 서브스크립트는 모두 actor\-isolated 이기 때문이다\. 따라서 이부분은 cross\-actor reference에 해당한다\. 

이부분은 displayName이 let이 아닌 var로 선언 되어있기 때문에 반드시 비동기로 호출해야한다\. 

```swift
await account.displayName
```

이러면 되는데 짜친다\.

### Hashable conform 불가

```swift
actor BankAccount {
    ... 
    
    static func someStaticThing() {
        //
    }
}

BankAccount.someStaticThing()
```

actor 내부에 정의된 static 메소드는 actor\-isolated 하지 않기 때문에 actor 외부에서 제약없이 호출이 가능하다\.

```swift
extension BankAccount: Equatable {
    
    static func == (lhs: BankAccount, rhs: BankAccount) -> Bool {
        return lhs.accountNumber == rhs.accountNumber
    }
}
```

BankAccount가 Equatable 프로토콜을 채택하고 필요한 static 메소드를 구현해줬다\. accountNumber를 통해 같은 값인지 비교하게 되는데, ==는 static 메소드이기 때문에 인스턴스가 없어 Actor와 분리되지 않는다\. 대신에 외부에서 두개의 Actor를 매개변수로 받아 처리한다\. 또한 accountNumber가 불변타입이기 떄문에 아무런 문제가 없다\. 물론 var 타입의 balance를 넣었다면 컴파일 에러가 발생했겠지만\.\.

이번엔 BankAccount가 Hashable을 채택하도록 해보겠다\.

```swift
extension BankAccount: Hashable {

    func hash(into hasher: inout Hasher) {
        hasher.combine(self.accountNumber) // Actor-isolated instance method 'hash(into:)' cannot be used to satisfy a protocol requirement
    }
}
```

왜 컴파일러가 날까?
Swift 컴파일러는 BankAccount가 Hashable을 준수했으니 hash\(into:\)는 actor 외부에서 호출될 수 있다 생각한다\. 하지만 hash\(into:\)는 비동기가 아니니까 actor\-isolated를 유지할 수 없다\. 즉 Hashable을 준수할 수 없습니다\.

## 원인

한계점들을 요약해보면,

1.  deposit 메소드는 반드시 actor의 인스턴스로만 접근할 수 있다\.
1. actor 외부에서는 동기적으로 사용할 수 있는 연산 프로퍼티를 만들 수 없다\.
1. Hashable을 적용할 수없다\.

이들의 이유는 모두 actor\-isolated 때문이다\.

그렇다면 이 actor\-isolated를 안하게 할 수 없을까? 

## isolated parameter

한계점 중 첫번째\. deposit을 global function으로 만들어보자\.

```swift
func deposit(amount: Double, to account: BankAccount) {
  assert(amount >= 0)
  account.balance = account.balance + amount // Actor-isolated property 'balance' can not be referenced from a non-isolated context
}
```

위 코드는 actor\-isolated property인 balance는 non\-isolated context에서 참조 될 수 없다고 에러를 낸다\.

이게 돌아갈라면 해당 함수가 isolated context를 가지게 하면 된다\.

```swift
func deposit(amount: Double, to account: isolated BankAccount) {
  assert(amount >= 0)
  account.balance = account.balance + amount
}
```

함수의 파라미터중 하나의 isolated가 표시가 되면 actor\-isolated가 된다\. 즉 deposit은 actor 외부에 정의되어있으므로 원래는 actor\-isolated가 아니다\. 근데 actor\-isolated로 만들어주는거지 ㅇ\.ㅇ

 

account 파라미터에 isolated를 표시하면서 deposit은 actor\-isolated 함수가 되었다\.  이제 deposit이 isolated context를 갖는다\. 그래서 account\.balance, 즉 actor\-isolated 상태에 직접 접근할 수 있게 된것이다\.

결론적으로 이건 isolated 아닌걸 isolated로 만드는거인거 같음\.

## nonisolated

한계점 중 두번째\. actor 외부에서 동기적으로 사용할 수 있는 연산 프로퍼티를 만들 수 없다\.

이러한 한계점을 해결하기 위한 nonisolated 키워드가 있다\.

```swift
actor BankAccount {
    let accountNumber: Int
    var balance: Double
    let accountName: String
    
    nonisolated var displayName: String {
        return self.accountName + "안녕하세요"
    }
        
    init() { ... }
}

let account = BankAccount(accountNumber: 1,
                                      initialDeposit: 100,
                                      accountName: "Doran")
print(account.displayName) // Doran안녕하세요
```

nonisolated 키워드를 붙이게 되면 actor에 정의된 저장,연산 프로퍼티, 인스턴스 메소드, 인스턴스 서브 스크립트는 기본적으로 actor\-isolated 상태인데 이를 비활성화 할 수 있다\.

그럼 전부다 nonisolated 하면 안되나? 

```swift
actor BankAccount {
    nonisolated let accountNumber: Int
    nonisolated var balance: Double // Nonisolated' can not be applied to stored properties
    nonisolated let accountName: String
    
    nonisolated var displayName: String {
        return self.accountName + "안녕하세요"
    }
}
```

var가 붙으면 concurrent code에서 data race가 발생할 수 있으므로 안된다\.

```swift
extension BankAccount: Hashable {
    
	nonisolated func hash(into hasher: inout Hasher) {
    hasher.combine(accountNumber)
  }
}
```

nonisolated로 한계점 중 세번째도 해결할 수 있다\.

이거는 isolated 인걸 nonisolated로 만드는거인거 같음\.

## 주의사항

actor안에 정의되어있는 인스턴스 메소드를 nonisolated 하기 전에는 주의해야한다\.

```swift
extension BankAccount {
    func steal(amount: Double) {
      self.balance -= amount 
    }
}
```

위의 코드는 self를 통해서 actor\-isolated 프로퍼티인 balance에 잘 접근했다\.

```swift
extension BankAccount {
    nonisolated func steal(amount: Double) {
      self.balance -= amount // error: actor-isolated property 'balance' can not be referenced on non-isolated parameter 'self'
    }
}
```

이렇게 nonisolated로 바꾸면 더이상 self에도 접근하지 못하게 된다\.

```swift
actor BankAccount {
    public nonisolated let accountNumber: Int
    ...
}

// 다른 모듈
func outside_moudle_method() {
    let account = BankAccount(accountNumber: 1, initialDeposit: 10)
    print(account.accountNumber) 
}
```

이렇게 nonisolated로 프로퍼티를 바꿔버리면 다른 모듈에서도 동기적으로 참조가 가능하다\.

## 참고

<a class="notion-resource-card" href="https://zeddios.tistory.com/1303#google_vignette"><span class="notion-resource-label">링크</span><span>https://zeddios.tistory.com/1303#google_vignette</span></a>

<a class="notion-resource-card" href="https://zeddios.tistory.com/1304"><span class="notion-resource-label">링크</span><span>https://zeddios.tistory.com/1304</span></a>

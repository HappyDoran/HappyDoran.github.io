---
schemaVersion: 2
title: "WWDC) Swift concurrency: Behind the scenes"
description: "WWDC) Swift concurrency: Behind the scenes"
tags: ["Swift", "동시성"]
publishedAt: "2024-10-27T07:58:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 46
---

## Threading Model

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-001.png>)

뉴스 피드 리더 앱을 구현한다 했을 때, 다음과 같은 구성 요소가 필요하다\.

- User Interface를 처리할 메인 스레드
- User가 구독한 뉴스 피드를 추적할 데이터 베이스
- 피드에서 최신 콘텐츠를 가져올 네트워크

### GCD

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-002.png>)

User가 loadNewsFeeds\(\)를 호출 하게 되면 메인 스레드에서 일어나는 User의 제스처를 받아서 ` Serial Dispatch Queue `에 ` async `하게 동작을 넘긴다\. 

- 다른 큐에서 작업을 뽑아옴으로써 많은 양의 작업일지라도 메인 스레드가 User의 동작을 계속 받을 수 있도록 하기 위해서 Serial Dispatch Queue에서 받는다\.
- 또한 Serial Dispatch Queue를 사용함으로써 상호 배제를 보장하기 때문에 데이터베이스에 대한 접근이 보호된다\.

` → 메인 스레드는 유저의 input을 받을 준비를 해야되고, Serial Queue는 상호 배제를 보장하기 때문에 Database의 접근을 막을 수 있어서 안전하다. `

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-003.png>)

데이터 큐인 Serial Queue안에서 User가 구독한 뉴스 피드에 대해 비동기 요청을 반복하며, 네트워크 요청을 하도록 URLSession에 넘긴다\.

` → loadNewFeeds()는 네트워크에게 반복을 통하여 여러개의 task를 던진다. `

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-004.png>)

네트워크 응답이 오면 Concurrent Queue인 delegate Queue에서 URL Session 콜백이 실행된다\.

` → 동시 큐를 사용함으로써 병렬적인 코드 실행을 적용시켜 효율적으로 동작하게 한다. `

그 다음 ` 콜백에서는 받은 결과를 데이터 큐인 Serial Queue로 작업을 넘긴다. `

- 이 경우에는 순차적으로 진행되기 때문에 data race는 발생하지 않는다\.
- 나중에 사용할 수 있도록 캐시 처리를 한다\.

마지막으로 메인 스레드에 해당 결과를 반영해서 UI를 업데이트 한다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-005.png>)

이러한 흐름을 코드로 구현해보면 다음과 같다\. 하지만 이 코드는 성능 측면에서 숨겨진 함정이 있다\.

#### GCD and thread bring up

이 문제를 이해하기 위해서는 GCD Queue가 어떻게 작업을 처리하는지 알아야 한다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-006.png>)

GCD에서 큐에 work가 들어오면 시스템은 thread를 가져와서 해당 work들을 해결한다\. 근데 이게 동시큐일 경우에는 여러 개의 CPU가 스레드를 가져와서 work를 해결한다\. 

근데 이제 위에 처럼 하얀색 줄로 ` Thread Block `이 일어나게 되면 남은 work를 해결하기 위해서 시스템은 새로운 스레드를 가져온다\.

- 이러면 이제 ` 가져온 스레드에게 처리 권한을 넘겨 `서 일을 할 수 있군\.
- 블록된 스레드는 다음 처리를 위해 semaphore처럼 리소스를 기다리고 있는데, 새로 가져온 스레드가 블록된 스레드가 ` 기다리고 있는 리소스를 unblock ` 해줄 수 있겠다\.

###  CPU Execution

이렇게 두개의 코어가 있다고 생각해봅시다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-007.png>)

- 코어가 2개 이므로 GCD는 피드 업데이트 결과를 처리하기 위해서 먼저 두개의 스레드를 가져온다\.
   - 위와 아래의 두개의 CPU에서 각각 스레드를 가져오겠죠\.
- 스레드가 데이터베이스 큐\(sync\)를 호출하고 있기 때문에 해당 task는 block된다\.
- 데이터베이스 큐의 접근이 block됐으니 네트워킹 큐에서 계속 작업하기 위해서 더 많은 스레드가 생성된다\.
- 또 그안에도 데이터베이스 큐가 있으니 block되고,,,
- 이 과정에서 CPU는 다른 스레드간의 문맥 교환\(하나의 프로세스가 CPU를 사용중인 상태에서 다른 프로세스가 CPU를 사용하기 위해 이전 상태를 보관하고 새로운 프로세스 상태를 적재하는 작업\)을 수행한다\. 즉 우리가 작성한 코드에서 많은 스레드가 발생하고 성능이 저하된다\.

### Excessive concurrency

이 상황에서 스레드가 차단될 때마다 새로운 스레드를 가져온다\. 그러면 CPU의 코어 갯수보다 더 많은 스레드가 가져오게 되므로 스레드가 폭발하는 ` 스레드 오버커밋 ` 이 발생할 수 있다\.

#### Memory overhead

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-008.png>)

block된 스레드는 결국 나중에 돌아와서 본인의 작업을 수행해야 한다\. 이때 작업 중단 상태를 메모리에 저장을 한다\. 각각의 스레드에는 실행 흐름을 저장하는 stack이 있고, 그와 관련된 kernal 자료구조가 스레드를 추적한다\. 이렇게 당장은 동작하지 않는 스레드들이 메모리에 적재 되있으니까 memory와 자원을 붙잡는 상태가 벌어진다\.

#### Scheduling overhead

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-009.png>)

이렇게 과도한 문맥 교환은 중요한 처리를 늦게 하게되는 결과를 만들 수 있다\. 즉 CPU가 효과적으로 동작하는 것을 방해한다\.

### Swift Concurrency

위처럼 스레드 폭발은 GCD에서 발생할 수 있는 문제이다\. 이래서 Swift Concurrency가 등장한다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-010.png>)

- 코어에 수에 맞게 스레드를 사용한다\.
   - 이러면 이제 Block되는 스레드가 없어진다\.
   - 문맥 교환도 없어진다\.
- 대신에 가벼운 Object인 Continuation\(` 높은 수준의 안전한 방식의 작업을 suspend, resume(일시정지 되어 있다가 다시 실행), suspend, resume 할 수 있는 기능 `\)을 사용한다\.
   - 작업 재개 여부를 추적한다\.
   - Continuation간의 switching이 발생한다\.

즉 Swift concurrency에서는 런타임에 코어수만큼의 스레드를 생성하여 저렴하고 효율적으로 block과 Switching을 진행한다\. 

## Language features

Swift의 Concurrency에서는 스레드가 block되지 않을 것이라는 운영체제에는 Runtime 계약이 필요하다\. 그래서 이러한 언어적인 특성이 필요하다\. 

### await and non\-blocking of threads

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-011.png>)

- await는 비동기 대기
- 비동기 함수의 결과를 기다리는 동안 현재 스레드를 차단하지 않는다\.
- 대신에 함수가 일시 중단되고 스레드가 해제되어 다른 작업을 실행할 수 있다\.

#### Async functions

프로그램에서 동작하는 모든 스레드는 함수 call 상태를 저장하기 위한 stack을 가지고 있다\.

일단은 sync 함수를 봐보자\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-012.png>)

예를 들어서 하나의 함수가 call되면 이렇게 새로운 프레임\(지역 변수 저장, 반환 주소 전달, 다른 기타 용도로 사용됨\)이 stack에 push 되고, 함수 동작을 마치고 반환하면 pop된다\.

그럼 이제 async 함수를 봐보자\.

```swift
func updateDatabase(with articles: [Article], for feed: Feed) async throws {
    
    try await feed.add(articles) 
}


func add(_ newArticles: [Article]) async throws {
    let ids = try await database.save(newArticles, for: self) 
    
    for (id, article) in zip(ids, newArticles) { 
        articles[id] = article
    }
}


func save(_ newArticles: [Article], for feed: Feed) async throws -> [ID] 
```

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-013.png>)

add 함수는 await가 찍혀진 곳 외에는 일시정지하는 포인트가 없다\. 그리고 지역 변수인 id와 article은 일시정지하는 포인트에서 사용되지 않으므로 stack에 저장된다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-014.png>)

근데 await는 일시정지하는 포인트를 생성해서 함수가 잠깐 멈춘다\. 따라서 await의 앞, 뒤 정보를 저장하는 공간이 필요한데 이거를 이제 heap에 저장한다\. 위 코드에서는 add를 위한 비동기 프레임이 heap에 생성되고, newArticles처럼 await 전에 정의가 되었지만, await이후에 zip 함수에서 계속 활용이 되기 때문에 heap 프레임에 저장된다\. ` 쉽게 말하면 add의 비동기 프레임이 newArticles을 계속 추적 한다는 의미다. `

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-015.png>)

그리고 이제 await [database\.save](<http://database.save/>) 함수가 실행되기 시작하면, ` add의 stack frame은 save stack 프레임으로 대체가 된다. ` 미래에 필요한 변수들, 즉 위에서 추가를 해놓았던 newArticles같은 변수는 이미 add에 저장되있기 때문에 새로운 프레임을 위로 쌓아 올리는 것이 아니라 ` 기존에 있던 프레임중 가장 최상단에 있는 stack frame을 교체시키는거다. `

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-016.png>)

save 내에서 await 함수가 호출되는 코드가 있다고 해보자\. 그러면 이제 save도 자신만의 async frame을 가지게 된다\. 

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-017.png>)

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-018.png>)

await를 만나게 되면 save 함수는 suspend 되고 스레드의 제어권은 시스템으로 넘어간다\. 그리고 스레드는 block되는게 아니라 다른 일을 처리한다\. 아까 newArticles 같은 변수는 heap에 저장이 되기 때문에 나중에 실행을 재게할 때 사용될 수 있다\. 이러한 async 프레임의 리스트는 continuation의 대표적인 예시이다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-019.png>)

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-020.png>)

다른 일을 한 이후에 스레드는 다시 돌아오고 이때 이 스레드는 이전과 동일한 스레드 일수도 있고 아닐수도 있다\. save 함수가 실행이 끝나면 id를 반환하고 stack 프레임의 최상단은 다시 add로 대체된다\. 그리고 스레드는 zip 함수를 실행한다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-021.png>)

zip 함수는 동기함수이기 때문에 새로운 스택 프레임을 생성한다\. zip 함수가 끝나면 스택 프레임은 pop된다\.

### Tracking of dependencies in Swift task model

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-022.png>)

위의 코드에서 URLSession data task는 비동기 함수이다\. 그리고 그 뒤의 일은 continuation이다\. 

articles 상수에 값이 할당되고, 할당된 값이 updateDatabase의 파라미터가 될라면 URLSession의 결과로 data 상수의 값이 할당 되어야 한다\. 즉 ` 비동기 함수가 완료된 후에만 실행될 수 있는 것이 continuation `이라고 한다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-023.png>)

위의 코드는 작업 그룹 내에서 부모 Task는 여러 자식 Task를 만들 수 있으며, 각 자식의 Task를 완료해야 부모 Task를 진행할 수 있다\. 이것은 Task 그룹의 범위에 의해 코드에서 표현된다\. 따라서 Swift 컴파일러 및 런타임에 명시적으로 알려져있다\.

## Cooperative thread pool

이런 과정을 통해 스레드는 task 의존성에 대해 추론할 수 있고, 다른 task를 선택할 수 있다\. 즉, 위의 과정들을 통해서 thread가 항상 무언가를 처리할 수 있는 runtime 계약을 달성했다\. 

- thread pool은 CPU 코어 수만큼만 가질 수 있고,
- thread explosion을 피하고, 과도한 context switching을 방지하고,
- 낱알처럼 흩어진 concurrency를 제어한다\.

## Adoption of Swift Concurrency

이제 Swift 동시성을 위한 스레드 모델에 대해 이해했으니까, 이러한 동시성을 사용하면서 염두해야할 사항을 알아보자\.

### Performance

#### Concurrency comes with costs

Concurrency는 비용에 따라서 쓰여야 할 때 안쓰여야 할 때를 고려해야한다\. 무슨말이냐면 ` Concurrency를 도입해서 얻는 비용이 코드를 코드를 관리하는 비용을 넘는 경우 `에만 이를 도입해야한다는 뜻이다\.

```c++
async let isThumbnailView = userDefaults.bool(forKey: "ViewType")

if await isThumbnailView {

} else {

}
```

이렇게 userDefaults의 값을 읽어오는데 굳이 비동기를 사용해서 낭비할 필요가 없다\. 

#### await and atomicity

Swift는  await 전에 실행된 스레드와 이후에 실행되는 스레드가 같은 것을 보장해주지 않는다\. 무슨 말이냐면 await 전에 실행되는 작업 공간이 await 이후에 실행되는 작업 공간이 달라질 수도 있다는 것이다\. ` await는 코드에서 작업이 자발적으로 취소될 수 있으므로 작업의 원자성이 깨졌다는 것 `으로 표현할 수 있다\. 따라서 await중에 lock을 하지 말자\. 원래 쓰던 스레드로 돌아오는지 보장이 안되니까 재검토를 해야 한다\. 

#### Runtime contract

Swift를 사용하면 언어를 통해 스레드가 항상 앞으로 나갈 수 있다는 런타임 계약을 유지할 수 있다\. 스레드의 개수를 제한하고서, 각 task에서 continuation을 통해 동작하며 앞으로 나아가게 하기 때문에, 이 관리는 매우 중요하다\. 즉 협력적인 thread pool에서 돌아가게끔 해야하는 것이다\.

## Synchronization via Actor

### Mutual exclusion

> 💡 <strong>Actor</strong>
> <strong>상호배제 \- 한번에 하나의 메서드를 호출, 데이터 경합 방지</strong>

Actor의 예시를 생각해보면 DataBase는 직렬큐로 실행이 되고, 그 안에서 네트워킹은 비동기로 실행이 되었다\. 일단은 데이터 경합은 일어나지 않는다\. 하지만 이때 문제를 생각해보면 실행될 스레드를 계속 요청한다\. 그렇게 되면 계속되는 컨텍스트 변환이 생기게 되고 문제가 생기지\. 이를 막기 위해 actor를 사용한다\. 

actor를 사용하게 되면 컨텍스트 변환도 안생기고, 스레드도 CPU 갯수만큼만으로 동작이 가능하다\. 스레드를 재사용 하기 때문이지\. 그리고 actor는 내부의 메서드는 동기처럼 작동하기 때문에 Data race도 발생하지 않는다\.

 

#### Actor hopping

예시를 보자\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-024.png>)

이렇게 database와 networking을 처리했던 subsystem이 있다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-025.png>)

Swift의 Concurrency를 사용하도록 애플리케이션을 업데이트를 하면, 데이터베이스의 직렬큐는 데이터베이스 actor로 바뀐다\. 그리고 동시큐는 각각에 해당되는 actor로 바뀐다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-026.png>)

이것들은 다 이제 협력적인 thread pool에서 동작한다\. 이걸 actor hopping process라 한다\. 

#### Actor hopping process 작동 방식

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-027.png>)

Sports feed를 위한 actor가 cooperative thread 위에서 동작하고 있다고 생각해보자\. 이 feed는 몇가지의 article을 DB에 저장하고 싶다\. 그리고 Database actor는 아직 실행되지 않았다 쳐보자\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-028.png>)

실행되면 이렇게 hopping이 된다\. 여기서 주목할 점은 ` thread는 block되지 않았고, 일처리를 하기 위해 다른 thread가 필요 없다는 것 `이다\.

runtime에서 직접적으로 sport feed actor를 위해 work item을 suspend할 수 있다\. 그리고 database actor를 위해 ` 새로운 work item을 만들 수 있다. `

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-029.png>)

이렇게 DB에 넣는 작업을 하고 어느정도 실행이 되었지만, 아직 안끝났다고 해보자\. 그리고 이 순간에 weather feed actor가 DB에 저장하려고 시도하는 상황이 있다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-030.png>)

이런 경우에 database actor를 위해서 ` 새로운 work item이 생성된다. ` actor는 상호배제를 보장하기 때문에 하나의 work item이 주어졌을 때만 활성화 된다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-031.png>)

actor는 스레드를 block하지 않기 때문에, 이와 같은 상황에서 weather feed는 suspend 될 것이다\. 그리고 thread는 다른 작업을 수행한다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-032.png>)

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-033.png>)

sport feed 일\(D1\)이 끝나면 database actor에서 활성화 된 work item은 제거된다\. 

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-034.png>)

그리고 다음 work item인 D2를 시작한다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-035.png>)

또는 Suspended 된 feed actor중 하나를 골라서 실행할 수 있다\. 

### Reetrancy and prioritization

비동기 작업이 많고 특히 Data race가 많은 경우 시스템은 어떠한 작업이 더 중요한지에 따라 절충해야 한다\. 이상적으로는 user interaction과 같이 최우선순위의 work가 backup과 같은 work에 비해 우선적으로 진행되는 것이 좋다\. 

Actor는 Reetrancy이라는 개념 때문에 시스템이 work의 우선순위를 잘 정할 수 있도록 설계되었다\. 그전에, 왜 reentrancy가 여기서 중요한지 알아보자\.

#### Serial dispatch queues

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-036.png>)

당장 화면에 표시되는 정보를 가져오는 우선순위가 높은 작업을 database에게 요청한다고 생각해보자\. 그리고 다음으로는 iCloud에 backup을 하는 우선순위에서 상대적으로 밀리는 작업을 요청하자\. 그러면 이러한 순서대로 queue에 위에 같이 쌓이게 될 것이다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-037.png>)

Dispatchqueue는 FIFO이기 때문에 들어간 순서대로 일이 처리된다\. 이 말은 item A가 실행되고, 1,2,3,4,5가 실행되고 item B가 실행되어야 함을 뜻한다\. 이를 우선순위 역전이라고 한다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-038.png>)

Serial Queue는 높은 우선순위의 작업보다 앞의 Queue의 우선 순위를 높임으로써 우선순위 역전을 방지한다\. 하지만 이러면 B는 앞에 work가 다 수행된 이후에 수행된다\. 이러한 문제점에서 actor reentrancy가 고안되었다\.

#### Actor reentrancy

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-039.png>)

database actor가 thread위에서 동작하고 있다 생각해보자\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-040.png>)

database actor는 suspended 되었고, 그 자리를 Sports feed actor가 차지했다고 생각해보자\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-041.png>)

이 work는 얼마지나지 않아서 동작을 완료하고 database actor에게 article을 저장해달라고 요청했다\. actor hopping에 따라서 D1이 있음에도 불구하고 스레드에 database actor를 hopping할 수 있다\. 

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-042.png>)

위 상황에서 database\.save가 실행되기 위해서는 새로운 work item이 database actor를 위해 생성되어야 한다\. 이걸 actor reentrancy라 한다\. actor에 올려진 새로운 work item이 하나 혹은 하나 이상의 이전 작업이 suspend된 상태에서 앞으로 진행할 수 있도록 만들어주는 동작을 actor reentrancy라 한다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-043.png>)

어느정도 시간이 지난 후에, D2는 실행을 마친다\. D2가 D1보다 나중에 생성되었음에도 불구하고 먼저 작업을 끝마칠 수 있다\. 

이러한 Actor reentrancy는 어떻게 결정되는 걸까?

#### Actor reprioritization

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-044.png>)

A가 실행이 된다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-045.png>)

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-046.png>)

actor reentrancy에 따라서 runtime은 최우선 순위의 work item을 queue의 맨 앞으로 옮긴다\. 이렇게 우선순위 역전 문제를 해결하여 효과적인 스케쥴링이 가능하다\.

### Main actor

main actor는 시스템의 기존 개념인 메인 스레드를 추상화하기 때문에 다르다\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-047.png>)

```swift
// on database actor
func loadArticle(with id: ID) async throws -> Article { /* ... */ }

@MainActor func updateUI(for article: Article) async { /* ... */ }

@MainActor func updateArticles(for ids: [ID]) async throws {
    for id in ids {
        let article = try await database.loadArticle(with: id) 
        await updateUI(for: article)
    }
}
```

UI를 업데이트 할 때 우리는 메인 스레드에서 작업을 해야한다\. 그리고 이 작업은 context switching을 요한다\. 

database로부터 article을 로드하고 각 기사를 UI에 업데이트하는 위의 코드가 있다\. 각각의 for loop에서 적어도 두번의 context switching이 일어난다\.

\(main actor → database actor, database actor → main actor\)

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-048.png>)

루프의 반복 횟수가 적으면 뭐 상관없다\. 하지만 이 반복이 자주 발생하는 경우에는 오버헤드가 누적된다\. 

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-049.png>)

이러면 최악임\.

![](<../../assets/blog/wwdc-swift-concurrency-behind-the-scenes-12c0d0f75cd680f782d0df79257432be/image-050.png>)

cooperative pool에서 actor들 간의 hopping은 빠르지만, 앱을 작성할 때는 여전히 main actor와의 hopping을 염두해 둬야한다\.

## 결론

Swift concurrency는 성능, 가독성, 안정성을 모두 고려한 방법이다\.

- ` await ` 근처에서는 suspension이 일어난다\.
- Thread의 blocking이 없으며, async하게 동작하는 경우 heap에 다음 처리 과정에 대한 정보를 저장한다\.
- 그렇기에 thread의 동작이 돌아올 때 같은 thread라는 보장이 없다\.
- actor는 상호배제를 보장하는 방법이다\.
- 유연한 FIFO 구조를 가져, 우선순위 변경이 가능하다\.
- main actor는 main thread와 관련있다\.

## 참고

<a class="notion-resource-card" href="https://velog.io/@wansook0316/Swift-ConcurrencyBehind-the-scenes-Part.-01"><span class="notion-resource-label">링크</span><span>https://velog.io/@wansook0316/Swift-ConcurrencyBehind-the-scenes-Part.-01</span></a>

<a class="notion-resource-card" href="https://velog.io/@wansook0316/Swift-ConcurrencyBehind-the-scenes-Part.-02"><span class="notion-resource-label">링크</span><span>https://velog.io/@wansook0316/Swift-ConcurrencyBehind-the-scenes-Part.-02</span></a>

<a class="notion-resource-card" href="https://developer.apple.com/videos/play/wwdc2021/10254/"><span class="notion-resource-label">링크</span><span>https://developer.apple.com/videos/play/wwdc2021/10254/</span></a>

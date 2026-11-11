---
schemaVersion: 2
title: "WWDC) Meet async / await in Swift"
description: "Meet async / await in Swift"
category: "미분류"
categorySlug: "uncategorized"
tags: ["Swift", "동시성"]
publishedAt: "2024-09-29T12:02:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 30
---

## Meet async / await in Swift

Swift에서 async / await를 사용하여 쉽고 빠른 비동기 코드를 작성할 수 있다\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-001.png>)

async / await 이전에는 위와 같이 completionHandler나 delegate 패턴을 사용하여 비동기 처리를 했었다\.

 

> 💡 **💡Delegate 패턴?**
> 
> 처리해야될 일을 다른 컨트롤러에게 위임하는 패턴

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-002.png>)

첫번째 스레드는 synchronous 코드이며, 함수가 실행되면 이 스레드를 블록하고 작업을 완전히 마치면 다음 작업을 순차적으로 수행한다\.

두번째 스레드는 asynchronous 코드이며, 함수가 진행되고 있는 동안 해당 스레드를 블록하지 않고 다른 일을 할 수 있도록 한다\. asynchronous 작업이 완료되면 completionHandler를 실행해서 비동기 작업이 끝났음을 알려준다\. 

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-003.png>)

다음은 앱에서 여러개의 이미지를 서버에서 받아올 때 이미지들이 순차적으로 로딩되는 것을 코드로 작성했을 때의 흐름이다\. 

- thumbnailURLRequest
   \- URL을 통해 썸네일의 이미지를 요청하기 위한 URLRequest를 생성한다\. ` (빠르게 처리) `
- dataTask
   \- URLSession의 dataTask 메서드에서 URLRequest에 대한 데이터를 가지고 온다 ` (이미지 데이터를 가져오는데 만약에 이미지의 크기가 크다면 상당히 오래 걸릴 것임) `
- UIImage
   \- 가지고 온 데이터를 가지고 이미지를 만듬 ` (이미지를 만들어주는건 쉽지 ㅇ.ㅇ) `
- prepareThumbnail
   \- 만들어진 이미지를 prepareThumbnail 함수를 통해 썸네일로 만들어서 화면에 보여줌 ` (이미지를 썸네일로 만드는 작업에 비동기 코드가 들어가있음) `

이렇게 오래 걸리는 코드와 빠르게 처리되는 코드가 있는데 우리가 굳이 순차적으로 처리할 필요가 없다\. 이미지를 다운로드하는 동안 다른 작업을 수행하고, 이를 위해서는 비동기 코드를 작성하면 된다\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-004.png>)

이렇게 비동기 코드를 작성하면 되는데 대략적으로 설명하면,

dataTask 메서드를 통해서 비동기로 이미지를 가져오는 곳에서 여러가지 예외를 조건문으로 분기하고 해당 예외에 맞는 에러를 completion Handler를 통해서 함수가 종료되었음을 알려준다\. 또한 guard let 구문을 사용하여 오류가 발생하면 걸러내는 작업도 한다\. 

completion Handler를 사용하면 이렇게 어떤 상황이 발생하더라도 원하는 작업이 수행될 수 있다\. ` 단, 모든 예외사항에서 completion Handler를 사용해줘야함. 매우 귀찮... ` 

위와 같이 에러를 포함하여 5개의 completion 메서드를 호출해야지만 원하는 작업을 만들 수 있기 때문에 코드가 더럽다\.

async / await를 사용하면 이럴 일이 없다\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-005.png>)

함수 선언부에 async 키워드가 있다\. 그리고 에러를 처리하기 위한 throws도 함께 있다\. 

위에서 설명을 한 것 처럼 URLRequest는 동기 코드니까 그냥 쓰면 되고, 
data 메서드로 데이터와 HTTPResponse를 받아오는데 이는 비동기 코드이기 때문에 await를 붙여주고 오류를 뱉을 수도 있으니 guard와 throw를 사용해준다\.

URLRequest와 UIImage의 경우에는 동기 코드이기 때문에 ` 스레드를 차단한 상태(이 작업 외에는 다른 작업이 스레드에 들어올 수 없음)로 작업을 진행 `하고 이 ` 작업이 끝난 후에 다른 작업이 수행 `된다\.

data 메소드와 thumbnail 프로퍼티 같은 경우에는 비동기 코드이기 때문에 ` 스레드를 열어둔 상태(이 작업을 수행하는 동안 다른 작업들이 스레드에 들어와서 작업을 할 수 있음)로 작업을 진행 `한다\.

에러도 그냥 에러가 발생하면 에러를 던져버리면 된다\. 코드는 순서대로 작성되었으며, 에러처리도 쉬운 기가막힌 코드가 탄생한 것이다\.

근데 이상한게… 비동기 함수는 들어봤어도 비동기 프로퍼티는 뭐지? 

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-006.png>)

이렇게 프로퍼티에 async 키워드가 붙어있는 경우에는 비동기 프로퍼티를 사용할 수 있다\. 물론 ` 읽기전용 프로퍼티 `에서만 사용이 가능하다\.

이외에도 for in 루프에서 async를 사용할 수 있다\. async sequence는 item을 비동기적으로 제공한다는 점을 제외하고는 일반적인 sequence와 동일하다고 한다\.

` → 반복문을 돌릴 다음 요소가 준비될 때 까지 스레드를 열어둔다.(다른 작업 가능) `

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-007.png>)

그럼 이렇게 async 함수를 실행하다가 await 키워드를 만나면 어떤 일이 발생하는지 살펴보자\. 

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-008.png>)

동기 함수의 경우 호출하면 스레드에 대한 제어권도 같이 해당 함수에 넘겨준다\. 그리고 호출된 함수는 ` 자신의 작업이 끝날 때까지 이 제어권을 가지고 있는다. ` 함수가 종료\(즉 에러를 뱉거나, 정상적으로 값을 반환하거나\)되면 스레드를 다시 호출자에게 반환한다\. 

> 💡 **스레드 제어권의 순서
> 
> 호출자 → 동기 함수 → 함수가 끝나면 호출자
> 
> ****호출자 \- 사람 :  소프트웨어, 프로세스 안에 있는 존재, 함수 같은 것들, 뷰의 컴포넌트 같은 것 등
> 시스템 \- 운영체제 : 소프트웨어, 프로세스 바깥에 있는 존재이면서 관리하는 존재**

비동기 함수의 경우에는 어떨까?

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-009.png>)

비동기 함수의 경우 처음 시작은 동기 함수와 동일하다\. 함수가 호출되면 스레드에 대한 제어권도 같이 넘겨준다\. 그러다가 await 키워드를 만나게 되면 suspending\(일시 정지\)를 통해 스레드를 반환한다\. 이 때 스레드를 반환을 호출자에게 하는게 아니라 시스템에게 반환한다\.` (동기 함수와 다른 점) ` 따라서 시스템은 해당 스레드를 활용하여 다른 작업들을 수행하다가 어느 시점이 되면 시스템이 다시 비동기 함수에게 스레드 제어권을 넘겨준다\. 비동기 함수가 실행을 마치고 에러나 결과를 반환하면 스레드 권한을 다시 호출자에게 넘긴다\.

> 💡 **스레드 제어권의 순서
> 
> 호출자 → 비동기 함수 → await 만나면 시스템 → ****어느 시점****되면 비동기 함수 → 함수가 끝나면 호출자
> 
> ****어느 시점이라는 것은 스케쥴링에 따라서 달라지는 그런 시점을 말하는 것인가?
> TaskPriority만으로는 결정되지 않는 무언가**

일시정지, 즉 await를 만나면 어떻게 될까? 

```swift
func fetchThumbnail(for id: String) async throws -> UIImage {
    let request = thumbnailURLRequest(for: id)
    let (data, response) = try await URLSession.shared.data(for: request)
    guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw FetchError.badID }
    let maybeImage = UIImage(data: data)
    guard let thumbnail = await maybeImage?.thumbnail else { throw FetchError.badImage }
    return thumbnail
}
```

아까 말한대로 스레드를 시스템에 반환하고, 시스템은 [URLSession\.shared\.data](<http://urlsession.shared.data/>) 메서드에 대한 작업을 예약한다\. 이 경우 운영체제 시간에 배운 스케줄링 기법처럼 흘러가는 듯 보인다\. 시스템에게 반환할 때 말하는거지

**“바쁜거 알고 있는데 무엇이 가장 중요한지 결정하세요”**

어느 시점이 되면 시스템은 수행해야 할 가장 중요한 작업이 이전에 일시 중단된 비동기 기능을 계속 하는거라고 결정할 것이다\.

정리해보면 URLSession\.shared\.data\(\)는 비동기 메소드이고, 이게 suspend 된다고 가정해보자\.

suspend된 시점에서 스레드의 제어권은 시스템이 갖고 있으며, fetchThumbnail\(\) 함수도 suspend 되었다\.

근데 어떤 경우에 이게 일시중단 되는걸까?

fetchThumbnail\(\)이 실행되고 있는 동안에, 사용자가 어떤 게시물에 좋아요 버튼을 계속 누른다고 해보자\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-010.png>)

그럼 시스템은 대기중인 data\(\) 대신 사용자의 반응에 대한 작업을 먼저 수행시킬 수도 있다\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-011.png>)

해당 메서드는 업로드하는 작업을 수행하게 되는데 위와 같이 시스템에 반환된 스레드로 해당 작업을 실행할 수 있다\. 이렇게 수행하다가 데이터 다운로드를 마치면 반환되어 호출자로 돌아가 다음 작업을 수행하게 된다\.

이렇게 함수가 일시정지된 상태에서 다른 작업들이 수행될 수 있기 때문에 앱 상태가 일시정지 중에 변할 수 있음을 유의해야 한다\. 즉 async / await 블록은 하나의 트랜잭션으로 실행되지 않는다는 것을 알 수 있다\. 또한 반환한 스레드가 아닌 다른 스레드에서 실행될 수도 있다\. 이는 공유자원이 보호될 수 없을 수도 있음을 의미하며 이를 해결하기 위해서 Actor라는 것이 있다\.

→ 일시정지된 상태에서 값이 변할 수도 있기 때문에 Actor를 사용하여 동시성을 막고 데이터 경질을 막는다\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-012.png>)

- 함수에 async를 작성하면 ` 일시정지 ` 할 수 있다\. 이 경우 ` 자신을 호출한 호출자도 일시 정지 `된다\. 따라서 호출자도 async로 정의되어 있어야 한다\.
- 비동기 함수에서 ` 일시정지될 수 있는 위치를 알리기 위해 await 키워드를 사용 `한다\.
- 비동기 함수가 일시정지되는 동안 스레드는 ` 시스템에게 반환되어 다른 작업을 수행 `할 수 있다\. 즉 앱의 상태가 원하지 않게 변할 수 있다\.
- 비동기 함수가 다시 시작되면 ` await 키워드 다음 부분부터 다시 실행 `된다\.

## Migration with async / await

### Testing

async / await가 생겨나면서 이전에 만들어뒀던 completion handler나 delegate 패턴들을 수정해줘야 하는 일이 있다\. 그중에 Testing 코드에 대해서 말하겠다\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-013.png>)

Swift에서는 테스트 코드를 위해 XCTest 프레임워크를 제공합니다\. 위의 코드는 XCTest를 활용해서 만든 async / await를 적용하기 전 코드이다\. wait라는 함수를 사용해서 함수로 특정 작업들이 성공했는지 확인하는 코드인데 이게 임의로 시간을 설정해야하니까 짜친다\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-014.png>)

이제 이렇게 async / await를 사용해서 짧고 직관적인 코드가 가능하다\. 작업이 끝나면 Asserting을 처리하는 방식이다\.

### Application

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-015.png>)

위의 코드는 SwiftUI 코드로 뷰가 비동기적으로 id를 가지고 썸네일을 가지고 오는 코드이다\. async / await를 사용하면 다음과 같다\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-016.png>)

completion Handler를 제거하고 try로 오류 처리를 가능하도록 만들고, 비동기 처리를 위해 await 키워드를 써준다\. 컴파일러는 async 컨텍스트가 아닌 곳에서는 비동기 함수를 호출할 수 없기 때문에 Task로 감싸서 비동기 함수를 호출한다\.

### Async API in the SDK

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-017.png>)

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-018.png>)

수많은 SDK들이 기존에는 completion Handler로 비동기 작업을 제공했는데, 이제는 async / await로 더 자연스럽게 동일 기능을 제공한다고 한다\. 

## Async alternatives and continuations

개발을 하다보면 비동기 코드를 직접 만들어야하는 경우가 생긴다\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-019.png>)

위 코드는 getPersistentPosts 함수를 사용하여 Core Data의 저장소에 존재하는 모든 게시물을 검색하는 코드다\. NSAsynchronousFetchResult\. 즉 비동기 작업을 하고있으니 직접 비동기 코드로 만들기 적당하다\.

무슨 뜻이냐면 애플에서는 상당수의 API를 async/await로 변환해줬는데, 아직 변환되지 않는 애들이 있다\. 이런 애들을 wrapper 형태로 async/await로 구현해서 밖에서는 아직 구식의 비동기처리를 한다는걸 모르게끔 하는거다\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-020.png>)

위와 같이 async을 붙여 비동기 함수로 만들고 오류를 던질 수도 있으니 throws도 추가해준다\.

여기에 getPersistentPosts를 호출하게 되면 completion Handler를 처리해줘야하는데 async 함수는 일시 정지 되면 시스템에 스레드를 반환하기 때문에 다음 작업을 수행할 적절한 시점을 찾아야 합니다\.

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-021.png>)

위 그림에서는 persistentPosts가 호출되면 Core Data를 호출한다\. 그런 뒤 Core Data에서 작업을 마치면 getPersistentPosts의 completion Handler를 호출한다\. 

메서드 호출자는 함수 호출의 결과를 기다리고 결과를 얻은 뒤 할일을 클로저로 정해준다\. 함수 호출이 완료되면 호출자는 completion handler를 호출해서 비동기 기능을 처리합니다\. 이를 명확하게 처리하기 위해 Swift에서는 ` 높은 수준의 안전한 방식의 작업을 suspend, resume(일시정지 되어 있다가 다시 실행), suspend, resume 할 수 있는 continuation 기능 `을 제공한다\.  

![](<../../assets/blog/wwdc-meet-async-await-in-swift-1100d0f75cd680699796fd4e8062645b/image-022.png>)

이렇게 withCheckedThrowingContinuation을 사용하여 오류를 처리할 수 있다\. 

> 💡 **continuation**
> 
> 클로저 내부에서 return을 할 수 있도록 해주는 것
> 
> → completion handler라는 클로저가 있을 때 결과값을 넣었을텐데, 그걸 이제 클로저 바깥에서 리턴을 시켜주기 위해서 사용\.
> 
> continuation \- 지속, 계속 어떠한 지점에서 어떻게 다시 시작하는 것을 표시해주는 지점

## 참고

<a class="notion-resource-card" href="https://icksw.tistory.com/266"><span class="notion-resource-label">링크</span><span>https://icksw.tistory.com/266</span></a>

<a class="notion-resource-card" href="https://lsj8706.tistory.com/7"><span class="notion-resource-label">링크</span><span>https://lsj8706.tistory.com/7</span></a>

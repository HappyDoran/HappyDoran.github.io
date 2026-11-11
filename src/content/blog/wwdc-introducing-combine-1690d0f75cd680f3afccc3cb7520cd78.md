---
schemaVersion: 2
title: "WWDC) Introducing Combine"
description: "WWDC) Introducing Combine"
tags: ["Swift", "동시성", "상태 관리"]
publishedAt: "2024-12-27T15:09:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 33
---

> 💡 <strong>Combine?</strong>
> 비동기 작업을 처리하는 데 있어 기존보다 더 나은 방식을 제공해주는 도구
> 
> 
> 기존이라고 하면, Completion Handler, GCD, Notification Center, Delegate 등

## Introducing Combine

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-001.png>)

위와 같이 이름, 비밀번호, 비밀번호 재확인을 입력해서 서버에 네트워크 요청을 통해 새로운 계정을 만드는 화면이 있다\. 사용자는 이름, 비밀번호를 입력한 뒤 “Create Account” 버튼을 통해서 네트워크 통신을 한다\. 

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-002.png>)

- 사용자 이름을 입력하면 Target/Action을 통해 사용자의 입력에 대한 알림을 받는다\.
- 입력한 이름이 유효한 이름인지 서버를 통해 확인하기 위해 네트워크 통신을 한다\.
- 근데 이때 <strong>그냥 네트워크 통신을 하는게 아니라, Timer를 사용해서 사용자의 네트워크 요청이 서버에 과부하를 주지 않기 위해 사용자의 입력이 멈추면 비동기 네트워크 통신</strong>을 진행한다\.
- KVO \(작업 진행률을 나타내는 로딩같은 것\)으로 비동기 작업에 대한 진행률 업데이트도 수신할 수 있다\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-003.png>)

즉, 이름과 암호를 입력하면서 서버와 통신해서 유효한 값인지 체크를 해줘야 하고, 해당 체크의 결과대로 UI도 업데이트 해줘야 한다\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-004.png>)

이렇게 많은 비동기 인터페이스들이 있고, 각각 다른 사용법을 갖고 있다\. 이것들을 함께 사용할 때 어려움이 있고, Combine을 만들 때 애플은 이것들의 공통점을 찾으려고 노력했댄다\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-005.png>)

그렇게 애플에서 정의한 Combine에 대한 정의는 “시간 경과에 따른 값 처리를 위한 통합적이고 선언적인 API”이다\.

## Combine Features

<strong>Generic</strong>

Combine은 Swift용으로 만들어져서 제네릭과 같은 Swift 기능을 활용할 수 있다\. 제네릭을 사용하면 여러 비동기 작업들을 일관적으로 처리할 수 있어서 코드의 양도 줄일 수 있고, 하나의 알고리즘을 다양한 곳에서 사용할 수 있다\.

<strong>Type safe</strong>

Combine은 Type safe하기 때문에 런타임이 아닌 컴파일 시간에 오류를 잡을 수 있다\.

<strong>Composition first</strong>

Combine은 구성이 먼저라서 핵심 개념이 간단하고 이해하기 쉽지만 이들을 사용하면 큰 효과를 볼 수 있다\.

<strong>Request driven</strong>

Combine은 요청 기반이기 때문에 앱의 메모리 사용량과 성능을 잘 관리할 수 있다\.

## Combine Key Concepts

### 전체적인 흐름

combine의 핵심 개념은 Publisher, Subscriber, Operator 3가지 이다\.

<strong>Publisher</strong>

뭔가를 내보내는 애, 출판하는 애정도로 생각하자\.

<strong>Subscriber</strong>

구독자, Publish하는 애를 subscribe하게 될 것 같은 느낌이다\.

<strong>Operator</strong>

주어지는 무언가에 대해서 입맛대로 변환시키거나 필터로 거르는 등 변환 과정을 거치게 해주는 애\.

그럼 이제 흐름이 어떻게 될 것 같냐면,

Publisher라는 애가 어떠한 형태로 Publish 해줄거고,

이 값을 Operator를 통해 원하는 형태로 가공해서,

Publisher를 Subscribe하고 있던 Subscriber가 그 값을 같아서 어떻게 잘 사용할 듯

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-006.png>)

### Publisher

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-007.png>)

- Combine API의 선언 부분, 값의 오류와 생성되는 방식을 알려주는 애\.
- 내가 이해할 때는 값을 찍어서, 만들어서 출판하는 애로 이해는 하겠지만 실제로 값을 생산해내는 애는 아니다\.
- 구조체를 사용하기 때문에 값타입이며, Subscriber의 등록도 허용한다\. 
→ 유튜브 채널처럼 시간에 따라 구독자의 등록을 받는 느낌\.

즉 <strong>시간이 경과함에 따른 전송 가능한 일련의 값들을 정의하는 값</strong>이라고 할 수 있을 것 같다\. 

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-008.png>)

Publisher의 프로토콜을 살펴보자\. 두개의 associatedtype이 있고 이 두개는 값, 에러를 뜻한다\. 그리고 publisher의 핵심 기능인 subscriber를 등록하는 subscribe 함수가 있다\. input과 Output이 일치해야 하고, subscripber의 failure는 publisher의 failure와 일치해야 한다\. 

Error를 생성할 수 없는 경우에는 Error 타입 대신에 Never 타입을 사용할 수 있다\.

→ Never는 정상적으로 반환하지 않는 함수의 반환 타입, 값이 없는 타입\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-009.png>)

NotificationCenter의 경우의 예시이다\. 

아까 Publisher를 <strong>시간이 경과함에 따른 전송 가능한 일련의 값</strong>이라고 얘기 했었다\.

WWDC에서 소개한 마법사의 이름, 비밀번호를 받는 과정을 생각해보자\.

- 사용자가 텍스트필드에 값을 입력할 때마다 바뀐 값이 publish되는 상활
- 1초마다 현재 시간을 publish하는 Timer
- 서버에 Request를 보낸 후, 성공 or 실패한 Response를 받아와서 그 값을 publish하는 상황

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-010.png>)

여기서 말하는 publish는 횟수와 상관없이, 시간이 흐르고 어떠한 이벤트가 발생하면 그 흐름에 따른 값이 순서대로 <strong>방출되는 것\(이걸 Publish 라고 말하고 있는거 같습니다\.\)</strong>을 말하고 있는 것 같다\.

### Subscriber

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-011.png>)

- Publisher와 반대되는 개념\. Publisher에게 값을 받아서 쓴다\.
- Publisher가 시간에 따라 값을 방출한 것을 받는다고 선언하고 받아다 쓰는 애
- 값을 받아서 뭔가를 처리하고, 상태를 변경해야하기 때문에 클래스와 같은 참조 타입

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-012.png>)

Subscriber의 프로토콜을 한번 봐보자\. Publisher와 동일하게 두개의 associatedtype이 있고 마찬가지로 에러를 수신할 수 없다면 Never 타입을 사용할 수 있다\. 또한 Publisher의 Output과 Subscriber의 input 타입이 일치하고, 상호간 Failure 타입도 일치하도록 Subscriber를 만들어야 한다\.

Publisher와 다르게 3개의 receive 함수가 있다\.

<strong>receive\(subscription:\)</strong>

Subscriber가 Publisher에게 구독을 등록한다는 메서드 <strong>subscribe\(\_:\)</strong>를 호출한 후 Publisher가 이에 대한 회신의 개념으로 호출하는 메서드

subscription은 구독권\. 즉 이 구독권을 통해 Subscriber와 Publisher가 연결 관계를 설정할 수 있다\. <strong>subscription\.request\(\.unlimited\)</strong>처럼 무제한 데이터 스트림을 요구할 수도 있고, <strong>subscription</strong>\.<strong>cancel\(\)</strong>처럼 더 이상 값을 받지 않겠다고 Subscriber 입장에서 구독을 끊을 수 있다\.

<strong>receive\(\_ input:\)</strong>

Publisher가 새로운 데이터를 publish할 때 호출하는 메서드

이 메서드의 return 값은 Subscribers\.Demand 타입인데, 이를 통해 Subscriber가 얼마나 더 많은 데이터를 요청할지 지정할 수 있다\. 
→ \.unlimited면 제한 없이 Publisher가 생산\(produce\)할 수 있는 모든 값을 계속 받아오고  \.none이면 더 이상 추가 데이터를 받아오지 않겠다는 의미이다\.

<strong>receive\(completion:\)</strong>

Publisher가 데이터를 성공적으로 방출했거나, 에러로 인해 오류가 발생했을 때 호출하는 메서드

completion 파라미터의 타입은 Subscribers\.Completion 타입이다\. 정상적으로 완료가 되었을 경우에는 finished case/ 에러 발생시에는 failure case로 구분 가능하다\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-013.png>)

Assign이라고 하는 클래스가 있다\. 얘가 하는 일은 Upstream에서 input을 받으면 해당 객체의 프로퍼티에 기록한다\. Swift에서는 프로퍼티 값을 작성할 때 오류를 처리할 방법이 없기 때문에 Never 타입으로 정해준다\.

#### Subscriber 메서드의 흐름\(The Pattern\)

위에서 말한 세가지 메서드의 흐름을 정리하면 다음과 같다\.

1. Subsriber는 subsribe 메서드를 통해 Publisher가 방출하는 데이터를 받겠다고 구독\(subscribe\)을 신청한다\.
1. Publisher는 Subsriber의 receive\(supscription:\)의 파라미터를 통해 구독증\(subscription\)을 보낸다\.
1. 구독증을 받은 Subscriber는 해당 구독증\(subscription\)으로 Publisher에게 N개의 값을 요청\(request\)한다\.
1. Publisher는 Subscriber가 요청한 만큼 시간에 따라 N개의 값을 보낸다 \(receive\(\_:\)\)\.
1. Publisher가 더 이상 값을 pulish 하지 않거나 에러가 발생해서 관계가 종료되면 Publisher가 receive\(completion:\)을 호출해 관계의 끝을 알린다\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-014.png>)

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-015.png>)

영상의 예시를 봐보자\. Wizard라는 모델 객체가 있고, grade라는 값을 가지고 있다\. merlin은 5학년이고, 여기서 하고 싶은 것은 졸업하는 학생들에 대한 알림을 듣고 졸업하면 Wizard 객체의 값을 업데이트 하는 일이다\. 이를 위해 Publisher를 만들고, Subscriber Assign 객체를 만든다\. 이렇게 하고 Publisher에 Subscriber를 연결해줘야한다\. 근데 에러가 발생한다\. 이유는 타입이 일치하지 않기 때문이다\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-016.png>)

NotificationCenter는 Notification을 보내지만 Assign이 grade라는 Int 타입에 값을 쓰려면 Int가 필요하다\. 

따라서 이를 변환해줄 무언가를 중간에 만들어줘야 한다\.

이러한 역할을 하는 것이 바로 Operator이다\.

### Operator

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-017.png>)

- Publisher 프로토콜을 채택, 값타입
- Publisher와 Subscriber 사이에서 뭔가 publish된 value를 뭐 어떻게 하는 데 필요한 애
   → Publisher와 Subscriber에서 공통으로 언급한 점중에 Output과 input의 타입이 일치하고, Failure 타입도 일치해야한다가 있었는데 이 두개의 상호간의 타입을 맞춰주기 위해 사용할 수 있는 것\.
- 추가로 mapping, filtering, restrict 등 Publisher를 특정 범위로 규정지을 때도 사용할 수 있다\.

> 💡 <strong>upstream? downstream?</strong>
> 
> 단순하게 먼저 실행되는 코드는 Upstream, 이후에 실행되는 코드는 Downstream이라 생각하면 된다\.
> 
> 예를 들어서 Publisher를 subscribe 하는 일\(Upstream\)을 먼저 하고 이후에 실행될 Subscriber에게 결과를 보내는 일\(Downstream\)

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-018.png>)

Operator의 예시중 하나인 Map이다\. Map은 upstream과 upstream의 output을 자체 outputh으로 변환하는 transform이 존재하는 구조체이다\. Map은 실패를 생성하지 않기 때문에 Upstream의 실패 타입을 미러링하게 된다\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-019.png>)

Operator에 Map이 들어가게 되면 이제 converter라는 변수가 추가된다\. converter의 클로저는 알림을 수신하고 NewGrade라는 userInfo를 가지고 정수이면 클로저를 반환한다\. 이렇게 되면 결과가 정수가 되기 때문에 Subscriber에 연결할 수 있게 된다\. 

#### 제네릭을 이용한 Operator

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-020.png>)

이런식으로 제네릭을 사용하면 모든 Publisher가 사용할 수 있는 map 함수가 된다\. 

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-021.png>)

알림을 받게 되면 앞에서 본 것과 같이 동일한 클로저를 사용해서 매핑한 뒤 merlin의 grade 프로퍼티에 할당한다\. 

Assign은 cancelable 항목을 반환하는데 Cancelation도 Combine에 포함되어 있다\. 따라서 Cancelation을 사용해서 Publisher, Subscriber를 조기에 해제할 수 있다\.

## Try composition first

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-022.png>)

combine에는 이렇게 많은 Operator를 가지고 있고 이를 Declarative Operative API라고 부른다\. 

이렇게 Operator가 많기 떄문에 애플에서 권장하는 것은 Combine에 대한 핵심 디자인 원칙인 Composition으로 돌아가는 것이다\. 많은 작업을 모두 수행하는 몇개의 Operator를 제공하기보다, 간단한 작업을 수행하는 Operator를 많이 제공해서 이해하기 쉽게 만들었다는 의미이다\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-023.png>)

Swift에서는 하나의 정수를 동기적으로 처리할 때는 Int를 사용하면 되지만, Combine을 사용해서 비동기적으로 사용하려면 Future를 사용하면 된다\. 또한 여러개의 값을 동기로 사용할 때는 Array, 비동기로 사용할 거면 Publisher를 사용하면 된다\.

다양한 operator를 사용하는 예시는 다음과 같다\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-024.png>)

map을 사용할 경우 Int가 아니면 0을 저장해야되는데, 

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-025.png>)

이러면 0이 아니라 nil을 저장할 수 있다\.

## Combining Publishers

위의 Map, Filter는 동기 작업을 위한 API 이다\. Combine은 비동기에서 특화된 작업이기 때문에 Zip, CombinLatest라는 Operator를 사용할 수 있다\.

### Zip

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-026.png>)

Zip은 여러개의 upstream input을 하나의 tuple로 변환하여 downstream으로 전달한다\. 이때 downstream으로 전달하기 위해서는 튜플의 모든 값이 입력되어야 하므로 upstream의 모든 input이 전달된 후에 downstream으로 전달된다\. 위의 그림은 A와 1 모두 받아야 전달이 가능하단 소리다\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-027.png>)

### Combine Latest

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-028.png>)

Zip과 동일하게 두개의 값을 모두 받아서 하나의 값으로 변환하는 것은 동일하지만 upstream의 값이 변경될 때마다 downstream 값으로 전달한다\. 이렇게 하면 가장 최신 정보를 전달할 수 있게 된다\.

![](<../../assets/blog/wwdc-introducing-combine-1690d0f75cd680f3afccc3cb7520cd78/image-029.png>)

## 참고

<a class="notion-resource-card" href="https://mini-min-dev.tistory.com/288"><span class="notion-resource-label">링크</span><span>https://mini-min-dev.tistory.com/288</span></a>

<a class="notion-resource-card" href="https://icksw.tistory.com/268"><span class="notion-resource-label">링크</span><span>https://icksw.tistory.com/268</span></a>

<a class="notion-resource-card" href="https://developer.apple.com/videos/play/wwdc2019/722"><span class="notion-resource-label">링크</span><span>https://developer.apple.com/videos/play/wwdc2019/722</span></a>

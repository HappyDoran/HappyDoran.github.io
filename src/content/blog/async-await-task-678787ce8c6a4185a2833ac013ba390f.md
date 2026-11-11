---
schemaVersion: 2
title: "Async, Await, .task로 비동기 뿌시기"
description: "직렬, 동시성, 동기, 비동기에 대한 개념을 이해하고 오시면 좋습니다."
tags: ["Swift", "동시성"]
publishedAt: "2024-08-27T07:35:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 12
---

직렬, 동시성, 동기, 비동기에 대한 개념을 이해하고 오시면 좋습니다\.

[직렬? 동시성? 동기? 비동기? 그게 뭔데요?](<https://app.notion.com/p/305facc216d449159c96646e93bc44a7>) 

## 동기\(sync\)와 비동기\(Async\)

### 동기\(sync\)

어떤 작업이 동기적으로 실행된다는 말은<strong>, 해당 작업이 끝날 때 까지 다른 작업들은 기다린다</strong>는 것을 뜻합니다\.

![](<../../assets/blog/async-await-task-678787ce8c6a4185a2833ac013ba390f/image-001.png>)

### 비동기\(async\)

해당 작업이 끝나든 말든 신경쓰지 않고 <strong>나머지 작업을 바로 실행</strong>합니다\. 

![](<../../assets/blog/async-await-task-678787ce8c6a4185a2833ac013ba390f/image-002.png>)

→ 이미지 다운로드나 네트워킹 등<strong> 작업 시간이 오래걸리는 것</strong>들은 비동기로 처리하는게 좋습니다\. 

## 비동기 작업에서의 CompletionHandler

일을 비동기\(async\)로 보내놓고 신경을 안쓰고 난 내 task를 하고 있었는데, 그러면 실제 해당 작업이 언제 끝나는지는 어떻게 알까요?

→ Swift는 다른 스레드의 작업이 끝나면, 클로저를 통해 해당 시점을 알려줍니다\. 이게 바로 보통 우리가 completionHandler로 부릅니다\.

```swift
// 비동기적인 작업을 해야하는 함수는 항상 클로저를 호출할 수 있도록 함수를 설계해야 한다
func getImages(..., completionHandler: @escaping (UImage?) -> Void) {
	...
    URLSession.shared.dataTask(..) {
    	...
    	...
    	completionHandler(photoImage)	// 함수 내부의 일이 끝나면 completionHandler 호출한다
    }.resume()
}
```

### CompletionHandler의 문제점

![](<../../assets/blog/async-await-task-678787ce8c6a4185a2833ac013ba390f/image-003.png>)

해당 코드에서는 에러 상황에서는 completion을 호출하지 않고 바로 return을 하는 모습을 보입니다\.

→ completion을 적는지 안적는지는 개발자에게 달려있기 때문에 버그가 발생할 수 있습니다\.

![](<../../assets/blog/async-await-task-678787ce8c6a4185a2833ac013ba390f/image-004.png>)

해당 코드는 에러상황에서도 completion을 호출을 해주었지만 또 문제가 있습니다\.

비동기 작업이 중첩되어 작동하기 때문에 콜백이 계속 되는 끔찍한 상황이 발생할 수 있습니다\.

비동기적인 실행을 여러 개 연결해야 할 때, 계속 코드를 들여써야 하는 단점이 발생할 수 있어요\.

![](<../../assets/blog/async-await-task-678787ce8c6a4185a2833ac013ba390f/image-005.png>)

## Async &amp; Await

이런 문제를 해결하기 위해 Swift 5\.5부터 async &amp; await가 도입 되었습니다\.

async &amp; await를 사용하면 비동기 코드를 마치 동기 코드인양 작성이 가능하기 때문에, 동기 코드에서 사용할 수 있는 동일한 구조를 쓸 수 있습니다\.

![](<../../assets/blog/async-await-task-678787ce8c6a4185a2833ac013ba390f/image-006.png>)

기존의 completion이 도배되어 있던… 코드가 있습니다\. 이걸 이제 async와 await를 사용해서 적어보면 

![](<../../assets/blog/async-await-task-678787ce8c6a4185a2833ac013ba390f/image-007.png>)

이런식으로 들여쓰기도 없고, 코드도 깔끔해 집니다\.

Swift는 작업이 종료될 때 completionHandler없이도 이를 호출한 곳에 알려주는 것을 보장하고, 개발자는 async&amp;await를 이용해서 안전하고 짧게 코드 작성이 가능합니다\.

### async와 await를 보기 전에

생소한 개념이 보이실 것 같습니다\. try? guard? throws? 

try, guard, throws의 공통점은 오류를 처리할 때 필요한 아이들이라는 것입니다\. 

그렇다면 위에 코드는 오류를 뱉어낼 수도 있는 비동기로 이루어진 코드라고 생각할 수 있을 것 같습니다\.

#### throws

오류는 throws를 이용해 던집니다\. 즉 오류를 처리해주는 곳으로 퉤 하고 내뱉는 겁니다\.

#### guard

잘못된 값의 전달 시 특정 실행구문을 빠르게 종료합니다\. 즉 “이 코드에서는 오류가 발생할 수 있습니다\.”라는 말해주는 코드입니다\.

throws와 guard를 사용한 코드를 한번 보겠습니다\. 

```swift
func printNumber(_ number: Int) throws -> Int {    
   var text = ""
  
   guard number > 0 else { 
       throw TestError.outOfRange              
   } 
   return text
}
```

throws \- 오류가 발생할 가능성이 있는 메소드 옆에 써줍니다\.

guard \- 오류가 발생할 수 있는 코드 옆에 써줍니다\.

throw \- 오류가 발생할 구간에 써줍니다\.

→ TestError, outOfRange는 기존에 enum에서 선언해놨던 오류의 종류입니다\.

#### try

try의 의미는 정리하면 ‘이 함수가 오류가 발생할수도 있는데, 한번 시도해봅시다’라는 의미입니다\.

### 그럼 다시 봐봅시다\.

![](<../../assets/blog/async-await-task-678787ce8c6a4185a2833ac013ba390f/image-008.png>)

함수 이름 뒤에 async가 붙으면 <strong>이 함수는 비동기</strong>라는 것을 나타냅니다\.

근데 이 비동기 함수가 <strong>오류를 내뱉을 가능성이 있는 메소드</strong>에요\! 그럼 이제 throws를 붙여줍니다

→ 영어 문법상 읽기가 async throws가 좋아서 이렇게 했답니다\.

async 함수를 호출하기 위해서는 await 키워드가 필요합니다\.

근데 이 함수가 오류가 발생할 수도 있으니까 일단 한번 시도해봅시다\! 라는 의미로 try를 붙여줍니다\.

→ 영어 문법상 읽기가 try await가 좋아서 이렇게 했답니다\.

### 예시 코드

```swift
import Foundation

enum NetworkError: Error { 
    case badURL
    case requestFailed
    case unknown
}
//오류의 종류를 열거형으로 정의해놓습니다. 
//Error 프로토콜 준수합니다.

func fetchData(from urlString: String) async throws -> String { 
// String 타입의 URL을 입력받아 String 타입의 데이터를 반환받습니다. 
//함수 실행중 오류를 던질 수 있습니다.(throws)

    guard let url = URL(string: urlString) else { 
        throw NetworkError.badURL //오류 던지기
    }
    //입력받은 urlString을 URL타입으로 변환합니다. 
    //변환에 실패한다면 ,NetworkError.badURL 오류를 던집니다.
    
    let (data, response) = try await URLSession.shared.data(from: url)
		//비동기적으로 네트워크 요청을 수행합니다.
		//이 과정에서 발생할 수 있는 오률르 처리하기 위해 try키워드를 사용합니다.
    
    guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
        throw NetworkError.requestFailed //오류 던지기
    }
    //상태코드가 200인지 확인하고 아니면 오류를 던집니다.
    
    if let result = String(data: data, encoding: .utf8) {
        return result
    } else {
        throw NetworkError.unknown
    }
    //반환된 데이터를 UTF-8 문자열로 변환합니다. 
    //반환에 성공하면 문자열을 반환하고,반환에 실패하면 오류를 던집니다.
}

func loadAndPrintData() async { //비동기 함수 호출
    let urlString = "https://www.example.com/data"
    
    do { //이 블록 안에서 발생할 수 있는 에러를 캐치하기 위한 준비
        let data = try await fetchData(from: urlString) //비동기 함수 호출
        print("Received data: \(data)")
    } catch NetworkError.badURL {
        print("Error: Invalid URL.")
    } catch NetworkError.requestFailed {
        print("Error: Request failed.")
    } catch {
        print("Error: An unknown error occurred.")
    }
}

.task {
		await loadAndPrintData()
}

```

## task

iOS15 이전에는 네트워크 요청을 해야할 때 요청을 시작하는 부분이 onAppear 였습니다\. 

하지만 iOS15 이후에는 비동기 작업이 필요한 작업은 SwiftUI에서 task에서 진행할 수 있습니다\.

```swift
task(id:priority:_:)
```

#### task의 정의

```text
view가 나타날 때(view appears) 수행할 비동기 작업을 추가합니다.
```

```swift
var body: some View {
    List {
        ForEach(self.viewModel.names, id: \.self) { name in
            Text(name)
        }
    }.task ✅ {
        self.viewModel.requestNames() ✅
    }
}
```

task는 view가 나타나기 전에 혹은 특정한 값이 변경될 때 수행할 비동기 작업을 추가합니다\.

#### task의 장점

task가 modifier로 추가된  view의 수명과 일치하는 수명을 갖습니다\.

→ task에 넣은 작업이 완료되기 전에 view가 사라지면 SwiftUI 가 task에 있던 작업을 취소하거나 재실행 해줍니다\.

```swift
struct ContentView: View {
    @State private var messages = [Message]()
    @State private var selectedBox = "Inbox"
    
    let messageBoxes = ["Inbox", "Sent"]

    var body: some View {
        NavigationView {
          List(messages) { message in
              VStack {
                  Text(message.text)
              }
          }                    
          .task(id: selectedBox) {
              await fetchData()
          }
            
        }
    }

    func fetchData() async {
        do {
            let url = URL(string: "https://example.com/\(selectedBox.lowercased()).json")!
            let (data, _) = try await URLSession.shared.data(from: url)
            messages = try JSONDecoder().decode([Message].self, from: data)
        } catch {
            messages = [
                Message(id: 0, text: "Please try again later.")
            ]
        }
    }
}
```

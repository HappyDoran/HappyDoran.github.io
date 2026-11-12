---
schemaVersion: 2
title: "SwiftUI에서 URLSession으로 HTTP 응답 받아 표시하기"
description: "SwiftUI에서 서버 데이터를 표시하려면 URL 생성, Codable 모델, 비동기 요청, 메인 스레드 상태 갱신을 연결해야 한다. URLSession의 GET 요청을 예로 들어 실패 지점과 책임 분리를 정리한다."
tags: ["Swift", "SwiftUI", "네트워크"]
publishedAt: "2024-08-27T07:35:00.000Z"
updatedAt: "2026-11-12T04:04:00.000Z"
manuscriptPages: 13
---

SwiftUI에서 서버 데이터를 표시하려면 URL 생성, Codable 모델, 비동기 요청, 메인 스레드 상태 갱신을 연결해야 한다\. URLSession의 GET 요청을 예로 들어 실패 지점과 책임 분리를 정리한다\.

host·경로·응답 값은 가상 예시다\. HTTPS를 기준으로 설명하며, 로컬 HTTP 예외 설정을 앱의 인터넷 사용에 항상 필요한 설정으로 해석하지 않는다\.

## 시작하기전에…

Server와 HTTP 통신을 하는 순서는 다음과 같습니다\.

1. 서버의 URL에 요청\(여기서는 Request라 합니다\)을 한다\.
   1. URL이 필요하겠네요\.
   1. URL에 들어가는 Parameter도 필요할 것 같습니다\.
1. 서버에서 데이터를 받아옵니다\.\(여기선 Response\)라 합니다\.
   1. 서버에 있는 데이터의 포맷과 프론트에서 지정해줄 포맷을 맞춰줘야 합니다\.
   1. 잘못된 URL, 데이터가 없을 경우, 디코딩\(Json의 형태를 사용하기 위함\)에러가 나면 어떡할지를 생각해야합니다\.
1. 받아온 데이터를 적절하게 사용해서 View에 보여 준다\.
   1. 어떤 정보를 보여줄건지 정해줘야겠군요\.
   1. 그리고 정보를 보여주면 되겠네요\.

## 코드로 봐보겠습니다\.

### URL 생성

#### Constants\.swift

```swift
import Foundation

struct Constants {
    static let EXAMPLE_HOST = "api.example.com"
    static let EXAMPLE_PORT = "443"
}
```

서버의 IP 주소와 Port번호를 저장하는 Constants\.swift 파일입니다\.

실행 환경별 host·port는 설정 경계에서 관리하고 문서에는 가상 주소를 사용한다\.

#### URLExtensions\.swift

```swift
import Foundation

extension URL {
    static func getItemList() -> URL? {
        return URL(string: "https://\(Constants.EXAMPLE_HOST):\(Constants.EXAMPLE_PORT)/api/items"
        )
    }
}
```

요청할 URL을 반환해주는 URLExtensions\.swift 파일입니다\.

Constants에서 선언해준 IP Address와 Port 번호를 사용하여 URL을 만들어 리턴해줍니다\.

지금과 같은 상황에서는 URL에 들어가는 Parameter가 없는 상황입니다\.

따라서 나중에 Parameter가 필요한 상황에서는 URL에 Parameter를 포함해서 만들면 되겠네요\.

### 모델 생성

#### ItemModel\.swift

```swift
import Foundation

struct ItemModel: Codable {
    let id: Int?
    let refID, addr, name: String?
    let xCoord, yCoord: Double?
    let type, title, img, subject: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case refID = "REF_ID"
        case addr = "ADDR"
        case name = "NAME"
        case xCoord = "X_COORD"
        case yCoord = "Y_COORD"
        case type = "TYPE"
        case title = "TITLE"
        case img = "IMG"
        case subject = "SUBJECT"
    }
}
```

서버에서 받아올 데이터의 포맷을 맞춰주는 ItemModel\.swift입니다\.

서버에서 받아올 데이터는 다음과 같이 생겼습니다\.

```json
[
  {
    "id": 2371,
    "REF_ID": "예시 항목",
    "ADDR": "예시 지역",
    "NAME": "예시 항목",
    "X_COORD": 10.5,
    "Y_COORD": 20.5,
    "TYPE": "예시 분류",
    "TITLE": "예시 장소",
    "IMG": "",
    "SUBJECT": "자료"
  }
  ]

```

때문에 해당 데이터 포맷에 맞추어서, ItemModel이라는 struct를 Codable 프로토콜로 선언해줬습니다\.

Codable로 선언을 해줌으로써, 서버에 있는 변수명을 struct안의 프로퍼티 변수명으로 사용할 수 있습니다\.

또한 서버에서의 변수명을 CodingKey로 지정하여 사용하면 되는데, CodingKey를 작성 시에 대소문자를 포함하여 서버에 있는 명칭과 똑같이 작성해야합니다\.

→ 안그러면 에러나요\.

#### 꿀팁

<a class="notion-resource-card" href="https://app.quicktype.io/"><span class="notion-resource-label">링크</span><span>https://app.quicktype.io/</span></a>

서버의 포맷에 따라 struct를 생성해주는 좋은 사이트가 있습니다\.

### 서버와의 연결

#### HttpClient\.swift

```swift
import Foundation

enum NetworkError: Error {
    case badURL
    case noData
    case decodingError
}

class HTTPClient {
    
    func getItem() async throws -> [ItemModel] {
        guard let url = URL.getItemList() else {
            throw NetworkError.badURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw NetworkError.noData
        }
        
        let itemData = try JSONDecoder().decode([ItemModel].self, from: data)
        
        return itemData
    }
}
```

본격적으로 서버에게 request 해서 response를 가져오기 위해 만든 HTTPClient\.swift 입니다\.

서버에서 발생하는 에러를 열거형으로 정의하여 추후에 발생하는 에러가 어떤 발생했는지 바로 알 수 있습니다\.

전체적인 순서를 읊으면 다음과 같습니다\.

1. 통신할 URL을 가져온다\.
   URL이 있으면 url에 담김, 없으면 오류를 뱉습니다\.
1. 생성된 URL로부터 데이터와 응답을 가져옵니다\.
   오류가 발생하면 함수 호출자에게 전달합니다\.
1. 응답을 HTTPURLResponse로 타입 캐스팅하여 HTTP 상태 코드가 200인지 확인을 합니다\.
   상태코드가 200이 아니라면 noData 오류를 발생시킵니다\.
1. 서버에서 response해온 Data를 디코딩합니다\.
   디코딩 과정에서 오류가 발생하면 함수 호출자에게 전달합니다\.

### Response해온 데이터 써먹기

#### ItemViewModel\.swift

```swift
import Foundation
import SwiftUI
import MapKit

class ItemViewModel : ObservableObject{
    @Published var items: [ItemModel] = [] // 배열로 변경
    var httpClient = HTTPClient()
    
    func getItemList() async {
        do {
            let itemData = try await httpClient.getItem()
            DispatchQueue.main.async {
                self.items = itemData // 여러 항목 데이터를 할당
            }
        } catch {
            print(error.localizedDescription)
        }
    }
}
```

Response해온 Data를 가공하여 View에서 보여줄 정보를 추려내는 ItemViewModel\.swift입니다\.

1. HTTPClient 클래스의 인스턴스를 생성하여 클래스 안의 메소드를 사용하여 itemData를 가져옵니다\.
1. 가져온 데이터를 struct로 만들어놓았던 데이터 구조체에 넣어줍니다\.
1. 데이터를 할당하는 작업을 메인 스레드에서 해주는 이유는 UI관련 작업이기 때문에 메인 스레드에서 해주어야 하기 때문입니다\.
1. 가져오지 못할 경우 에러를 Catch하여 뱉어냅니다\.

### View에서 표시하기

```swift
import SwiftUI

struct ItemListView: View {
    @StateObject private var model = ItemViewModel()

    var body: some View {
        Text("불러온 항목: \\(model.items.count)")
            .task {
                await model.getItemList()
            }
    }
}
```

최종적으로 서버에서 받아온 데이터를 뷰에 보여주는 View\.swift\(여기선 MapView\.swift\)입니다\.

ItemViewModel 인스턴스를 만들어 빈 배열을 선언하고 그 배열에 데이터를 넣어주는 작업을 할 겁니다\.

1. task에서 비동기로 데이터를 요청하고 결과를 게시 프로퍼티에 반영한다\.

## 제네릭으로 응답 처리 일반화

```swift
func getList<T: Decodable>(url: URL?) async throws -> [T] {
    guard let url = url else {
        throw NetworkError.badURL
    }
    
    let (data, response) = try await URLSession.shared.data(from: url)
    
    guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
        throw NetworkError.noData
    }
    
    let Data = try JSONDecoder().decode([T].self, from: data)
    
    return Data
}
```

해당 코드를 사용하여 제네릭을 통해 Decodable한 타입들은 전부 받을 수 있게 변경하여 코드의 범용성을 넓히는 작업을 진행해도 좋을 것으로 생각됩니다\.

## 네트워크 의존성 교체 검토

moya라는 라이브러리를 사용하여 네트워크의 통신 코드의 의존성을 느슨하게 하여, 쉽게 갈아 끼울 수 있도록 하는 것이 좋다 생각듭니다\.

## 정리

URL·응답 모델·HTTP 상태·디코딩 오류를 각각 확인하고 UI 반영은 메인 스레드에서 수행한다\. 반복되는 응답 처리는 Decodable 제약의 제네릭 함수로 모을 수 있으며 네트워크 라이브러리 도입은 교체할 의존 경계를 기준으로 판단한다\.

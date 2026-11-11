---
schemaVersion: 2
title: "MV패턴 날 것으로 이해하기 쉽게 정리하기-Mohammad Azam"
description: "Moduler Architecture"
category: "미분류"
categorySlug: "uncategorized"
tags: ["SwiftUI", "아키텍처", "상태 관리"]
publishedAt: "2024-09-24T08:09:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 15
---

## Moduler Architecture

작고 독립적인 모듈 또는 구성 요소를 설계하고 구성하는 것\. 각각이 독립적이기 때문에 각각의 모듈은 특정 목적을 수행하고 특정 비즈니스 요구 사항을 해결한다\. 다른 모듈에서 소비되거나 사용될 모듈을 만드는 경우, 해당 모듈과 소통하면서 고립되지 않은 모듈을 만드는 것이 중요하다\.

→ 그래서 Order, Cart, 이런식으로 나누어서 작업하는 듯합니다\.

![](<../../assets/blog/mv-mohammad-azam-10b0d0f75cd68040b5bfc2a72b68362a/image-001.png>)

## MV 패턴에서의 Aggregate Model

![](<../../assets/blog/mv-mohammad-azam-10b0d0f75cd68040b5bfc2a72b68362a/image-002.png>)

소규모 중규모 앱의 경우 단일 Aggregate Model로 충분하다\.

→ Entities는 여러개지만 그거를 하나로 아우르는 Model, 즉 로직을 작성하는 Model은 하나여도 충분하다\. 

```swift
class StoreModel: ObservableObject {
    
    private var storeHTTPClient: StoreHTTPClient
    
    init(storeHTTPClient: StoreHTTPClient) {
        self.storeHTTPClient = storeHTTPClient
    }
    
    @Published var products: [Product] = []
    @Published var categories: [Category] = []
    
    func addProduct(_ product: Product) async throws {
         try await storeHTTPClient.addProduct(product)
    }
    
    func populateProducts() async throws {
        self.products = try await storeHTTPClient.loadProducts()
    }
}
```

이런식으로 StoreModel에 하나로 집중된 모습을 보여준다\.

하지만 비즈니스가 성장함에 따라 단일 Aggregate Model로는 충분하지 않을 수 있다\. 따라서 여러 Aggregate Model을 사용하는 방법도 있다\.

![](<../../assets/blog/mv-mohammad-azam-10b0d0f75cd68040b5bfc2a72b68362a/image-003.png>)

제네릭을 쓰면 네트워크 레이어를 하나로 합칠 수도 있다\. 이렇게 여러 Aggregate Model을 사용하는 경우에는 경계 컨텍스트를 기반으로 나눈다\. 확실한 경계가 있고 특정 비즈니스 목적으로 설계된 시스템의 특정영역 말이다\.

해당 경우는 어떤 경우냐면 다음과 같다\.

Catalog Model에서 필요한 것

- 제품
- 카테고리
- 상표
- 등등

Catalog Model에서 카테고리의 번호에 따라서 제품을 가져오는 메소드가 있다고 했을 때 이는 Aggregate Model이 다른 Aggregate Model을 액세스 해야한다\.

```swift
struct Product: Codable {
    let productId: Int
    let name: String
    let category: Category
    let price: Double
    let description: String
    let reviews: [Review]?
}

@MainActor 
class Catalog: ObservableObject {
    
    // designated or generic HTTP client 
    let storeHTTPClient: StoreHTTPClient
    
    @Published var products: [Product]
    @Published var categories: [Category]
    
    init(storeHTTPClient: StoreHTTPClient) {
        self.storeHTTPClient = storeHTTPClient
    }
    
    func loadProducts() {
         products = storeHTTPClient.loadProducts
    }
    
    func getProductById(_ productId: Int) -> Product? {
        // fetch product by id 
    }
    
    func getProductsByCategory(_ categoryId: Int) -> [Product] {
       // get products by category
    }
    
    func getCategories() -> [Category] {
        categories = storeHTTPClient.loadCategories()
    }
}
```

## ETC

### 왜 EnvironmentObject로 주입을 해줄까?

모든 뷰에 @EnvironmentObject를 사용하고 싶을 수도 있습니다\. 하지만 이 방법은 예상대로 작동하지만 대규모 애플리케이션의 경우 종속성이 없는 프레젠테이션 보기를 만들어야 합니다\. 프레젠테이션 뷰는 일반적으로 재사용성을 목적으로 만들어진 하위 뷰입니다\. 자식 보기 내에서 @EnvironmentObject에 액세스하려고 하면 재사용성 상태에 영향을 미치고 유용성이 떨어집니다\.

→ @EnvironmentObject 말고 특정 뷰에서만 데이터를 사용하고 싶으면 @StateObject 쓰란 말

### 캐싱은 네트워크 계층에서 호출

Aggregate Model은 캐싱을 자체적으로 구현하는 대신 네트워크 계층을 통해 캐싱을 활용할 수 있다\. 네트워크 계층 내부에서 캐싱 계층에 액세스하면 모든 집계 모델이 캐시된 리소스를 사용하여 더 빠른 응답을 얻을 수 있다\.

### 정리

![](<../../assets/blog/mv-mohammad-azam-10b0d0f75cd68040b5bfc2a72b68362a/image-004.png>)

**CatalogUI** : 카탈로그와 관련된 사용자 인터페이스를 나타낸다\. 여기에는 AddCatalogScreen, UpdateCatalogScreen 등과 같은 모든 카탈로그 관련 항목이 포함될 수 있다\.

**Catalog** : 카탈로그와 연관된 모델을 나타낸다\. 여기에는 집계 모델과 집계 모델에 의해 노출된 모든 엔터티가 포함된다\.

**MyStoreKit** : 네트워크 호출을 수행하기 위한 HTTP 클라이언트를 나타낸다\.

**Foundation Core** : 모든 모듈에서 사용하는 리소스를 나타낸다\. 여기에는 헬퍼 클래스/구조체, 재사용 가능한 뷰, 이미지, 아이콘, 심지어 테스트에 사용되는 미리보기 콘텐츠도 포함될 수 있다\.

이렇게 각 모듈은 폴더 구조 또는 패키지 종속성으로 표현될 수 있다\.

## **View Specific Logic**

Aggregate Model은 SOT로 작용하고 뷰에서 필요한 데이터를 제공할 수 있다\. 그치만 뷰에서의 특정 로직은 어떻게 되고, 그 로직은 무엇이며 어디에 배치해야하는지, 그 로직을 테스트하기 위해서는 어떻게 해야하는지 알아보자\. 

```swift
struct ContentView: View {
    let httpClient: HTTPClientProtocol
    @State private var products: [Product] = []
    @State private var min: Double?
    @State private var max: Double?
    @State private var filteredProducts: [Product] = []
    
    var body: some View {
        VStack {
            HStack {
                TextField("Min", value: $min, format: .number)
                    .textFieldStyle(.roundedBorder)
                TextField("Max", value: $max, format: .number)
                    .textFieldStyle(.roundedBorder)
            }
            Text("Max must be larger than min.")
                .frame(maxWidth: .infinity, alignment: .leading)
                .font(.caption)
                .padding([.bottom], 20)
            
            Button("Apply") {
                filterProducts()
            }
            
            .disabled(!isFormValid)
          
            List(filteredProducts.isEmpty ? products: filteredProducts) { product in
                HStack {
                    Text(product.title)
                    Spacer()
                    Text(product.price, format: .currency(code: "USD"))
                }
            }
            .task {
                do {
                    products = try await httpClient.loadProducts()
                } catch {
                    print(error)
                }
        }
        }.padding()
    }
}

extension ContentView {
	 private func filterProducts() {
        
        guard let min = min,
              let max = max else { return }
        
        filteredProducts = products.filter {
            $0.price >= min && $0.price <= max
        }
    }
    
    private var isFormValid: Bool {
        
        guard let min = min,
              let max = max else { return false }
        
        return min < max
    }
}


struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView(httpClient: HTTPClientStub())
    }
}
```

이처럼 뷰에 한정된 로직은 뷰 내에 함수나 연산 프로퍼티로 만들어서 구현한다\. 만약 비슷한 함수가 모델의 논리와 연관이 된다면 Aggregate Model 내부에 넣을 수 있다\.

위에서 filteredProducts와 isFormValid를 테스트하는 방법은 여러가지가 있다\. 

### Preview

```swift
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView(httpClient: HTTPClientStub())
    }
}
```

### Unit Test

뷰에서 로직을 추출해서 이에 대한 단위 테스트를 작성하는 것

```swift
struct  ProductFilterForm { 
    
    var min: Double ? 
    var max: Double ? 
    
    func  filterProducts ( _  products : [ Product ]) -> [ Product ] { 
        
        guard  let min = min, 
              let max = max else { return [] } 
        
        return products.filter { 
            $0 .price >= min &&  $0 .price <= max 
        } 
    } 
}
```

이런식으로 분리하면 격리된 단위 테스트가 가능하다\.

```swift
func  test_user_can_filter_products_by_price () throws { 
        
        self .continueAfterFailure =  false 
      
        let products = [ 
            제품 (id: 1 , 제목: "제품 1" , 가격: 10 ), 
            제품 (id: 2 , 제목: "제품 2" , 가격: 100 ), 
            제품 (id: 3 , 제목: "제품 3" , 가격: 200 ), 
            제품 (id: 4 , 제목: "제품 4" , 가격: 500 ) 
        ] 
        
        let expectedFilteredProducts = [ 
            제품 (id: 2 , 제목: "제품 2" , 가격: 100 ), 
            제품 (id: 3 , 제목: "제품 3" , 가격: 200 ), 
            제품 (id: 4 , 제목: "제품 4" , 가격: 500 ) 
        ] 
        
        let productFilterForm =  ProductFilterForm (최소: 100 , 최대: 500 ) 
        filteredProducts = productFilterForm.filterProducts(products) 
        
        for expectedProduct in expectedFilteredProducts { 
            
            let product = filteredProducts.first { $0 .id == expectedProduct.id } 
            
            XCTAssertNotNil (product) 
            XCTAssertEqual (product ! .title, expectedProduct.title) 
            XCTAssertEqual (product ! .price , expectedProduct.price) 
        } 
        
    }
```

위처럼 뷰의 로직을 분리해서 단위 테스트를 하는 것은 복잡한 UI에 유익하다\. 

- Xcode에서 프로젝트를 열고 이름 끝에 Tests가 붙은 타겟을 찾습니다\.
- 테스트 코드가 들은 파일을 추가하고 Xcode의 좌측 메뉴에서 체크 표시가 된 Test Navigator를 엽니다\.
- 테스트하고자하는 클래스를 찾아서 클릭하고 테스트를 실행합니다\.
- 모든 테스트가 통과되면 초록색으로 체크 표시가 나타납니다\.

### E2E Test

E2E 테스트는 사용자 관점에서 앱을 테스트하고 회귀에 가장 효과적이다\. 전체 어플리케이션을 테스트하기 때문에 속도가 Unit Test보다 느리다\. 소프트웨어의 대부분의 문제는 어플리케이션이 시스템 수준이 아닌 단위 수준에서 발생한다\. 따라서 의미있는 E2E 테스트가 필요하다\.

```swift
func  test_user_can_filter_products_based_on_price () { 
        
        let app =  XCUIApplication () 
        app.launchEnvironment = [ "ENV" : "TEST" ] 
        app.launch() 
        
        app.textFields[ "minTextField" ].tap() 
        app.textFields[ "minTextField " ].typeText ( "100 " ) app.textFields 
        
        [ "maxTextField" ].tap() 
        app.textFields[ "maxTextField" ].typeText( "500" ) 
        
        app.buttons[ "applyButton" ].tap() 
        
        // 개수가 정확한지 확인합니다 
        XCTAssertEqual ( 3 , app.collectionViews[ "productList" ].cells.count) 
        // 항목이 정확한지 확인합니다 
        XCTAssertEqual ( "Product 2" , app.collectionViews[ "productList" ].staticTexts[ "제품 2" ].label) 
        XCTAssertEqual ( "제품 3" , app.collectionViews[ "제품 목록 " ].staticTexts[ "제품 3" ].label) 
        XCTAssertEqual ( "제품 4" , app.collectionViews[ "제품 목록" ].staticTexts[ "제품 4" ].label) 
    }
```

## Screen vs Views

React에서는 Components, Flutter에서는 Widgets이라 불리는 것들 SwiftUI에서는 Views겠네요\. 아무튼 Flutter에서는 위젯이 재사용 가능한 컨트롤로 구성된 전체 화면을 나타내는지 여부에 따라 위젯을 분리하고 있었다\. React, Flutter 및 SwiftUI의 본질은 매우 유사하기 때문에 SwiftUI 애플리케이션을 구축할 때 동일한 원칙을 적용할 수 있다\.

예를 들어, 영화의 세부 정부를 표시할 때 해당 뷰를 MovieDetailView라고 부르는 대신에 MovieDetailScreen 이라고 부를 수 있습니다\. 이렇게하면 세부 정부 뷰가 실제 화면이며 재사용이 가능한 자식 뷰가 아니라는 것이 명확해진다\. 

**화면**

- 영화 세부 정보 화면
- 홈 화면
- 로그인 화면
- 등록화면
- 설정화면

**조회수**

- 평가보기
- 메시지뷰
- 알림목록보기
- 알림셀뷰

## Grouping View Events

SwiftUI에서 재사용이 가능한 뷰를 만드는 방법은 이벤트를 부모 뷰에 위임하는 것이다\. 

```swift
//자식뷰
struct ReminderCellView: View { 
    
    let index: Int 
    let onChecked: (Int) -> Void 
    let onDelete: (Int) -> Void 

var body: some View { 
        HStack { 
            Image (systemName: "square") 
                .onTapGesture { 
                    onChecked (index) } 
                Text 
            ("ReminderCellView \(index)") 
            Spacer () 
            Image (systemName: "trash") 
                .onTapGesture { 
                    onDelete (index) 
                } 
        } 
    }
    
//부모뷰    
struct ContentView: View { 
var body: some View { 
        List ( 1 .. .20 , id : \. self ) { 
            ReminderCellView 의 인덱스 ( 인덱스 : 인덱스, onChecked : { 인덱스 
                // 작업
             }, onDelete : { 인덱스 
                // 작업 } 
            ) 
        } 
    } 
}

```

그치만 이렇게 했을 때 자식뷰\(ReminderCellView\)가 복잡해지게 될 경우에, 예를 들어 노출되는 이벤트가 많아질수록 호출을 하는 부모뷰\(ContentView\) 쪽은 더욱 복잡해진다\. 따라서 모든 이벤트를 간단한 열거형을 통해서 이 문제를 해결할 수 있다\.

```swift
// 열거형을 사용하여 그룹화를 한다.
enum  ReminderCellEvents { 
    case  onChecked (Int) 
    case  onDelete (Int)
 }
```

```swift
// 여러개의 이벤트 클로저를 처리하는 대신 단일 열거형 기반 이벤트 구조만 처리하면 된다.
struct  ReminderCellView : View { 
    
    let index: Int 
    let onEvent: ( ReminderCellEvents ) -> Void 
    
    var body: some  View { 
        HStack { 
            Image (systemName: "square" ) 
                .onTapGesture { 
                    onEvent(.onChecked(index)) 
                } 
            Text ( "ReminderCellView \(index) " ) 
            Spacer () 
            Image (systemName: "trash" ) 
                .onTapGesture { 
                    onEvent(.onDelete(index) ) 
                } 
        } 
    }
```

```swift
// 호출하는 쪽도 깔끔해진다.
struct  ContentView : View {
    var body: some  View {
        List ( 1 ... 20 , id: \.self ) {
            ReminderCellView 의 인덱스 (인덱스: 인덱스) {
                switch 이벤트 의 이벤트 {
                case .onChecked( let index): print (인덱스)
                case .onDelete( let index): print (인덱스)
                }
            }
        }
    }
}
```

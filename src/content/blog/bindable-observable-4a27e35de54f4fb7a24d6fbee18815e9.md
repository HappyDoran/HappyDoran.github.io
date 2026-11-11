---
schemaVersion: 2
title: "@Bindable, @Observable"
description: "앱의 데이터 모델과 뷰 사이에 연결을 만듭니다."
tags: ["SwiftUI", "상태 관리"]
publishedAt: "2024-09-05T03:36:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 23
---

## Managing model data in your app

앱의 데이터 모델과 뷰 사이에 연결을 만듭니다\.

### OverView

SwiftUI 앱은 사람들이 앱의 UI를 사용하여 변경할 수 있는 데이터를 표시합니다\. 이 데이터를 관리하기 위해 앱은 데이터 모델을 만들고 이 데이터 모델은 데이터와 데이터가 상호작용 하는 뷰를 분리합니다\. 이 분리는 모듈성을 촉진하고, 테스트 가능성을 개선하며, 앱이 작동하는 방식에 대한 추론을 더 쉽게 만드는데 도움이 됩니다\. 

모델 데이터를 화면에 나타내는 내용과 동기화 상태로 유지하는 것, 특히 여러 뷰에서 동시에 나타나는 것은 어렵습니다\. SwiftUI는 Observation 덕분에 데이터에 대한 변경 사항으로 앱의 UI를 최신 상태로 유지하는데 도움이 됩니다\. 

[Observation](<https://app.notion.com/p/579db5110ae8459aa6a507b8bcd9f70c>) 

### Make model data observation

SwiftUI에서 데이터 변경 사항을 볼 수 있도록 하려면 ` Observable ` 데이터 모델에 매크로를 적용합니다\. 이 매크로는 컴파일 타임에 데이터 모델에 Observation Support를 추가하여 데이터 모델 코드를 데이터를 저장하는 속성에 집중시킵니다\.

```swift
@Observable class Book: Identifiable { 
// Observable 매크로는 내부적으로 데이터 모델이 Observable protocol 을 따르도록 만듭니다. 
// 하지만 프로토콜을 단독으로 사용하지 마세요. 
// 프로토콜 단독으로는 아무일도 할 수 없기 때문입니다. 반드시 매크로를 활용하세요.
    var title = "Sample Book Title"
    var author = Author()
    var isAvailable = true
}
```

### Observe model data in a view

SwiftUI에서 뷰는 관찰 가능한 데이터 모델객체에 대한 종속성을 형성합니다\. body 내부에서 Book 인스턴스의 프로퍼티에 접근하게 되면 종속성이 생깁니다\. 만약 body에서 관찰 가능한 데이터 모델 객체의 프로퍼티를 읽지 않는다면 뷰는 종속성을 추적하지 않습니다\.

추적하고 있던 프로퍼티가 변경된다면 SwiftUI가 뷰를 업데이트합니다\. 만약 body가 읽지 않는 프로퍼티가 변경된다면 뷰는 영향을 받지 않고 불필요한 업데이트를 방지합니다\.\(대충 바뀐거만 업데이트 한다는 뜻\) 예를 들어 해당 코드는 book의 title이 변경될 때만 업데이트 되지만 author와 isAvailable이 변경될 때는 업데이트 되지 않습니다\.

```swift
struct BookView: View {
    var book: Book
    
    var body: some View {
        Text(book.title)
    }
}
```

SwiftUI는 전역 속성이나 싱글톤을 사용하는 경우와 같이 뷰가 관찰 가능한 유형을 저장하지 않는 경우에도 이러한 종속성 추적을 설정합니다\.

→ 뷰 자체가 직접 값을 보유하고 있지 않더라도 마찬가지로 동작합니다\.

```swift
var globalBook: Book = Book()


struct BookView: View {
    var body: some View {
        Text(globalBook.title)
    }
}
```

Observation은 연산 프로퍼티의 변화도 잘 추적합니다\. 예를 들어 해당 코드의 뷰는 book 모델의 isAvailable이 변경될 때 업데이트 됩니다\.

```swift
@Observable class Library {
    var books: [Book] = [Book(), Book(), Book()]
    
    var availableBooksCount: Int {
        books.filter(\.isAvailable).count
    }
}


struct LibraryView: View {
    @Environment(Library.self) private var library
    
    var body: some View {
        NavigationStack {
            List(library.books) { book in
                // ...
            }
            .navigationTitle("Books available: \(library.availableBooksCount)")
        }
    }
}
```

뷰가 모든 컬렉션 유형의 객체 컬렉션에 종속성을 형성하면 뷰는 컬렉션 자체에 대한 변경 사항을 추적할 수 있습니다\. 예를 들어 해당 코드의 뷰는 body가 books를 읽기 떄문에 종속성을 형성합니다\. 컬렉션에 books 항목을 CRUD하는 것 같이 변경 사항이 발생하면, SwiftUI가 뷰를 업데이트 합니다\.

```swift
struct LibraryView: View {
    @State private var books = [Book(), Book(), Book()]


    var body: some View {
        List(books) { book in 
            Text(book.title)
        }
    }
}
```

그러나 LibraryView는 body에서 book의 book\.title에 직접적으로 접근하고 있지 않고 있기 떄문에, 이에 대한 종속성이 형성되지 않습니다\. LibraryView는 List를 보유합니다\. List는 내부적으로 @escaping 클로저를 통해 List의 item들을 만들고, 이를 기반으로 화면에 View를 그립니다\. 이는 곧 List의 내부 Item인 Text item이 book\.title에 대한 종속성을 가진다는 뜻입니다\. 만약에 특정한 Book의 title이 변경이 된다면, 이에 대한 종속성을 가지고 있는 Text item에만 업데이트가 생길 것입니다\.

> Observation은 Observable한 객체의 프로퍼티 중 body에서 접근하고 있는 프로퍼티들만 추적합니다\.

> 💡 <strong>무슨 말인지 모르겠습니다\.</strong>
> 
> The view stores the ` List ` content closure as an ` @escaping ` closure that SwiftUI calls when lazily creating list items before they appear on the screen\.
> 
> → 그냥 List는 모두 Lazy하다고 하는 뜻입니다\. 그러니까 스크롤 형식의 많은 내용을 보여줄 때는 List를 사용하는게 좋다고 합니다\. \(LazyVStack도 같은 뉘앙스입니다\.\)

관찰 가능한 모델 데이터 객체를 다른 뷰와 공유할 수도 있습니다\. 받은 쪽의 뷰는 body에 있는 property를 읽을 때 종속성을 형성합니다\. 예를 들어 해당 코드에서 LibraryView는 BookView와 BookView의 인스턴스를 공유하고 BookView는 title을 표시합니다\. title이 변경되면 SwiftUI는 LibraryView는 업데이트 하지 않고  BookView만 업데이트 합니다\. 

```swift
struct LibraryView: View {
    @State private var books = [Book(), Book(), Book()]


    var body: some View {
        List(books) { book in 
            BookView(book: book)
        }
    }
}


struct BookView: View {
    var book: Book
    
    var body: some View {
        Text(book.title)
    }
}
```

뷰에 종속성이 없으면 SwiftUI는 데이터가 변경될 때 뷰를 업데이트 하지 않습니다\. 이 접근 방식을 사용하면 관찰 가능한 모델 데이터 객체가 각 중간 뷰가 종속성을 형성하지 않고도 뷰 계층의 여러 계층을 통과할 수 있습니다\.

```swift
// book 프로퍼티의 어떤것이 변해도 바뀌지 업데이트 되지 않습니다.
struct LibraryView: View {
    @State private var books = [Book(), Book(), Book()]
    
    var body: some View {
        LibraryItemView(book: book)
    }
}


// book 프로퍼티의 어떤것이 변해도 바뀌지 업데이트 되지 않습니다.
struct LibraryItemView: View {
    var book: Book
    
    var body: some View {
        BookView(book: book)
    }
}


// book.title이 변경되면 업데이트 됩니다.
struct BookView: View {
    var book: Book
    
    var body: some View {
        Text(book.title)
    }
}
```

그러나 만약 참조 타입의 Observable 데이터 모델의 참조 자체가 변경된다면 View에서 업데이트가 발생합니다\. 이는 데이터 모델이 Observable이라서가 아니라, 데이터 모델 참조 자체가 View의 일부이기 떄문입니다\. 아래 코드에서 Book 자체가 변경된다면 view가 업데이트 될 것 입니다\.

```swift
struct BookView: View {
    var book: Book
    
    var body: some View {
        // ...
    }
}
```

Observable 데이터 모델은 다른 객체를 통해 접근하더라도 종속성을 형성할 수 있습니다\. 예를 들어 author의 name변경되면 업데이트됩니다\.

```swift
struct LibraryItemView: View {
    var book: Book
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(book.title)
            Text("Written by: \(book.author.name)")
                .font(.caption)
        }
    }
}
```

### Create the source of truth for model data

> 💡 <strong>SOT\(Source Of Truth\)란?</strong>
> 
> 데이터베이스, 애플리케이션, 프로세스 등의 모든 데이터에 대해서 하나의 출처를 사용하는 개념
> 
> → 정확성, 일관성, 신뢰성을 보장하고, 일관성 있는 의사결정 및 작업 효율성을 높이는데 도움을 줍니다\.

모델 데이터를 Source of truth로 만들고 싶다면, private var로 변수를 선언하고 Observable Model Type의 인스턴스를 생성하세요\. 그리고 @State 프로퍼티 래퍼로 감싸면 됩니다\.

```swift
struct BookView: View {
    @State private var book = Book()

    var body: some View {
        Text(book.title)
    }
}
```

State로 감싸면 SwiftUI에게 해당 인스턴스의 저장공간을 관리하라고 말하고 있는 겁니다\. BookView가 재생성 될 때마다, book 변수는 해당 인스턴스에 연결됩니다\. 이것이 view에게 하나의 source of truth를 형성하는 과정입니다\.

App이나 Scene 인스턴스 단계에서 State 객체를 생성해도 됩니다\.

```swift
@main
struct BookReaderApp: App {
    @State private var library = Library()

    var body: some Scene {
        WindowGroup {
            LibraryView()
                .environment(library)
        }
    }
}
```

### Share model data throughout a view hierachy

Library와 같은 데이터 모델을 보유하고 있다면, 이를 앱 하위의 특정 장소에 공유하고 싶을 것입니다\. 두가지 방법이 있습니다\.

- 뷰 계층의 뷰 각각에 모델 객체를 전달하는 방법
- 모델 객체를 뷰의 Environment로 추가하는 방법

전자의 방법은 편하지만, 뷰 계층이 깊어지면 이를 어디서 필요로하는지 알기 어려워서 코드 이해에 안좋은 영향을 줍니다\.

그래서 Environment에 모델 객체를 추가하는 방식이 더 선호됩니다\. Environment\(<em>:</em>:\)혹은 environment\(\_:\) modifier를 사용하면 되는데, 전자의 경우 좀 더 과정이 복잡합니다\.

#### Environment\(<em>:</em>:\)

EnvironmentKey를 커스텀해서 생성해야합니다\. EnvironmentValues를 확장하여 custom key를 가질 수 있도록 get과 set을 설정합니다\.

```swift
extension EnvironmentValues {
    var library: Library {
        get { self[LibraryKey.self] }
        set { self[LibraryKey.self] = newValue }
    }
}

private struct LibraryKey: EnvironmentKey {
    static var defaultValue: Library = Library()
}


@main
struct BookReaderApp: App {
    @State private var library = Library()

    var body: some Scene {
        WindowGroup {
            LibraryView()
                .environment(\\.library, library)
        }
    }
}


struct LibraryView: View {
    @Environment(\\.library) private var library

    var body: some View {
        // ...
    }
}

```

#### Environment\(\_:\)

별도로 environment value를 custom하지 않아도 됩니다\. 다만 반드시 Observable mecro를 사용한 객체만 넘겨줘야 합니다\.

```swift
@main
struct BookReaderApp: App {
    @State private var library = Library()

    var body: some Scene {
        WindowGroup {
            LibraryView()
                .environment(library)
        }
    }
}

struct LibraryView: View {
    @Environment(Library.self) private var library

    var body: some View {
        // ...
    }
}
```

상위에서 environment로 넘겨준 값이 확실하지 않다면 에러가 발생할 수 있기 때문에 optional 처리를 해주는 것도 좋은 방법입니다\. SwiftUI는 값이 없는 경우 nil을 반환해주기 때문입니다\.

```swift
@Environment(Library.self) private var library: Library?
```

### Change model data in a view

앱을 사용할 때 데이터가 바뀌는 경우는 흔합니다\. 어떤 View에서든지 이 변경사항이 바로 반영되어야합니다\. Observation과 함께라면 어떠한 프로퍼티 래퍼나 바인딩없이도 데이터 변화를 반영할 수 있습니다\. 아래 코드에서도 어떠한 프로퍼티 래퍼도 isAvailable의 변화를 감지하고 반영합니다\.

```swift
struct BookView: View {
    var book: Book

    var body: some View {
        List {
            Text(book.title)
            HStack {
                Text(book.isAvailable ? "Available for checkout" : "Waiting for return")
                Spacer()
                Button(book.isAvailable ? "Check out" : "Return") {
                    book.isAvailable.toggle()
                }
            }
        }
    }
}
```

하지만 View에서 변경가능한 프로퍼티의 값을 변경하기 전에 바인딩이 필요한 경우가 있을 수 있습니다\. 바인딩을 제공하려면 모델 데이터를 @Bindable 프로퍼티 래퍼로 감싸주어야 합니다\. 예를 들어 다음 코드에서는 book 변수를 Bindable로 감싸주었습니다\. 그런 다음 TextField로 title 프로퍼티를 변경하고, Toggle로 isAvailable 프로퍼티를 변경합니다\. 그리고 $를 통해 각 프로퍼티를 바인딩 해줍니다\.

```swift
struct BookEditView: View {
    @Bindable var book: Book
    @Environment(\\.dismiss) private var dismiss

    var body: some View {
        VStack() {
            HStack {
                Text("Title")
                TextField("Title", text: $book.title)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit {
                        dismiss()
                    }
            }

            Toggle(isOn: $book.isAvailable) {
                Text("Book is available")
            }

            Button("Close") {
                dismiss()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}
```

Bindable은 프로퍼티를 포함해 Observable 객체인 변수에도 사용이 가능합니다\. 이는 global 변수인 경우이든, local 변수이든 마찬가지입니다\. 

## 참고

<a class="notion-resource-card" href="https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app"><span class="notion-resource-label">링크</span><span>https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app</span></a>

<a class="notion-resource-card" href="https://inuplace.tistory.com/1381"><span class="notion-resource-label">링크</span><span>https://inuplace.tistory.com/1381</span></a>

<a class="notion-resource-card" href="https://sujinnaljin.medium.com/swiftui-view%EB%A5%BC-redraw-%ED%95%98%EB%8A%94-%EC%A1%B0%EA%B1%B4%EC%9D%80-%EC%96%B4%EB%96%BB%EA%B2%8C-%EB%90%A0%EA%B9%8C-db3d7551df2"><span class="notion-resource-label">링크</span><span>https://sujinnaljin.medium.com/swiftui-view를-redraw-하는-조건은-어떻게-될까-db3d7551df2</span></a>

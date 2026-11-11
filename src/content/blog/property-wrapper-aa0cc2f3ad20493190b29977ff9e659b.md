---
schemaVersion: 2
title: "Property Wrapper"
description: "@ObservedObject, @State, @EnvironmentObject, @Binding 처럼 생긴 애들이 프로퍼티 래퍼라고 합니다."
tags: ["Swift", "언어 기초"]
publishedAt: "2024-08-27T07:14:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 4
---

## Property Wrappers

@ObservedObject, @State, @EnvironmentObject, @Binding 처럼 생긴 애들이 프로퍼티 래퍼라고 합니다\.

프로퍼티 래퍼는 프로퍼티가 저장되는 방법을 관리하는 코드와 프로퍼티를 정의하는 코드사이에 분리 계층을 추가합니다\. 

프로퍼티 래퍼를 사용할 때는 래퍼를 정의할 때 관리 코드를 한번 작성한 다음, 여러 프로퍼티에 적용하여 해당 관리 코드를 재사용합니다\.

→ 보일러 플레이트 코드를 줄이기 위해서 사용합니다\. 반복되는 작업을 줄이기 위해서라고 하네요\.

### 프로퍼티 래퍼를 사용하기 전

```swift
struct Rectangle {
    private var _width: Int
    private var _height: Int
    
    init(width: Int, height: Int) {
        self._width = width
        self._height = height
    }
    
    var width: Int {
        get{return min(_width,10)}
        set{_width = newValue}
    }
    
    var height: Int {
        get{return min(_height,10)}
        set{_height = newValue}
    }
}


private var rectangle = Rectangle(width: 12, height: 8)
print(rectangle.height, rectangle.width) // 10 8

```

### 프로퍼티 래퍼를 사용한 후

#### 프로퍼티 래퍼에 초기값을 준 경우

```swift
@propertyWrapper 
struct LimitedValueByTen {
    private var value: Int = 0
    var wrappedValue: Int {
        get {
            return self.value
        }
        set {
            value = min(10,newValue)
        }
    }
}

struct Rectangle {
    @LimitedValueByTen var width: Int
    @LimitedValueByTen var height: Int
}

private var rectangle: Rectangle = Rectangle()

rectangle.height = 12
rectangle.width = 8
print(rectangle.height,rectangle.width) // 10 8
```

@propertyWrapper를 작성하면 컴파일러가 wrappedValue를 추가하라고 알려줍니다\.

값을 저장할 value를 정의하고, wrappedValue를 통해 computed property를 선언해줍니다\.

#### 프로퍼티 래퍼에 초기값을 주지 않은 경우

프로퍼티 래퍼에 초기화 함수를 구현한 경우

```swift
@propertyWrapper
struct LimitedValueByTen {
    private var value: Int
    var wrappedValue: Int {
        get {
            return self.value
        }
        set {
            value = min(10,newValue)
        }
    }
    
    init(wrappedValue initialValue: Int) {
        self.value = initialValue
    }
}

struct Rectangle {
    @LimitedValueByTen var width: Int
    @LimitedValueByTen var height: Int
}

private var rectangle: Rectangle = Rectangle(width: 12, height: 8)

print(rectangle.height,rectangle.width) // 8 12

rectangle.height = 20
rectangle.width = 20

print(rectangle.height,rectangle.width) // 10 10
```

init\(\) 메소드를 여러개 가질 수도 있습니다\.

```swift
@propertyWrapper
struct LimitedValueByTen {
    private var value: Int
    private var maximum: Int
    var wrappedValue: Int {
        get {
            return self.value
        }
        set {
            value = min(newValue, maximum)
        }
    }
    
    init(wrappedValue initialValue: Int) {
        self.value = initialValue
        self.maximum = 10
    }
    
    init(maximum: Int) {
        self.value = 0
        self.maximum = maximum
    }
    
    init(wrappedValue initialValue: Int, maximum: Int) {
        self.value = initialValue
        self.maximum = maximum
    }
    
}

struct Rectangle {
    @LimitedValueByTen(maximum: 10) var width: Int
    @LimitedValueByTen(wrappedValue: 0, maximum: 10) var height: Int
}

private var rectangle1: Rectangle = Rectangle()

print(rectangle1.height,rectangle1.width) // 0 0
```

### Projected value

프로퍼티 래퍼에서는 Projected Value라는 기능이 있습니다\.

내가 정의한 프로퍼티 래퍼에서 원하는대로 값을 표현할 수 있습니다\. 앞에 <strong>$</strong>를 붙여서 사용하면 됩니다\.

```swift
@propertyWrapper
struct LimitedValueByTen {
    private var value: Int
    private(set) var projectedValue: String
    
    var wrappedValue: Int {
        get {
            return self.value
        }
        set {
            value = min(10,newValue)
            projectedValue = "projectedValue는 \(value)입니다"
        }
    }
    
    init(wrappedValue initialValue: Int) {
        self.value = initialValue
        self.projectedValue = ""
    }
}

struct Rectangle {
    @LimitedValueByTen var width: Int
    @LimitedValueByTen var height: Int
}

private var rectangle: Rectangle = Rectangle(width: 12, height: 8)

print(rectangle.height,rectangle.width) // 8 12

rectangle.height = 20
rectangle.width = 20

print(rectangle.$height) // projectedValue는 10입니다
print(rectangle.$width) // projectedValue는 10입니다
```

→ SwiftUI에서 자주 보던 dollar sign\($\)

그럼 이제 @State의 Projected value를 통해서 Binding값을 얻을 수 있다는 것입니다\.

```swift
@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
@frozen @propertyWrapper public struct State<Value> : DynamicProperty {

    /// Creates a state property that stores an initial wrapped value.
    ///
    /// You don't call this initializer directly. Instead, SwiftUI
    /// calls it for you when you declare a property with the `@State`
    /// attribute and provide an initial value:
    ///
    ///     struct MyView: View {
    ///         @State private var isPlaying: Bool = false
    ///
    ///         // ...
    ///     }
    ///
    /// SwiftUI initializes the state's storage only once for each
    /// container instance that you declare. In the above code, SwiftUI
    /// creates `isPlaying` only the first time it initializes a particular
    /// instance of `MyView`. On the other hand, each instance of `MyView`
    /// creates a distinct instance of the state. For example, each of
    /// the views in the following ``VStack`` has its own `isPlaying` value:
    ///
    ///     var body: some View {
    ///         VStack {
    ///             MyView()
    ///             MyView()
    ///         }
    ///     }
    ///
    /// - Parameter value: An initial value to store in the state
    ///   property.
    public init(wrappedValue value: Value)

    /// Creates a state property that stores an initial value.
    ///
    /// This initializer has the same behavior as the ``init(wrappedValue:)``
    /// initializer. See that initializer for more information.
    ///
    /// - Parameter value: An initial value to store in the state
    ///   property.
    public init(initialValue value: Value)

    /// The underlying value referenced by the state variable.
    ///
    /// This property provides primary access to the value's data. However, you
    /// don't typically access `wrappedValue` explicitly. Instead, you gain
    /// access to the wrapped value by referring to the property variable that
    /// you create with the `@State` attribute.
    ///
    /// In the following example, the button's label depends on the value of
    /// `isPlaying` and the button's action toggles the value of `isPlaying`.
    /// Both of these accesses implicitly access the state property's wrapped
    /// value:
    ///
    ///     struct PlayButton: View {
    ///         @State private var isPlaying: Bool = false
    ///
    ///         var body: some View {
    ///             Button(isPlaying ? "Pause" : "Play") {
    ///                 isPlaying.toggle()
    ///             }
    ///         }
    ///     }
    ///
    public var wrappedValue: Value { get nonmutating set }

    /// A binding to the state value.
    ///
    /// Use the projected value to get a ``Binding`` to the stored value. The
    /// binding provides a two-way connection to the stored value. To access
    /// the `projectedValue`, prefix the property variable with a dollar
    /// sign (`$`).
    ///
    /// In the following example, `PlayerView` projects a binding of the state
    /// property `isPlaying` to the `PlayButton` view using `$isPlaying`. That
    /// enables the play button to both read and write the value:
    ///
    ///     struct PlayerView: View {
    ///         var episode: Episode
    ///         @State private var isPlaying: Bool = false
    ///
    ///         var body: some View {
    ///             VStack {
    ///                 Text(episode.title)
    ///                     .foregroundStyle(isPlaying ? .primary : .secondary)
    ///                 PlayButton(isPlaying: $isPlaying)
    ///             }
    ///         }
    ///     }
    ///
    public var projectedValue: Binding<Value> { get } //여기 있네요 하하
}
```

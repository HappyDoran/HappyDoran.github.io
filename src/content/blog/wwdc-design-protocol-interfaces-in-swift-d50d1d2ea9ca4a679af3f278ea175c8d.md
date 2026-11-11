---
schemaVersion: 2
title: "WWDC) Design protocol interfaces in Swift"
description: "Understand type erasure"
category: "미분류"
categorySlug: "uncategorized"
tags: ["Swift", "언어 기초"]
publishedAt: "2024-08-27T15:13:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 22
---

> 🤔 **무엇을 배우나요?**
> 
> **실존 타입을 사용하는 방법**을 소개하고, **불투명 반환 타입으로 인터페이스와 구현을 분리하는 방법**을 알아보며, **구체적인 타입 간의 관계를 식별하고 보장하는데 도움이 될 수 있는 동일 타입 요구사항을 소개**합니다\.

## Understand type erasure

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-001.png>)

여기 한쌍의 프로토콜과 네가지 구체적인 유형이 있는 데이터 모델이 있습니다\.

Animal은 Chicken, Cow에서 채택할 프로토콜이고, Food는 Egg, Milk에서 채택할 프로토콜입니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-002.png>)

닭은 알을 생산하고, 소는 우유를 생산합니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-003.png>)

따라서 음식 생산을 추상화하기 위해 Animal 프로토콜에 produce\(\) 메서드를 추가합니다\.

→ 연관 타입을 사용함으로써 produce\(\)의 다양한 반환 타입을 추상화 할 수 있도록 합니다\. 특정 타입의 Animal이 주어지고 produce\(\)를 호출하면 구체적인 Animal 의 타입에 따라서 특정 타입의 Food가 반환됩니다\.

이를 다이어그램으로 표현하면

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-004.png>)

Self는 Animal 프로토콜을 채택하는 타입이 될 것이고, CommodityType은 Food를 따르는 타입이 될 것입니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-005.png>)

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-006.png>)

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-007.png>)

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-008.png>)

이로써 Chicken 타입은 CommodityType이 Egg인 Animal 프로토콜을 따르고, 

Cow 타입은 CommodityType이 Milk인 Animal 프로토콜을 따릅니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-009.png>)

이제 동물이 가득한 Farm 구조체가 있다고 해봅시다\. 

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-010.png>)

농장에서는 한 종류의 동물이 아닌 여러 종류의 동물을 키우기 때문에 ` [any Animal] `로 모든 Animal 타입을 받을 수 있게 처리할 수 있습니다\.

이처럼 서로 다른 구체적인 유형에 대해 동일한 표현을 사용하는 이러한 전략을 ` type Erasure(타입 삭제) ` 라고 합니다\. 타입 이레이저는 이렇게 Animal 프로토콜을 따르는 특정 타입이 채워진다고 명시한 하는 것을 말합니다\.

**무슨 소린지 모르겠습니다\.**

produceCommodities\(\) 메서드는 animals array를 매핑하여 각 동물에 대해 produce\(\) 메서드를 호출합니다\. Type Erasure는 기본 동물 타입에 대한 정적 타입 관계를 제거한다는 것을 알고 있으므로, 이 코드 타입이 검사하는 이유를 이해하려면 더 깊게 파고드는 것이 좋습니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-011.png>)

여기에서 animal은 any Animal 타입이고, produce\(\)의 반환 타입은 associated 타입입니다\. 존재 타입이 연관 타입을 호출하면 컴파일러는 타입 이레이저를 이용해 결과 타입을 지정해줍니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-012.png>)

타입 이레이저는 이러한 연관 타입을 동등한 제약 조건이 있는 해당 존재 타입으로 대체합니다\. 구체적인 Animal 타입과 연관된 CommodityType을 any 타입으로 대체하여 관계를 삭제합니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-013.png>)

쉽게 얘기 하면, any Animal 타입 배열에 Cow를 넣으면 animal이 any Animal 타입일지라도 Cow로 결졍되면서 Milk를 반환해준다는 의미입니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-014.png>)

이러한 동작이 가능한 이유는 상위 타입과 하위 타입의 개념 때문입니다\. 컴파일 시점에 구체적인 타입은 알 수 없지만, Cow가 Animal의 하위 타입이라는 것은 알 수 있습니다\. 컴파일러가 Cow가 Animal의 하위 타입인 것을 보고 any Animal을 Cow로 결정하고, Cow의 produce 리턴타입인 milk를 반환할 수 있는 것입니다\. 이것은 Animal 프로토콜을 준수하는 모든 구체적인 유형에 대해 항상 안전합니다\.

반면에 메서드나 생성자의 매개변수에 associated type이 들어가면 어떻게 될까요? 

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-015.png>)

해당 코드에서 Animal 프로토콜의 eat 메서드는 associated 타입인 FeedType을 매개변수로 갖습니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-016.png>)

eat을 호출하려고 할 때는 이전 예시와 다르게 타입 이레이저를 수행할 수 없습니다\.

타입의 추론 방향이 반대이기 때문입니다\.

Animal이 어떤 타입인지 명확하게 결정되지 않았기 때문에 인자로 전달되는 FeedType도 명확하게 결정할 수 없습니다\. 

#### 결론

타입 이레이저는 인스턴스 → 메서드의 반환 타입으로는 동작하지만,

메서드 파라미터 타입 → 인스턴스 방향으로는 동작되지 않는다는 것을 알 수 있습니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-017.png>)

## Hide implementation details

구체적인 결과 타입을 추상화하여 코드 조각의 필수 인터페이스를 구현 세부 정보와 분리하여 변경시 정적 유형 할당을 더욱 모듈화하고 강력하게 만드는 방법을 살펴보겠습니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-018.png>)

Animal 프로토콜은 isHungry라는 프로퍼티를 가집니다\. 

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-019.png>)

Farm은 hungryAnimal을 찾아 먹이를 주는 역할을 합니다\.

hungryAnimal의 filter는 동물이 적을 때는 유용할 수 있지만, 동물이 많아지면 연산이 불필요하게 증가할 것입니다\.  **왜 그런지 모르겠습니다\.**

lazy를 이용하면 이러한 불필요한 임시 할당을 피할 수 있습니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-020.png>)

LazyFilterSequence는 lazy\.filter 연산을 하면 반환되는 타입입니다\. 

LazyFilterSequence로 변경하면 결과는 같지만 임시 할당을 피할 수 있습니다\.

hungryAnimals 타입은 LazyFilterSequence라는 복잡한 타입으로 선언되어야하는데, 호출하는 쪽은 이걸 몰라도 됩니다\. 호출하는 입장에서는 “아무튼 반복할 수 있는 컬렉션 이기만 하면돼”라고 생각하는겁니다\.

그치만 이러한 선언은 불필요한 구현 세부 사항을 노출합니다\. 

이럴때는 some Collection을 사용하여 불필요한 노출을 숨길 수 있습니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-021.png>)

LazyFilterSequence는 Collection 프로토콜을 준수하고 있기 때문에 some Collection으로 숨길 수 있습니다\.

하지만 이 방법은 animal이 어떠한 타입인지 특정하기가 어렵습니다\.

hungryAnimals가 컬렉션인걸 알고는 있지만 컬렉션에서 어떤 요소인지는 알수가 없습니다\.

따라서 Some Collection의 뒤에 &lt;&gt;로 어떠한 Element 타입인지 정보를 알려줄 수가 있습니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-022.png>)

이렇게 이제 복잡한 타입은 숨기고 Element 정보는 줄 수 있는, 우리가 원하는 인터페이스 형태가 되었습니다\.

이제 항상 Lazy하게 동작하는게 아니라 필요에 따라 선택하고 싶을 때도 있습니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-023.png>)

이렇게 조건문을 이용해서 분기처리를 하면 되는데 이때 반환 타입이 1개가 아니기 때문에 컴파일 에러가 발생합니다\. 이럴때는 some 대신에 any를 사용하면 됩니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-024.png>)

해당 프로퍼티가 호출이 되면 다른 타입으로 반환할 수 있다는 것을 알려주는 것이죠\.

## Identify type relationships

이제는 여러 추상화된 프로토콜의 관계를 식별하고 보장하는 방법을 알아보겠습니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-025.png>)

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-026.png>)

이제부터는 Animal에게 Feed를 주기 위해서는 작물을 재배하고, 수확해야 합니다\.

각각의 동물에게 먹이를 주기 전에 grow와 harvest 단계가 추가되었습니다\.

위와 같이 동물마다 grow할 작물과 수확한 먹이 구조체를 따로 만드는 것은 비효율적일 겁니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-027.png>)

먹이를 주는 메서드를 추상화하여 feedAnimal 메서드를 만들었습니다\. 파라미터로 some Animal 타입을 받아서 동물에 따라 다른 작물을 생산하려고 합니다\. 그럼 동물마다 따로 정의할 필요 없이, 하나로 합칠 수 있습니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-028.png>)

AnimalFeed에서는 CropType에서 Crop을 연관 타입을 사용하고, Crop에서는 FeedType에서 AnimalFeed를 연관 타입으로 사용합니다\. 이런 구조는 서로가 서로를 연관 타입으로 사용하면서 무한 중첩이 되버립니다\. 

이 모델들은 타입에 안전하지도 않습니다\. 소에게는 Hay를 길러서 Alfalfa를 수확해야 하는데, Hay가 Scratch로 바뀌어도 알 방법이 없죠\. Hay도 AnimalFeed이고 Scratch도 AnimalFeed입니다\.

**무슨 소린지 모르겠습니다\.**

where를 사용하면 이 문제를 해결할 수 있습니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-029.png>)

AnimalFeed와 Crop의 associated 타입에 where절로 제약을 추가했습니다\.

AnimalFeed의 Crop은 CropType의 FeedType와 현재의 AnimalFeed가 동일해야 합니다\.

또, Crop의 AnimalFeed의 CropType은 현재의 Crop과 동일해야 하죠\.

즉, AnimalFeed\(1\-1\) \-&gt; Crop\(1\-2\) \-&gt; AnimalFeed\(2\-1\) \-&gt; Crop\(2\-2\) \.\.\. 로 무한 중첩되었던 구조가

AnimalFeed\(1\-1\) &lt;\-&gt; Crop\(1\-2\)로 서로를 명확히 알 수 있게 된 것입니다\.

![](<../../assets/blog/wwdc-design-protocol-interfaces-in-swift-d50d1d2ea9ca4a679af3f278ea175c8d/image-030.png>)

전체 다이어그램을 보면 Cow, Hay, Alfalfa가 한 세트라는 것과 Chicken, Scratch, Milet이 한 세트인 것을 명확하게 알 수 있고, 이 관계가 정확하게 모델링 되었습니다\.

## 참고

<a class="notion-resource-card" href="https://gyuios.tistory.com/190"><span class="notion-resource-label">링크</span><span>https://gyuios.tistory.com/190</span></a>

<a class="notion-resource-card" href="https://jeong9216.tistory.com/563"><span class="notion-resource-label">링크</span><span>https://jeong9216.tistory.com/563</span></a>

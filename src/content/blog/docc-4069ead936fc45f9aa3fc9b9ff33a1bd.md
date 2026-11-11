---
schemaVersion: 2
title: "DocC"
description: "문서 주석을 작성해야 하는 이유"
category: "미분류"
categorySlug: "uncategorized"
tags: ["Swift", "개발 도구"]
publishedAt: "2024-08-27T07:14:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 6
---

## 문서 주석을 작성해야 하는 이유

### Quick Help

Quick Help를 통해서 다른 소스파일에서 필요한 내용을 확인할 수 있습니다\.

![](<../../assets/blog/docc-4069ead936fc45f9aa3fc9b9ff33a1bd/image-001.png>)

**option 클릭 / XCode 우측**

필요한 내용들을 적어두면 사용할 때 마다 편리하게 내용을 볼 수 있습니다\.

#### ///주석

![](<../../assets/blog/docc-4069ead936fc45f9aa3fc9b9ff33a1bd/image-002.png>)

![](<../../assets/blog/docc-4069ead936fc45f9aa3fc9b9ff33a1bd/image-003.png>)

### 다른사람이 내 코드를 참고하거나 이해

다른사람이 해당 코드를 쓸 경우에 이해를 돕기 위해서 작성합니다\.

→ 최대한 자세히 작성해야합니다\.

## 문서 주석 작성하는 방법

```swift
/// comment
```

위의 내용처럼 나옵니다\.

```swift
/**
comment
*/
```

코드의 위에서 가장 가까운 문서 주석이 대상의 문서 주석이 됩니다\.

## 문서 주석 키워드

문서주석은 키워드를 통해 섹션을 나눌 수 있습니다\.

![](<../../assets/blog/docc-4069ead936fc45f9aa3fc9b9ff33a1bd/image-004.png>)

```swift
    /// Summary
    ///
    /// Discussion/Overview
    ///  
    /// - Parameters:
    ///    - [param]: [description]
    /// - Returns: [description]
    /// - Warning: [description]
    /// - Author: [name]
    /// - Version: [version number]
    /// - Note: [note message]
    /// - Tip: [tip message]
    /// - Todo: [todo message]
```

“대쉬\(\-\) 키워드” 형식으로 작성하면 위와 같이 키워드를 구분해줍니다\.

커스텀 키워드를 작성하고 싶다면

```swift
/// > Keyword: description
```

이렇게 하면 됩니다\.

문서 주석 단축키는 option \+ cmd \+ / 입니다\. 주석을 작성하고 싶은 대상에게 마우스를 놓고 단축키를 누르면 바로 윗부분에 문서 주석을 추가해줍니다\.

## 문서 주석 마크다운

Summary의 바로 밑부분인 Discussion부분에는 마크다운을 이용해 작성할 수 있습니다\.

````swift
/// **bold**
/// ~~cancle~~
/// _italic_
/// `keyword`
///
/// ```swift
/// code
/// ```
/// - dot
///
/// 1. one
/// 2. two
///
/// Table  | Description
/// --- | ---
/// `row1`| This is row1
/// `row2`| This is row2
///
/// \* escaping
````

![](<../../assets/blog/docc-4069ead936fc45f9aa3fc9b9ff33a1bd/image-005.png>)

## 참조

![](<../../assets/blog/docc-4069ead936fc45f9aa3fc9b9ff33a1bd/image-006.png>)

이외에도 \`\`를 작성한 후 문서주석이 있는 대상을 작성하면 해당 Document와 Linking이 됩니다\.

## Build Documentation

문서 주석의 장점은 그 자체가 개발 문서가 되는 것입니다\.

Product → Build Documentation을 통해 빌드를 해봅시다\.

![](<../../assets/blog/docc-4069ead936fc45f9aa3fc9b9ff33a1bd/image-007.png>)

애플 공식 문서처럼 만들 수 있습니다\.

## DocC\(Documentation Catalog\)

문서 주석을 통해 빌드를 하는 것이 아닌 새로운 페이지를 생성하여 문서를 작성할 수 있습니다\.

File → New → File

![](<../../assets/blog/docc-4069ead936fc45f9aa3fc9b9ff33a1bd/image-008.png>)

Documentation Catalog를 생성하고 나면 

![](<../../assets/blog/docc-4069ead936fc45f9aa3fc9b9ff33a1bd/image-009.png>)

![](<../../assets/blog/docc-4069ead936fc45f9aa3fc9b9ff33a1bd/image-010.png>)

이런 폴더와 파일을 만나볼 수 있습니다\. 

내용을 채우고 빌드를 하면 됩니다\.

추가적으로

기본적인 형식의 마크다운 템플릿인 Article

형식없이 비어있는 마크다운 파일인  Empty

튜토리얼을 작성할 수 있는 마크다운 템플릿인 Tutorial

Class등에 문서 주석으로 달아놓았던 부분에 추가적인 문서를 작성할 수 있는 템플릿인 Extension이 있습니다\.

## 참고

<a class="notion-resource-card" href="https://dokit.tistory.com/47"><span class="notion-resource-label">링크</span><span>https://dokit.tistory.com/47</span></a>

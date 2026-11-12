---
schemaVersion: 2
title: "React Native TV 앱에서 react-native-tvos를 연결하는 방법"
description: "React Native로 TV 앱의 리모컨 입력과 포커스를 다루려면 react-native-tvos가 어떤 역할로 연결되는지 이해해야 한다. 일반 라이브러리를 추가하는 것과 React Native 구현을 TV용 fork로 대체하는 것은 다르다."
tags: ["React Native", "개발 도구"]
publishedAt: "2025-05-11T23:53:00.000Z"
updatedAt: "2026-11-12T04:02:00.000Z"
manuscriptPages: 4
---

React Native로 TV 앱의 리모컨 입력과 포커스를 다루려면 react\-native\-tvos가 어떤 역할로 연결되는지 이해해야 한다\. 일반 라이브러리를 추가하는 것과 React Native 구현을 TV용 fork로 대체하는 것은 다르다\.

### 두 패키지의 관계

react\-native\-tvos는 React Native를 fork해 TV 환경을 지원하는 구현이다\. 별도의 기능 라이브러리처럼 두 패키지를 나란히 추가하는 것만으로 기존 react\-native import가 TV용 구현으로 바뀌지는 않는다\.

### npm alias로 연결하기

```json
{
  "dependencies": {
    "react-native": "npm:react-native-tvos"
  }
}
```

위 예시는 react\-native 이름으로 TV용 구현을 해석하도록 연결하는 방식이다\. 사용할 버전은 프로젝트가 선택한 호환 조합으로 지정해야 하며, 예시에 구체 버전이 없다고 버전 검토를 생략하지 않는다\.

### 확인할 점

리모컨 이벤트·버튼 포커스·포커스 이동용 컴포넌트를 사용하려면 의존성 이름이 아니라 실제로 어떤 구현이 설치·참조되는지 확인한다\. 모바일 React Native와 TV용 fork를 별도 독립 패키지처럼 혼용하지 않는다\.

### 정리

react\-native\-tvos는 React Native를 보완하는 일반 기능 라이브러리와 역할이 다르다\. TV 앱에서는 react\-native import가 선택한 TV용 구현으로 연결되는지 확인하는 것이 출발점이다\.

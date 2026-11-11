---
schemaVersion: 2
title: "React Native에서 React Native TVOS로"
description: "package.json을 봤을 때, 현재는 다음과 같이 사용되고 있다."
tags: ["React Native", "개발 도구"]
publishedAt: "2025-05-11T23:53:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 3
---

package\.json을 봤을 때, 현재는 다음과 같이 사용되고 있다\.

```javascript
"react-native": "0.78.0",
"react-native-tvos": "^0.77.0-0",
```

권장

```javascript
"react-native": "npm:react-native-tvos",
```

Remote controller와, 이로 인한 Button Focusing을 할 수 있는 useTvEventHandler, TvEventHendler, TVFocusGuideView과 같은 컴포넌트를 사용하기 위해서는 react\-native가 아닌 react\-native를 fork해서 TV 버전으로 개발한 오픈소스 react\-native\-tvos를 사용해야 한다\.

즉 react\-native\-tvos는 라이브러리의 역할이 아닌 프레임 워크로서의 역할을 하게 된다\. 

위처럼 사용하게 되면 react\-native의 정식 버전을 사용하게 되고, react\-native\-tvos는 아무런 영향이 없다\. react\-native\-tvos는 독립적인 기능을 제공하지 않고 react\-native 자체를 대체해야 효과가 있기 떄문이다\.

> 💡 react\-native와 react\-native\-tvos의 차이점
> 
> react\-native : 모바일 기반의 프레임워크
> react\-native\-tvos : TV앱 기반의 프레임워크

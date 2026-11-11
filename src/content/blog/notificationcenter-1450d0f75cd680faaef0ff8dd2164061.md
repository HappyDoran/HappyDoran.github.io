---
schemaVersion: 2
title: "NotificationCenter"
description: "Notification?"
category: "미분류"
categorySlug: "uncategorized"
tags: ["Swift", "상태 관리"]
publishedAt: "2024-11-21T08:45:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 6
---

## Notification?

여기서의 Notification은 유저에게 무엇인가 알려주는 알림이 아니라, “앱 내에서 정보를 전하기 위해서 알림을 방송한다”는 역할을 가지고 있다\. 

이 Notification은 그냥 만들어져셔 우리가 원하는 곳으로 알아서 가주는 자율 주행 시스템이 아니다\. 아무래도 우리는 어디로 송신하고 싶은건지, 방송을 듣고 싶다면 어느 채널로 맞춰야 할지도 정해줘야 한다\.

> 💡 비유
> 
> 사용자가 어떠한 채널을 구독하면
> 
> 이제 채널에서 어떠한 행동을 하게 되면 
> 
> 사용자가 알 수 있다\.

이때 Notification을 전달하는 중심 역할을 NotificationCenter가 한다\.

## NotificationCenter

![](<../../assets/blog/notificationcenter-1450d0f75cd680faaef0ff8dd2164061/image-001.png>)

등록된 “Observers”에게 정보의 “Broadcast”를 가능하게 하는 “Notification Dispatch” 매커니즘

여기서 말하는 Dispatch는 어떤걸 전송하는 역할을 담고 있는 것을 의미한다\. 예를 들면 DispatchQueue는 스레드에 어떠한 작업을 해달라고 보낼 것들의 Queue이고, 웹에서의 Flux 패턴은 Dispatcher는 원하는 액션을 처리하기 위해 Reducer에게 그 액션을 보내는 역할을 한다\. 

그렇다면 왜 Dispatch를 사용하는 것일까? 하나의 Dispatcher를 사용하면 데이터의 흐름을 한 점을 지나게 할 수 있다는 장점이 있다\. 즉 우리가 직접 접근할 수 없는 시스템적인 기능을 이용하기 위해 관련 기능을 이미 구현해 하나의 Dispatcher를 이용하는 것이 안전하다\.

어떤 곳에서 이벤트가 일어났다\. 조건이 충족되었다는 점을 다른 View, 혹은 다른 Screen에 알리고 싶으면 Notification을 Broadcast 해야 한다\. 우리가 소식을 알려주면 앱 내부에서 그걸 방송해주는 역할을 한다\. 

방송만 한다고 되는건 아니다\. 라디오도 전파는 쏘지만 의미가 있으려면 그 주파수를 잡는 청자가 있어야 한다\. 이 NotificationCenter에서 뿌려주는 정보도 Observer, 관찰자가 있어야한다\. 또한 주파수를 맞추는 것처럼 어떤 정보에 대해 관찰할 것인지도 정해야 한다\. 

이렇게 Notification의 전달은, 알림을 만들어내는 Publisher, 이걸 전달하는 Dispatcher역할의 NotificationCenter, 그 알림을 관찰하는 Observer\(Subscriber\)의 관계를 통해 진행된다\.

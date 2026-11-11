---
schemaVersion: 2
title: "앱에서의 Auth 플로우?"
description: "어디에 쓰는거에요? 어떠한 행위를 관찰하고 구독하려고 쓰는거에요?(이 앱에서)"
tags: ["SwiftUI", "네트워크", "상태 관리"]
publishedAt: "2024-11-21T15:29:00.000Z"
updatedAt: "2026-11-10T15:30:00.000Z"
manuscriptPages: 11
---

## 앱 빌드 시작

- Enum으로 3개의 케이스, \(Launch, Signin, EventInfo\) 를 만들어서 처음 Launch로 시작\.
- Launch에서 refreshToken을 서버에 보내면 에러를 던져주거나, 새로운 access Token을 주거나
- 에러면 애플로 로그인으로
- 새로운 accessToken이면 entryView\(시작점\)

### 애플로 로그인\(SignInScreen\)

- Apple 인증에 성공하면 Identity Token, Authorization Code, user를 받아옵니다\. 이걸 가지고 서버에 요청합니다\.
- 서버가 200을 반환하면:
   - 회원 정보가 존재: 서버로부터 DetailUser, email, Access Token, Refresh Token을 받습니다\.
   - Access Token, Refresh Token, email을 KeyChain에 저장합니다\.
   - NotificationCenter를 이용하여 DetailUser라는 채널 생성\(?\) 근데 이게 뭔 역할을 하는건지 감이 전혀 안옵니다\.
   - EntityView로 Navigation 이동합니다\.
- 서버가 201을 반환하면:
   - 회원 정보가 없음: DetailUser는 nil이고, Access Token, Refresh Token은 모르겠습니다\.  email도 nil입니다\.
   - SignUpScreen으로 Navigation 이동합니다\.

### 회원 가입\(SignUpScreen\)

- 서버가 201을 반환하면, 사용자는 Email과 Nickname을 입력합니다\.
- 이 정보를 사용하여 다시 서버에 요청을 보냅니다\.
- 서버가 성공적으로 회원 가입을 처리하면:
   - 받은 email, Access Token, Refresh Token을 Keychain에 저장합니다\.
   - NotificationCenter를 이용하여 DetailUser라는 채널 생성\(?\) 근데 이게 뭔 역할을 하는건지 감이 전혀 안옵니다\.
   - 완료되면 EntityView로 Navigation 이동합니다\.

## Access Token 갱신?

- API 요청을 시도했지만 Unauthorized 응답이 반환되면:
   - Access Token이 만료된 경우: Refresh Token을 서버에 보내어 새로운 Access Token을 요청합니다\.
   - 받은 Access Token을 Keychain에 저장합니다\.

## NotificationCenter를 쓰는 이유?

어디에 쓰는거에요? 어떠한 행위를 관찰하고 구독하려고 쓰는거에요?\(이 앱에서\)

## 정석적인 방법

액세스 토큰의 만료되는 시점을 계산해서 만료가 안됐으면 홈으로 보내고 만료가 되면 로그인으로 보냄

액세스 토큰이 만료가 되었을때 

tokenData = getAccessToken\(\)

if\(isTokenExpired\(tokenData: accessToken\)

- 리프레시 토큰이 만료 \- 로그인으로 보내면 돼
   if\(isTokenExpired\(tokenData: refreshToken\)
   
   → go loginScreen
- 리프레시 토큰이 만료 x
   else 
   
   - 이걸 가지고 다시 호출을 해서 액세스 토큰을 갱신
   - 갱신이 됐으니까 홈으로 보냄

→ 이중에 하나라도 에러가 나면 로그인으로 보내면 됨

### 여기서 필요한 함수

토큰 구조체 : 토큰 이름, 토큰 만료 기간

- [x] 키체인에서 액세스토큰 get 함수
- [x] 액세스토큰 만료 계산 함수
- [x] 키체인 리프레시 토큰 get 함수
- [x] 리프레시 토큰 만료 계산 함수
- [ ] 리프레시 토큰으로 새로운 엑세스 토큰, 리프레시 토큰 가져오는 함수\(reissue\)

→ 서버에서 accessToken, refreshToken을 받아낼 때 만료기간도 키체인에 같이 저장하는 방식

accessTokenData = getAccessToken\(\)

 refreshTokenData = getRefreshToken\(\)

if\(isTokenExpired\(tokenData: accessTokenData\)\{

if\(isTokenExpired\(tokenData: refreshTokenData\)\{

→ go loginScreen

\}

else \{

refreshAccessToken\(refreshToken: refreshToken\)

saveAccessToken\(accessToken\)

saveRefreshToken\(refreshToken\)

→ go home

\}

\}

else \{

refreshAccessToken\(refreshToken: refreshToken\)

saveAccessToken\(accessToken\)

saveRefreshToken\(refreshToken\)

→ go home

\}

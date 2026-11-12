---
schemaVersion: 2
title: "React Native 이미지 선택·크롭과 메타데이터 보존 설계"
description: "React Native에서 이미지 선택 UI를 직접 구성하려면 갤러리 접근, 선택 순서, 크롭 제스처, 메타데이터 보존을 함께 설계해야 한다. 시스템 picker의 안정성과 커스텀 UI의 자유도 사이에서 어떤 책임을 JavaScript와 Native Module에 둘지 비교한다."
tags: ["React Native", "아키텍처"]
publishedAt: "2025-08-25T01:10:00.000Z"
updatedAt: "2026-11-12T03:47:00.000Z"
manuscriptPages: 11
---

React Native에서 이미지 선택 UI를 직접 구성하려면 갤러리 접근, 선택 순서, 크롭 제스처, 메타데이터 보존을 함께 설계해야 한다\. 시스템 picker의 안정성과 커스텀 UI의 자유도 사이에서 어떤 책임을 JavaScript와 Native Module에 둘지 비교한다\.

### 배경과 제약

WebView의 input 선택을 네이티브 이미지 선택·크롭으로 확장하는 상황을 가정한다\. 필요한 기능은 커스텀 UI, EXIF·위치·촬영 시각 보존, 지정 비율 크롭, 크롭 위치·스케일 조절, 원본 갤러리 순서 유지다\.

9:16 비율·최대 4장·50장 단위 로드·최대 3배 확대는 구현을 설명하기 위한 예시 값이다\.

### 선택지 비교

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">선택지</th><th scope="col">검토한 장점</th><th scope="col">부담과 확인할 점</th></tr></thead>
<tbody><tr><td>camera-roll</td><td>UI 자유도, 페이지네이션, 선택 순서 제어</td><td>플랫폼별 asset URI·메타데이터 접근 차이, 원본 접근과 Native Module 관리</td></tr><tr><td>react-native-image-picker</td><td>시스템 picker 사용, base64 옵션과 원본 취급</td><td>커스텀 UI·다중 선택 제어 범위, EXIF 추가 접근</td></tr><tr><td>react-native-image-crop-picker</td><td>시스템 picker와 크롭·EXIF 처리</td><td>커스텀 UI 범위, 여러 이미지의 개별 크롭</td></tr></tbody>
</table>
</div>

라이브러리가 제공하는 기능만으로 메타데이터 보존을 보장하지 않는다\. 특히 iOS의 가상 asset 경로와 Android URI 처리는 같은 문자열 경로로 가정할 수 없다\.

base64는 바이너리를 문자열로 옮기는 비용이 있으므로 필요성을 따져야 한다\. 원본 접근과 메타데이터 처리는 별도 경계로 두는 편이 명확하다\.

### 구현 방식

커스텀 UI가 필수인 제약에서는 camera\-roll로 갤러리를 구성하고, 메타데이터 추출·크롭은 Native Module로 분리하는 방식을 선택할 수 있다\. 이 선택은 UI 구현 비용과 메타데이터 보존 비용을 비교한 결과이며 모든 picker에 대한 일괄적인 우열은 아니다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">도구</th><th scope="col">책임</th></tr></thead>
<tbody><tr><td>@react-native-camera-roll/camera-roll</td><td>갤러리 접근·이미지 로드</td></tr><tr><td>react-native-reanimated</td><td>이미지 이동·스케일 애니메이션</td></tr><tr><td>react-native-gesture-handler</td><td>드래그·핀치 제스처</td></tr><tr><td>react-native-safe-area-context</td><td>안전 영역</td></tr></tbody>
</table>
</div>

### 선택 상태와 크롭 영역

이미지별 PhotoAsset에 URI, 원본 너비·높이, 크롭 좌표, 스케일을 보관한다\. 선택 시 지정 비율의 중앙 크롭 영역과 이미지를 채우는 최소 스케일을 계산한다\.

선택한 목록과 화면에 표시 중인 메인 이미지를 구분한다\. 선택 개수 제한과 갤러리 페이지네이션도 별도 상태로 관리해야 한다\.

가로·세로 이미지 모두에서 크롭 영역을 중앙에 고정하고 이미지를 움직이는 방식으로 구현할 수 있다\. Gesture\.Simultaneous로 드래그·핀치를 함께 처리하며, 크롭 영역이 원본 밖으로 나가지 않게 이동값을 클램핑한다\.

최소 스케일은 크롭 영역이 비지 않는 값이다\. 축소 시 저항감을 주고 범위를 벗어난 값은 스프링으로 복원한다\. 최대 스케일도 제한해 과도한 확대를 막는다\.

### 화면 좌표에서 원본 크롭 좌표로

원본 크기, 표시 스케일, 이동량을 조합해 최종 크롭 영역의 x·y·너비·높이를 계산한다\. 이 값을 Native Module로 전달한다\.

표시 영역의 제스처 좌표와 실제 이미지 좌표를 그대로 혼용하지 않는다\. 사용자가 보는 크롭 영역과 Native Module이 잘라내는 영역이 같은지 확인해야 한다\.

### 플랫폼별 메타데이터 보존

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">플랫폼</th><th scope="col">처리 순서</th></tr></thead>
<tbody><tr><td>iOS</td><td>원본 메타데이터 추출 → CGImage 크롭 → 메타데이터 주입 → 갤러리 저장</td></tr><tr><td>Android</td><td>원본 EXIF 추출 → Bitmap 크롭 → 메타데이터 주입 → 갤러리 저장</td></tr></tbody>
</table>
</div>

보존 대상으로 ISO·노출시간·F값·초점거리, GPS 위치·고도·정확도, 촬영 시각, 제조사·모델명 등을 검토할 수 있다\. 수정 시각을 크롭 시점으로 갱신할지도 정책으로 정한다\.

크롭 성공과 메타데이터 보존 성공은 따로 확인해야 한다\. 플랫폼별 원본 asset 접근·크롭·저장 경계를 같은 테스트로 대체하지 않는다\.

### 정리

- UI 자유도와 메타데이터 보존 요구를 나눠 라이브러리를 비교한다\.
- 선택 상태·메인 이미지·개별 크롭 상태를 분리한다\.
- 최소 스케일과 이동 한계를 함께 제한한다\.
- 원본 좌표 변환과 플랫폼별 메타데이터 주입을 Native Module 경계에서 확인한다\.

### 관련 글

- 네이티브 이미지 업로드와 Web 오케스트레이션
- 모바일 이미지 업로드 클라이언트 구현 체크리스트

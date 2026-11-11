---
schemaVersion: 2
title: "React Native + Next.js Mono-repo 로컬 개발 환경 설정"
description: "React Native App과 Next.js Web workspace를 로컬에서 실행하기 위해 구성한 환경을 정리한다."
tags: ["React Native", "Next.js", "개발 도구"]
publishedAt: "2026-08-03T08:48:00.000Z"
updatedAt: "2026-11-11T14:17:00.000Z"
manuscriptPages: 22
---

React Native App과 Next\.js Web workspace를 로컬에서 실행하기 위해 구성한 환경을 정리한다\.

> 표기: 프로젝트 고유 접두사는 ` {PREFIX} `, workspace 패키지 이름은 ` <app 패키지> `로 바꿔 적었다\.

### 사전 준비

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">도구</th><th scope="col">용도</th></tr></thead>
<tbody><tr><td>mise</td><td>Node.js·Ruby·Java 버전 고정</td></tr><tr><td>pnpm</td><td>패키지 매니저 (버전은 <code>packageManager</code>가 정함)</td></tr><tr><td>Xcode + Command Line Tools</td><td>iOS 빌드</td></tr><tr><td>Android Studio + SDK + AVD</td><td>Android 빌드와 에뮬레이터</td></tr><tr><td>Watchman</td><td>Metro 파일 감시</td></tr><tr><td>private Git 저장소 읽기 권한</td><td>사내 StackFlow 패키지 설치</td></tr></tbody>
</table>
</div>

Ruby·CocoaPods·JDK를 사람마다 따로 설치하지 않는다\. 모두 저장소가 고정한 버전을 mise와 Bundler로 받는다\.

### 1\. 도구 버전

```toml
# .mise.toml
[tools]
node = "24.22.1"
ruby = "3.4.12"            # Gemfile.lock의 Bundler 4가 Ruby 3.2+를 요구
java = "temurin-17.0.21+9"
```

```bash
mise install
mise use -g pnpm           # 처음 한 번. 버전은 아무거나 괜찮다
node -v
```

pnpm은 저장소 안에서 실행될 때 루트 ` package.json `의 ` packageManager ` 버전으로 스스로 바꿔 실행한다\. 그래서 전역 pnpm 버전은 신경 쓰지 않아도 되고, ` .mise.toml `에 pnpm을 다시 적지 않는다\.

Xcode가 띄우는 Metro 창은 셸 hook을 거치지 않는다\. mise shim을 로그인 셸 PATH에 한 번 넣어 둔다\.

```bash
echo 'eval "$(mise activate zsh --shims)"' >> ~/.zprofile
```

Xcode build phase는 ` app/ios/.xcode.env `가 ` NODE_BINARY `를 mise shim으로 지정하므로 따로 설정할 것이 없다\.

### 2\. Workspace 의존성

저장소 루트에서 실행한다\.

```bash
pnpm install
```

- 루트 ` pnpm-lock.yaml `만 쓴다\. ` npm install `로 ` package-lock.json `이 생기면 구조 검사가 실패한다\.
- StackFlow 공통 로직은 private Git 저장소의 고정 commit으로 설치된다\. SSH key에 저장소 읽기 권한이 있어야 하고, PAT를 쓴다면 한 번만 다음을 설정한다\.
   ```bash
   git config --global url."<https://<PAT>@github.com/>".insteadOf "git@github.com:"
   ```
- ` pnpm install `은 루트 ` prepare ` script로 ` git config core.hooksPath .githooks `를 설정한다\. 이후 커밋마다 ` pre-commit `\(harness 테스트·구조 검사\)과 ` commit-msg `\(커밋 본문·테스트 동반 검사\)가 실행된다\.

### 3\. iOS 의존성

CocoaPods 버전은 ` app/Gemfile `이 고정한다\. 시스템 ` pod ` 대신 Bundler로 실행한다\.

```bash
cd app/ios
bundle install
bundle exec pod install
cd ../..
```

설치 전에 로컬 React Native 버전이 ` app/package.json `과 같은지 확인한다\.

```bash
cd app && node -p "require('react-native/package.json').version"
```

native 패키지나 ` Podfile.lock `이 바뀌면 다시 실행한다\. ` pod install `이 의도치 않게 ` project.pbxproj `를 재정렬하면 되돌린다\.

### 4\. 환경 파일

App과 Web에 환경별 파일을 만든다\.

```text
app/.env.local
app/.env.dev
app/.env.prd
web/.env.local
web/.env.dev
web/.env.prd
```

파일은 Git에 포함하지 않고 팀 secret manager 값으로 채운다\.

App 주요 key:

- ` APP_ENV `
- ` MOBILE_WEB_APP_URL ` \(local은 ` http://localhost:3001 `\)
- native 인증 SDK 설정

Web 주요 key:

- 실행 환경 구분 값
- 서버 측 API base URL
- Web 인증 client 설정

App 값은 ` react-native-config `로 빌드 시점에 바인딩된다\. 값을 바꾸면 Metro 재시작이 아니라 앱 재빌드가 필요하다\. secret, 계정 ID, private endpoint는 문서 예시에 적지 않는다\.

### 5\. Local Web

```bash
cd web
pnpm run local-dev
```

` 0.0.0.0:3001 `에 bind해 같은 네트워크의 실기기와 Android 에뮬레이터에서 접근할 수 있게 한다\. 3001이 아닌 포트로 띄우면 ` app/.env.local `의 ` MOBILE_WEB_APP_URL `도 맞추고 앱을 다시 빌드한다\.

### 6\. App Metro

```bash
cd app
pnpm run local-dev     # .env.local + react-native start --reset-cache
```

` react-native ` CLI는 PATH에 없다\. 항상 ` pnpm run <script> `로 실행하고, script는 ` scripts/run-with-envfile.mjs `가 env 파일을 읽어 실행한다\.

### 7\. iOS 실제 기기

```bash
cd app
pnpm run ios:local-dev
```

script가 Mac의 활성 LAN IPv4를 감지해 임시 env 파일의 ` MOBILE_WEB_APP_URL `에 넣고, 실행이 끝나면 임시 파일을 지운다\. Mac과 iPhone은 같은 네트워크에 있어야 한다\.

자동 감지가 틀리면 직접 지정한다\.

```bash
{PREFIX}_LOCAL_WEB_HOST=<mac-lan-ip> pnpm run ios:local-dev
```

무료 Apple Personal Team으로 실행할 때는 Sign in with Apple entitlement를 뺀 빌드를 쓴다\. 이 빌드에서는 Web의 Apple 로그인 버튼도 native capability를 받아 숨겨진다\.

```bash
pnpm run ios:personal:local-dev
pnpm run ios:personal:dev
```

### 8\. iOS simulator

```bash
cd app
pnpm run ios:simulator:local-dev    # 기본 iPhone 17 Pro
```

### 9\. Android

```bash
cd app
pnpm run android:local-dev               # 연결된 기기·에뮬레이터
pnpm run android:simulator:local-dev     # AVD 부팅 후 빌드·설치
pnpm run android:local-device:local-dev  # LAN 실기기
```

Android script는 ` --active-arch-only `로 연결된 기기의 아키텍처 하나만 빌드해 빌드 시간을 줄인다\.

특정 AVD를 쓰려면:

```bash
ANDROID_AVD_NAME=<avd-name> pnpm run android:simulator
```

에뮬레이터에서는 ` MOBILE_WEB_APP_URL `의 ` localhost `·` 127.0.0.1 `이 ` 10.0.2.2 `로 자동 변환된다\. pose camera 같은 native 카메라 흐름은 에뮬레이터 그래픽 스택\(gfxstream\)에서 크래시할 수 있어 실기기로 검증한다\.

### 10\. dev·prd 실행

```bash
cd web
pnpm run dev
pnpm run prd

cd ../app
pnpm run dev
pnpm run prd
pnpm run ios:dev
pnpm run ios:prd
pnpm run android:dev
pnpm run android:prd
```

자동 배포는 dev만 구현되어 있다\. prd 실행·빌드 명령이 있다고 production 배포가 구현된 것은 아니며, 독립 배포 전까지 prd는 dev Web/API를 바라본다\.

#### App 없이 브라우저에서 점검

개발 서버의 ` ?fakeNative=1 `은 가짜 native 성공 응답, ` fail `·` cancel `은 오류·취소 응답을 활성화한다\. ` ?fakeNative=0 `으로 해제하며 모드는 localStorage에 남는다\. 실제 WebView에는 설치하지 않고 운영 번들에서는 제외한다\. Google 로그인은 실제 idToken을 쓰므로 개발 origin을 OAuth client의 승인된 JavaScript 원본에 등록해야 한다\.

사진 분석은 가짜 촬영 payload를 만들지 않는다\. 일반 브라우저에서도 실제 파일 선택 → 포즈 검출 → 포인트 조정 → 직접 PUT 흐름을 쓴다\. HTTP LAN에서는 ` crypto.subtle `이 없어 완료를 막으며 HTTPS/[localhost](<http://localhost/>)가 필요하다\. [localhost](<http://localhost/>)라도 저장소의 PUT CORS 허용은 별도로 필요하다\. 일반 브라우저는 화면 이동을 ` animate: false `로 즉시 처리한다\.

### 11\. Storybook

```bash
pnpm run storybook
```

루트에서 design system 패키지의 Storybook을 띄운다\.

### 12\. 루트 검증

```bash
pnpm run lint
pnpm run structure:check
pnpm run test
pnpm run test:e2e
pnpm run typecheck
pnpm run build
pnpm --filter <app 패키지> run bundle:android:ci
```

E2E는 처음 한 번 Web workspace에서 ` pnpm run test:e2e:install `로 Chromium·WebKit을 설치한다\. E2E는 ` .next-e2e `에 따로 빌드해 3100 포트에 띄우므로 실행 중인 개발 서버와 충돌하지 않는다\.

### Troubleshooting

#### ` Repository not found ` \(pnpm install\)

private StackFlow 저장소 읽기 권한이 없다\. SSH key 권한을 확인하거나 위의 PAT ` insteadOf ` 설정을 한다\.

#### ` Could not find 'bundler' `

macOS 기본 Ruby를 쓰고 있다\. ` mise install ` 후 저장소 디렉터리에서 다시 ` bundle install `한다\.

#### CocoaPods 체크섬이 흔들림

시스템 ` pod `로 설치했다\. ` bundle exec pod install `로 다시 실행한다\.

#### iOS 링크 단계 ` jsi::...IRuntime ` undefined

로컬 ` node_modules `의 React Native가 낡아 Pods가 이전 RN의 podspec을 받았다\. 루트에서 ` pnpm install --frozen-lockfile ` 후 Pods를 다시 설치한다\.

#### React Native 업그레이드 후 ` module.modulemap not found `

` React-Core-prebuilt `가 lock 때문에 이전 버전에 남았다\.

```bash
cd app/ios
bundle exec pod update React-Core-prebuilt --no-repo-update
```

#### ` Ignored build scripts ` 경고

pnpm은 허용 목록에 없는 의존성의 install script를 실행하지 않는다\. script가 하는 일을 확인한 뒤 ` pnpm-workspace.yaml `의 ` onlyBuiltDependencies ` 또는 ` ignoredBuiltDependencies `에 올린다\.

#### 환경 파일 누락

` run-with-envfile.mjs `는 선택한 env 파일이 없으면 즉시 종료한다\. 명령을 실행한 workspace에 파일이 있는지 확인한다\.

#### 환경 값을 바꿨는데 반영되지 않음

App은 빌드 시점 바인딩이다\. Metro만 재시작하지 말고 앱을 다시 빌드한다\.

#### iOS 실제 기기

기기 신뢰, Developer Mode, Xcode 기기 등록, 같은 네트워크 여부를 확인한다\.

#### Watchman recrawl

저장소 루트에서 현재 경로를 다시 등록한다\.

```bash
watchman watch-del "$(pwd)"
watchman watch-project "$(pwd)"
```

### 구현 근거와 검토 범위

2026\-11\-11, FE commit ` 645a584 ` 기준으로 코드·설정과 관련 변경 이력을 대조했다\. 근거: ` web/package.json `, ` web/src/shared/bridge/lib/fake-native.ts `, ` web/src/features/pose-camera/README.md `\. 문서에 인용한 이전 검증 기록과 이번 검토를 구분하며, 이번 작업에서 앱·브라우저 런타임 테스트를 재실행하지 않았다\.

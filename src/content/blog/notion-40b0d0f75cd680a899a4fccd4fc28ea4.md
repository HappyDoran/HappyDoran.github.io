---
schemaVersion: 2
title: "모노레포의 런타임·의존성 버전 관리"
description: "React Native·Next.js 모노레포의 버전 관리는 런타임 숫자를 고정하는 것뿐 아니라 peer·lockfile·플랫폼 템플릿·외부 patch를 같은 조합으로 유지하는 작업이다. 도구와 라이브러리의 버전 원본을 나누고 업그레이드·보류 기준을 세우는 방법을 살펴본다."
tags: ["React Native", "Next.js", "개발 도구"]
publishedAt: "2026-11-01T03:52:00.000Z"
updatedAt: "2026-11-12T03:58:00.000Z"
manuscriptPages: 39
---

React Native·Next\.js 모노레포의 버전 관리는 런타임 숫자를 고정하는 것뿐 아니라 peer·lockfile·플랫폼 템플릿·외부 patch를 같은 조합으로 유지하는 작업이다\. 도구와 라이브러리의 버전 원본을 나누고 업그레이드·보류 기준을 세우는 방법을 살펴본다\.

아래 버전·경로·script는 구성 예시다\. 최신·지원 종료·취약점 현황을 나타내는 목록은 제외하고 실제 변경 때 확인할 계약과 실패 패턴을 중심으로 정리한다\.

### 버전을 결정하는 위치

```text
.mise.toml                 # Node · Ruby · Java
package.json               # packageManager (pnpm 버전), 루트 devDependency(turbo)
pnpm-workspace.yaml        # workspace 목록, catalog, install script 허용, patch 등록
pnpm-lock.yaml             # 실제 설치 버전 (유일한 lockfile)
patches/                   # pnpm patch로 만든 외부 패키지 수정
app/package.json           # React Native와 @react-native/*, 앱 전용 라이브러리
web/package.json           # Next.js, StackFlow, Web 전용 라이브러리
packages/*/package.json    # 공통 패키지 의존성
app/Gemfile, Gemfile.lock  # CocoaPods 1.17.0, Bundler 4.0.16, ruby ">= 3.2"(lock에 3.4.12 기록)
app/android/...            # Gradle wrapper, SDK·NDK·Kotlin 버전 (RN 업그레이드 때 함께 바뀜)
app/ios/Podfile(.lock)     # iOS 최소 버전, hermes·React-Core-prebuilt 버전
```

` app/Gemfile.lock `도 ` RUBY VERSION ruby 3.4.12 `를 기록한다\. ` .mise.toml `의 Ruby를 올리면 다음 ` bundle install `에서 lock의 이 줄도 바뀌므로 함께 커밋한다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">위치</th><th scope="col">결정하는 것</th><th scope="col">읽는 쪽</th></tr></thead>
<tbody><tr><td><code>.mise.toml</code></td><td>Node, Ruby, Java</td><td>로컬 셸, Xcode(<code>app/ios/.xcode.env</code>의 mise shim), CI(<code>jdx/mise-action</code>, Node·Java만)</td></tr><tr><td><code>packageManager</code></td><td>pnpm 버전</td><td>로컬 pnpm(자동 전환), CI <code>pnpm/action-setup</code></td></tr><tr><td><code>catalog</code></td><td>공통 라이브러리 버전</td><td>모든 workspace의 <code>catalog:</code> 참조</td></tr><tr><td>각 <code>package.json</code></td><td>해당 workspace 전용 라이브러리</td><td>pnpm</td></tr><tr><td><code>pnpm-lock.yaml</code></td><td>실제 설치된 정확한 버전</td><td><code>pnpm install --frozen-lockfile</code> (Web 배포는 <code>--filter example-web...</code>로 Web 관련만)</td></tr></tbody>
</table>
</div>

Prettier는 app만 devDependency로 선언하지만 설정 파일 ` .prettierrc `는 루트에 있습니다\.

CI의 세 workflow는 ` .github/actions/example-setup-toolchain ` composite action으로만 도구를 설치한다\. 이 action이 ` jdx/mise-action `으로 ` .mise.toml `의 Node·Java를, ` pnpm/action-setup `으로 ` packageManager `의 pnpm을 설치하고 pnpm store를 캐시한다\. Ruby는 iOS Pods 전용이라 CI에 설치하지 않습니다\.

도구 버전이 workflow마다 반복되면 로컬만 갱신되고 CI는 이전 버전으로 통과할 수 있다\. 공통 setup action이 설정 원본을 읽게 하고 workflow의 중복 버전 키를 검사한다\. 버전 변경은 원본과 관련 lock 변경을 함께 반영한다\.

---

### 도구 체인

#### 왜 mise인가

React Native 앱은 Node만으로 빌드되지 않습니다\. iOS는 Ruby\(CocoaPods\), Android는 Java\(Gradle\)가 필요한다\. 세 도구를 사람마다 따로 설치하면 다음 문제가 생깁니다\.

- macOS 기본 Ruby는 2\.6이라 Bundler 4\(Ruby 3\.2 이상 필요\)를 실행할 수 없습니다\. ` pod install `이 ` Could not find 'bundler' (4.0.16) `로 실패한다\.
- 시스템 ` pod `\(다른 CocoaPods 버전\)로 설치하면 ` Podfile.lock `의 체크섬이 흔들립니다\.
- 사람마다 JDK가 다르면 Gradle 결과가 CI와 달라집니다\.

mise는 세 도구를 한 파일로 고정하고, 저장소 디렉터리에 들어오면 해당 버전을 자동으로 쓴다\.

```toml
# 도구 버전의 단일 기준. CI도 .github/actions/example-setup-toolchain으로 이 파일을 읽는다(pnpm은 packageManager).
[tools]
node = "24.22.1"
# iOS Pods: Gemfile.lock은 Bundler 4라 Ruby 3.2+가 필요하다.
ruby = "3.4.12"
java = "temurin-17.0.21+9"
```

셸 hook을 거치지 않는 두 실행 경로도 같은 Node를 쓰게 맞췄습니다\.

- Xcode script phase: ` app/ios/.xcode.env `가 PATH와 ` NODE_BINARY `를 mise shim\(` ~/.local/share/mise/shims/node `\)으로 지정한다\. shim은 실행 위치에서 위로 올라가며 ` .mise.toml `을 찾으므로, ` app/ios `와 Pods 단계에서도 저장소 Node를 고릅니다\. 설치 경로 탐색 코드를 중복 유지하지 않는 방식이다\.
- Xcode가 띄우는 Metro 창: 로그인 셸의 ` ~/.zprofile `에 ` eval "$(mise activate zsh --shims)" `를 한 번 넣습니다\(README\)\. 개인 설치 경로를 patch에 하드코딩하기보다 실행 경계에서 같은 shim을 읽게 한다\.

#### pnpm 버전은 ` packageManager ` 한 곳

npm은 Node에 들어 있어서, Node 버전이 정해지면 npm 버전도 따라 정해졌습니다\. pnpm은 Node에 없으므로 버전을 따로 고정해야 한다\.

```json
{
  "packageManager": "pnpm@10.34.6"
}
```

packageManager 버전 적용을 pnpm의 버전 관리 기능이나 실행 도구로 일관되게 구성한다\. 로컬과 CI가 실제로 같은 버전을 사용하는지 확인하고 mise·packageManager·workflow에 서로 다른 pnpm 버전을 반복하지 않는다\.

#### 왜 npm에서 pnpm으로 옮겼나

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">문제</th><th scope="col">npm</th><th scope="col">pnpm</th></tr></thead>
<tbody><tr><td>install script 관리</td><td>Node 24의 npm 11이 기본으로 차단해, 루트 <code>allowScripts</code>로 관리해야 했습니다</td><td><code>onlyBuiltDependencies</code> 한 목록으로 관리합니다</td></tr><tr><td>선언하지 않은 패키지 사용</td><td>hoisting 덕분에 우연히 동작하다가, 설치 순서가 바뀌면 깨졌습니다(RN 0.88 업그레이드 때 <code>@react-native/metro-config</code> 위치 문제)</td><td>isolated 설치라 선언하지 않은 import는 바로 실패합니다</td></tr><tr><td>공통 버전 맞추기</td><td>&quot;React를 모든 workspace에서 먼저 맞춘다&quot; 같은 수동 절차가 필요했습니다</td><td><code>catalog</code> 한 곳에서 결정합니다</td></tr><tr><td>외부 패키지 수정</td><td><code>patch-package</code>와 <code>postinstall</code></td><td>기본 기능인 <code>patchedDependencies</code></td></tr></tbody>
</table>
</div>

#### 왜 isolated 방식인가

pnpm의 ` node-linker=hoisted `를 쓰면 기존 npm과 같은 평탄 구조라 React Native 경로를 손댈 필요가 없습니다\. 대신 &quot;선언하지 않은 패키지가 우연히 동작하는&quot; 문제가 그대로 남습니다\.

isolated로 바꾸면서 실제로 드러난 문제는 다음과 같습니다\.

- ` packages/design-system `이 ` @types/react `, ` @types/react-dom `, ` react-native-svg `, ` @storybook/react `를 선언 없이 쓰고 있었습니다\.
- ` packages/design-system `의 postcss·tailwind 설정이 ` tailwindcss `·` tailwindcss-animate `·` autoprefixer `·` postcss `를 선언 없이 pnpm의 숨김 hoist에 기대고 있었습니다\. web과 같은 버전을 catalog로 옮겨 두 workspace가 참조한다\.
- Android Gradle이 ` @react-native/gradle-plugin `과 ` @react-native/codegen `을 경로로 직접 읽고 있었습니다\. 두 패키지를 app devDependency로 선언했다\.
- RN 관련 경로\(Gradle, Xcode ` REACT_NATIVE_PATH `, react\-native\-config scheme 스크립트, Metro\)를 모두 ` app/node_modules ` 기준으로 바꿨습니다\.
- Metro의 ` nodeModulesPaths `는 남겨 둡니다\. RN Babel이 workspace 패키지 파일에 넣는 ` @babel/runtime `을 app 의존성에서 찾아야 하기 때문이다\.

---

### catalog로 공통 버전 맞추기

두 개 이상의 workspace가 같은 패키지를 쓰면 ` catalog `에 적습니다\.

```yaml
# pnpm-workspace.yaml
catalog:
  react: 19.3.1
  react-dom: 19.3.1
  react-test-renderer: 19.3.1
  '@types/react': ^19.3.0
  '@types/react-dom': ^19.3.0
  zod: 4.6.7
  typescript: ^6.0.3
  jest: ^30.5.2
  '@types/jest': ^30.0.0
  zustand: ^5.0.16
  react-native-svg: ^15.16.0
  eslint: ^9.39.5
  tailwindcss: ^3.4.19
  tailwindcss-animate: ^1.0.7
  autoprefixer: ^10.6.2
  postcss: ^8.5.32
```

```json
// app/package.json, web/package.json, packages/*/package.json
{
  "dependencies": {
    "react": "catalog:",
    "zod": "catalog:"
  }
}
```

#### catalog에 넣는 기준

- 둘 이상의 workspace가 쓰는 패키지를 넣습니다\.
- 버전이 달라지면 계약이 깨지는 패키지\(React 렌더러, Zod schema, TypeScript\)를 넣습니다\.
- 정확한 버전이 필요하면 범위\(` ^ `\) 없이 적습니다\. React와 Zod는 정확한 버전으로 고정한다\.
- 예외: ` react-test-renderer `는 app만 쓰지만 React와 같은 버전이어야 해서 React 옆에 둡니다\.

한 workspace만 쓰는 패키지는 해당 ` package.json `에 직접 적습니다\. 예를 들어 ` next `는 web만 쓰므로 catalog에 넣지 않습니다\.

---

### install script 허용 목록

pnpm 10은 의존성의 ` postinstall ` 같은 script를 기본으로 실행하지 않습니다\. 필요한 패키지만 허용한다\.

```yaml
onlyBuiltDependencies:
  - '@example/navigation-core@git+ssh://git@example.com/example/navigation-core.git#<commit>'
  - esbuild
  - fsevents
  - unrs-resolver
  - workerd

ignoredBuiltDependencies:
  - '@parcel/watcher'   # jest-haste-map 하위. prebuilt 바이너리를 쓴다
  - dooboolab-welcome   # 환영 메시지만 출력한다
```

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">패키지</th><th scope="col">허용 이유</th></tr></thead>
<tbody><tr><td><code>@example/navigation-core</code></td><td>Git 의존성이라 설치할 때 <code>prepack</code> build가 필요한다. commit을 바꾸면 이 항목도 함께 바꿉니다(<code>structure:check</code>가 두 SHA가 같은지 검사)</td></tr><tr><td><code>esbuild</code>, <code>workerd</code></td><td>플랫폼별 바이너리를 내려받습니다(esbuild: OpenNext·wrangler·Storybook/Vite, workerd: wrangler)</td></tr><tr><td><code>fsevents</code>, <code>unrs-resolver</code></td><td>네이티브 모듈을 설치합니다</td></tr></tbody>
</table>
</div>

새 패키지를 설치했을 때 ` Ignored build scripts `가 나오면, script가 하는 일을 확인한 뒤 허용하거나 ` ignoredBuiltDependencies `에 올립니다\.

---

### 외부 패키지 patch

```yaml
patchedDependencies:
  react-native-webview@13.17.0: patches/react-native-webview@13.17.0.patch
```

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">patch</th><th scope="col">이유</th></tr></thead>
<tbody><tr><td><code>react-native-webview@13.17.0</code></td><td>화면 최대 주사율이 60Hz를 넘을 때만 WKWebView의 60fps 상한을 꺼서 ProMotion 기기에서 120Hz로 그립니다. 60Hz 기기는 이 설정을 끄면 30fps로 떨어져 제외합니다(WebKit 비공개 API <code>_features</code>·<code>_setEnabled:forFeature:</code>). StackFlow 전환 애니메이션에 필요해 유지한다. 비공개 API 의존에 따른 배포 적합성과 제거 조건도 함께 검토합니다</td></tr></tbody>
</table>
</div>

Metro 창의 Node 탐색을 별도 patch로 해결하기 전에 Xcode와 로그인 셸의 도구 경로를 맞출 수 있는지 확인한다\.

patch는 정확한 버전에 묶이다\. 그래서 ` react-native-webview `는 ` ^ ` 없이 ` 13.17.0 `으로 고정한다\. 대상 버전을 올리려면 ` pnpm patch <pkg>@<새 버전> `으로 patch를 다시 만들어야 한다\.

---

### 호환 조합을 검토하는 기준

최신 버전 목록보다 함께 동작해야 하는 경계와 보류 이유를 기록한다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">대상</th><th scope="col">확인할 계약·비용</th></tr></thead>
<tbody><tr><td>React·React Native</td><td>RN이 요구하는 React peer, codegen·Gradle plugin·CLI·플랫폼 템플릿</td></tr><tr><td>TypeScript·ESLint</td><td>typescript-eslint 지원 범위, RN·Next ESLint config와 plugin peer</td></tr><tr><td>StackFlow</td><td>Core·renderer·React·UI plugin의 peer. 같은 major·patch 안에서도 확인</td></tr><tr><td>react-native-webview</td><td>정확 버전에 묶인 patch 재작성과 실기기 회귀</td></tr><tr><td>Playwright</td><td>새 Chromium·WebKit에서 발생한 timeout과 기존 병렬 부하 문제 구분</td></tr><tr><td>Tailwind</td><td>최소 지원 WebView와 설정 방식 변경</td></tr><tr><td>Babel·소셜 SDK</td><td>RN preset 호환성과 네이티브 로그인 실기기 검증</td></tr><tr><td>Storybook·Vite</td><td>보안 patch와 major 설정 이전 비용 구분</td></tr><tr><td>@types/node</td><td>실행 Node와의 일치</td></tr></tbody>
</table>
</div>

예를 들어 테스트 timeout이 새 브라우저에서 발생해도 구버전의 병렬 실행에서 같은 문제가 재현되면 도구 버전만 원인으로 단정하지 않는다\. 전환 대기 로직을 고친 뒤 새 버전을 다시 검증한다\.

#### 보안 patch와 overrides

전이 의존성의 취약점을 조사할 때 같은 major 안의 patch로 해결되는 경로와 major 강제가 필요한 경로를 나눈다\. lockfile 갱신으로 해결되는 경우 불필요한 override를 추가하지 않는다\.

상위 패키지가 아직 수정하지 않았다면 overrides를 검토할 수 있지만, 범위를 넘는 major 강제는 상위 도구를 깨뜨릴 수 있다\. 상위 의존성이 해결하면 임시 override를 제거한다\. audit의 등급·개수는 고정 사실로 문서에 남기기보다 검증 시점 결과로 확인한다\.

#### 업그레이드를 되돌리는 기준

지원 종료·보안 patch·필요 기능·peer 요구를 변경 이유로 삼는다\. 새 버전을 맞추기 위해 생긴 우회 코드·install script 관리·네이티브 patch 부담이 이득보다 크다면 보류 이유를 기록한다\.

검증 도구가 새 문법을 처리하지 못할 때는 번들 우회와 정식 변환 plugin의 책임을 비교한다\. 예를 들어 namespace export 변환이 필요하면 Babel preset과 명시적인 plugin의 역할을 확인한다\.

---

### 버전을 올릴 때

1. 올리는 이유를 먼저 정한다\. 보안 패치, 지원 종료, 필요한 기능, 다른 패키지의 요구 중 하나여야 한다\.
1. ` pnpm outdated -r `로 대상과 최신 버전을 확인한다\.
1. 새 버전의 ` peerDependencies `와 ` engines `를 확인한다\. 특히 React, React Native, TypeScript, ESLint, StackFlow kit의 peer를 봅니다\.
1. 공통 패키지는 ` catalog `, 전용 패키지는 해당 ` package.json `을 수정한다\.
1. 루트에서 ` pnpm install `을 실행하고 ` pnpm-lock.yaml ` 변경을 확인한다\.
1. patch 대상 버전이 바뀌었다면 ` pnpm patch `로 patch를 다시 만듭니다\.
1. 아래 검증 명령을 실행한다\.
1. 올리지 않기로 한 버전이 있으면 이 문서의 &quot;올리지 않은 버전과 이유&quot; 표에 남깁니다\.

#### React Native를 올릴 때

- ` react-native `와 모든 ` @react-native/* `\(codegen, gradle\-plugin 포함\)를 같은 버전으로 함께 바꿉니다\.
- ` @react-native-community/cli `·` cli-platform-android `·` cli-platform-ios `도 새 RN 템플릿이 요구하는 버전으로 함께 맞춥니다\.
- Android Gradle·SDK·Kotlin, iOS 최소 버전 등 템플릿 변경은 Upgrade Helper diff를 따라 반영한다\.
- React는 catalog가 모든 workspace에 같은 버전으로 주므로 catalog만 고칩니다\.
- iOS: ` bundle exec pod install ` 뒤에 ` React-Core-prebuilt `가 이전 버전으로 남으면 ` pod update React-Core-prebuilt --no-repo-update `로 맞춥니다\.
- ` pod install `이 ` project.pbxproj `를 재정렬하면, 의도한 변경이 아닌 한 되돌립니다\.

#### 새 라이브러리를 추가할 때

```bash
pnpm --filter example-web add <pkg>
pnpm --filter example-mobile add -D <pkg>
```

- 두 번째 workspace에서도 쓰게 되면 catalog로 옮깁니다\.
- ` Ignored build scripts `가 나오면 script를 확인하고 허용 여부를 정한다\.

---

### 잘못 사용하기 쉬운 방식

#### npm·npx·yarn 사용

```bash
# 지양
npm install
npx wrangler deploy
```

```bash
# 권장
pnpm install
pnpm exec wrangler deploy
```

` package-lock.json `이 생기면 ` structure:check `가 실패한다\. frontmatter가 있는 문서와 feature README에 npm·npx·yarn 명령을 적어도 repository harness가 실패합니다\(` pnpx `는 이 검사에 걸리지 않습니다\)\. 두 검사는 커밋할 때 ` pre-commit ` hook에서도 실행됩니다\.

#### pnpm 버전을 여러 곳에 적기

```toml
# 지양: .mise.toml에 pnpm 추가
[tools]
pnpm = "10.34.6"
```

```bash
# 지양
npm i -g pnpm
corepack enable
```

```bash
# 권장 (처음 한 번, 버전은 packageManager가 정한다)
mise use -g pnpm
```

전역 pnpm의 버전은 상관없습니다\. 저장소 안에서는 pnpm이 ` packageManager ` 버전으로 바꿔 실행한다\. ` .mise.toml `에 pnpm을 다시 적으면 버전 기준이 두 곳이 됩니다\.

#### workflow에 도구 버전 적기

```yaml
# 지양
- uses: actions/setup-node@v4
  with:
    node-version: 24.22.1
```

```yaml
# 권장
- uses: ./.github/actions/example-setup-toolchain
```

workflow에 setup action이나 버전 키를 적으면 repository harness가 실패한다\.

#### workspace마다 다른 공통 버전

```json
// 지양: app과 web에 각각 적기
"react": "19.3.1"
```

```json
// 권장
"react": "catalog:"
```

#### 선언하지 않은 패키지 import

isolated 설치에서는 다른 패키지가 설치한 의존성을 import하면 typecheck나 bundle 단계에서 실패한다\. import하는 패키지는 해당 workspace의 ` package.json `에 선언한다\.

#### 루트 node\_modules 경로 하드코딩

```groovy
// 지양
includeBuild('../../node_modules/@react-native/gradle-plugin')
```

```groovy
// 권장: app/node_modules 기준
includeBuild('../node_modules/@react-native/gradle-plugin')
```

---

### 검증 명령

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run structure:check
pnpm run test:e2e
pnpm --filter example-mobile run bundle:android:ci
```

네이티브 버전을 바꿨다면 추가로 확인한다\.

```bash
cd app/android && ./gradlew :app:testDebugUnitTest
cd app/ios && bundle exec pod install   # 이후 Xcode 시뮬레이터 빌드
```

Storybook 관련 버전을 바꿨다면 확인한다\.

```bash
pnpm --filter @example/design-system run build-storybook
```

보안 취약점과 새 버전은 다음 명령으로 확인한다\.

```bash
pnpm audit
pnpm outdated -r
```

### 정리

- 도구 버전·공통 라이브러리·workspace 전용 버전의 원본을 구분한다\.
- isolated 설치에서 직접 선언과 플랫폼 경로를 확인한다\.
- install script·고정 revision·patch를 함께 관리한다\.
- 최신화보다 호환 조합과 검증된 변경 이유를 우선한다\.

### 관련 글

- pnpm 모노레포의 workspace와 축소형 FSD 구현
- React Native·Next\.js 모노레포의 로컬 개발 환경
- 모노레포의 AI Agent 문서·검증 체계 설계

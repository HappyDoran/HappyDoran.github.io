---
schemaVersion: 2
title: "React Native + Next.js Mono-repo 버전 관리"
description: "이 문서에서 가장 중요한 규칙은 버전 숫자를 여러 곳에 흩어 적지 않는 것입니다. 도구 버전은 .mise.toml·packageManager, 라이브러리 버전은 catalog와 각 package.json 한 곳에서만 결정합니다."
tags: ["React Native", "Next.js", "개발 도구"]
publishedAt: "2026-11-01T03:52:00.000Z"
updatedAt: "2026-11-11T14:17:00.000Z"
manuscriptPages: 66
---

> 표기: 패키지 scope는 ` @scope `, workspace 패키지 이름은 ` <app 패키지> `·` <web 패키지> `, Git 조직은 ` <org> `로 바꿔 적었습니다\.

### 결론

- Node\.js는 mise가 ` .mise.toml `로 고정합니다\. 현재 Node 24 LTS\(24\.22\.1\)입니다\.
- pnpm 버전은 루트 ` package.json `의 ` packageManager `\(pnpm 10\.34\.6\) 한 곳이 정합니다\. 어느 버전의 pnpm을 설치해도 실행할 때 이 버전으로 바꿔 실행합니다\.
- Ruby\(iOS CocoaPods\)와 Java\(Android Gradle\)도 ` .mise.toml `이 고정합니다\. 모든 팀원이 같은 도구 버전을 씁니다\.
- CI도 ` .github/actions/setup-toolchain `으로 같은 두 곳\(` .mise.toml `, ` packageManager `\)을 읽습니다\. workflow에는 도구 버전을 적지 않습니다\.
- 둘 이상의 workspace가 함께 쓰는 라이브러리는 ` pnpm-workspace.yaml `의 ` catalog `에 한 번만 적고, 각 ` package.json `은 ` catalog: `로 참조합니다\.
- 의존성은 pnpm 기본 isolated 방식으로 설치합니다\. 각 workspace는 import하는 패키지를 자기 ` package.json `에 직접 선언합니다\.
- 의존성의 install script는 ` onlyBuiltDependencies `에 올린 패키지만 실행합니다\.
- 외부 패키지를 수정할 때는 ` pnpm patch `로 루트 ` patches/ `에 두고 ` patchedDependencies `에 등록합니다\.
- 버전을 올릴 때는 &quot;최신&quot;보다 &quot;함께 동작하는 조합&quot;을 우선합니다\. 올리지 않은 버전에는 이유를 남깁니다\.

이 문서에서 가장 중요한 규칙은 <strong>버전 숫자를 여러 곳에 흩어 적지 않는 것</strong>입니다\. 도구 버전은 ` .mise.toml `·` packageManager `, 라이브러리 버전은 ` catalog `와 각 ` package.json ` 한 곳에서만 결정합니다\.

---

### 문서 목적

이 프로젝트는 React Native WebView shell\(` app `\), Next\.js 콘텐츠\(` web `\), 공통 패키지\(` packages/* `\)가 하나의 저장소에 있습니다\. 버전 관리 기준이 없으면 다음 문제가 반복됩니다\.

- 같은 React·Zod를 workspace마다 다른 버전으로 설치해 schema 계약이나 렌더러가 어긋납니다\.
- 팀원마다 Node·패키지 매니저 버전이 달라 lockfile이 흔들립니다\.
- 다른 패키지를 통해 우연히 설치된 패키지에 기대다가, 설치 순서가 바뀌면 빌드가 깨집니다\.
- 의존성의 install script가 검토 없이 실행됩니다\.
- &quot;최신으로 올리기&quot;가 목적이 되어 우회 코드가 늘고, 바로 되돌리는 일이 생깁니다\.

그래서 버전을 결정하는 위치를 정하고, 올리는 기준과 올리지 않는 기준을 함께 기록합니다\.

---

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

` app/Gemfile.lock `도 ` RUBY VERSION ruby 3.4.12 `를 기록합니다\. ` .mise.toml `의 Ruby를 올리면 다음 ` bundle install `에서 lock의 이 줄도 바뀌므로 함께 커밋합니다\.

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">위치</th><th scope="col">결정하는 것</th><th scope="col">읽는 쪽</th></tr></thead>
<tbody><tr><td><code>.mise.toml</code></td><td>Node, Ruby, Java</td><td>로컬 셸, Xcode(<code>app/ios/.xcode.env</code>의 mise shim), CI(<code>jdx/mise-action</code>, Node·Java만)</td></tr><tr><td><code>packageManager</code></td><td>pnpm 버전</td><td>로컬 pnpm(자동 전환), CI <code>pnpm/action-setup</code></td></tr><tr><td><code>catalog</code></td><td>공통 라이브러리 버전</td><td>모든 workspace의 <code>catalog:</code> 참조</td></tr><tr><td>각 <code>package.json</code></td><td>해당 workspace 전용 라이브러리</td><td>pnpm</td></tr><tr><td><code>pnpm-lock.yaml</code></td><td>실제 설치된 정확한 버전</td><td><code>pnpm install --frozen-lockfile</code> (Web 배포는 <code>--filter &lt;web 패키지&gt;...</code>로 Web 관련만)</td></tr></tbody>
</table>
</div>

Prettier는 app만 devDependency로 선언하지만 설정 파일 ` .prettierrc `는 루트에 있습니다\.

CI의 세 workflow는 ` .github/actions/setup-toolchain ` composite action으로만 도구를 설치합니다\. 이 action이 ` jdx/mise-action `으로 ` .mise.toml `의 Node·Java를, ` pnpm/action-setup `으로 ` packageManager `의 pnpm을 설치하고 pnpm store를 캐시합니다\. Ruby는 iOS Pods 전용이라 CI에 설치하지 않습니다\.

예전에는 Node·JDK 버전이 ` .mise.toml `과 workflow 3곳에 따로 적혀 있어, 한쪽만 올리면 CI가 이전 버전으로 계속 통과했습니다\. 지금은 workflow에 ` actions/setup-node `·` setup-java `·` pnpm/action-setup `·` jdx/mise-action `이나 ` node-version `·` java-version `이 다시 들어오면 repository harness\(` findToolchainSourceErrors `\)가 실패합니다\. 버전을 바꿀 때는 ` .mise.toml ` 또는 ` packageManager `만 고칩니다\.

---

### 도구 체인

#### 왜 mise인가

React Native 앱은 Node만으로 빌드되지 않습니다\. iOS는 Ruby\(CocoaPods\), Android는 Java\(Gradle\)가 필요합니다\. 세 도구를 사람마다 따로 설치하면 다음 문제가 생깁니다\.

- macOS 기본 Ruby는 2\.6이라 Bundler 4\(Ruby 3\.2 이상 필요\)를 실행할 수 없습니다\. ` pod install `이 ` Could not find 'bundler' (4.0.16) `로 실패합니다\.
- 시스템 ` pod `\(다른 CocoaPods 버전\)로 설치하면 ` Podfile.lock `의 체크섬이 흔들립니다\.
- 사람마다 JDK가 다르면 Gradle 결과가 CI와 달라집니다\.

mise는 세 도구를 한 파일로 고정하고, 저장소 디렉터리에 들어오면 해당 버전을 자동으로 씁니다\.

```toml
# 도구 버전의 단일 기준. CI도 .github/actions/setup-toolchain으로 이 파일을 읽는다(pnpm은 packageManager).
[tools]
node = "24.22.1"
# iOS Pods: Gemfile.lock은 Bundler 4라 Ruby 3.2+가 필요하다.
ruby = "3.4.12"
java = "temurin-17.0.21+9"
```

셸 hook을 거치지 않는 두 실행 경로도 같은 Node를 쓰게 맞췄습니다\.

- Xcode script phase: ` app/ios/.xcode.env `가 PATH와 ` NODE_BINARY `를 mise shim\(` ~/.local/share/mise/shims/node `\)으로 지정합니다\. shim은 실행 위치에서 위로 올라가며 ` .mise.toml `을 찾으므로, ` app/ios `와 Pods 단계에서도 저장소 Node를 고릅니다\. 예전의 22줄짜리 설치 경로 탐색을 이 한 줄로 바꿨습니다\.
- Xcode가 띄우는 Metro 창: 로그인 셸의 ` ~/.zprofile `에 ` eval "$(mise activate zsh --shims)" `를 한 번 넣습니다\(README\)\. 예전에는 ` @react-native-community/cli-tools `를 patch해서 Node를 찾게 했지만, 개인 경로가 하드코딩되어 있고 ` .xcode.env `와 로직이 중복돼 지웠습니다\.

#### pnpm 버전은 ` packageManager ` 한 곳

npm은 Node에 들어 있어서, Node 버전이 정해지면 npm 버전도 따라 정해졌습니다\. pnpm은 Node에 없으므로 버전을 따로 고정해야 합니다\.

```json
{
  "packageManager": "pnpm@10.34.6"
}
```

방식은 다음 순서로 바뀌었습니다\.

1. pnpm 도입 직후: ` .mise.toml `과 ` packageManager ` 두 곳에 pnpm 버전을 적었습니다\. 한쪽만 올리면 로컬과 CI가 달라졌습니다\.
1. 다음 정리: ` .mise.toml `에서 pnpm을 빼고 corepack이 ` packageManager `를 읽게 했습니다\.
1. 최종: corepack도 걷어냈습니다\. pnpm 10은 ` manage-package-manager-versions ` 기본값으로 ` packageManager ` 버전으로 스스로 바꿔 실행하고, corepack은 Node 25부터 Node에 포함되지 않기 때문입니다\.

지금은 다음처럼 동작합니다\.

- 로컬: ` mise use -g pnpm `으로 아무 버전의 pnpm을 한 번 설치합니다\. 저장소 안에서 실행하면 pnpm이 ` packageManager ` 버전\(10\.34\.6\)으로 전환합니다\.
- CI: ` setup-toolchain ` 안의 ` pnpm/action-setup `이 같은 ` packageManager `를 읽습니다\.

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
- ` packages/design-system `의 postcss·tailwind 설정이 ` tailwindcss `·` tailwindcss-animate `·` autoprefixer `·` postcss `를 선언 없이 pnpm의 숨김 hoist에 기대고 있었습니다\. web과 같은 버전을 catalog로 옮겨 두 workspace가 참조합니다\.
- Android Gradle이 ` @react-native/gradle-plugin `과 ` @react-native/codegen `을 경로로 직접 읽고 있었습니다\. 두 패키지를 app devDependency로 선언했습니다\.
- RN 관련 경로\(Gradle, Xcode ` REACT_NATIVE_PATH `, react\-native\-config scheme 스크립트, Metro\)를 모두 ` app/node_modules ` 기준으로 바꿨습니다\.
- Metro의 ` nodeModulesPaths `는 남겨 둡니다\. RN Babel이 workspace 패키지 파일에 넣는 ` @babel/runtime `을 app 의존성에서 찾아야 하기 때문입니다\.

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
- 정확한 버전이 필요하면 범위\(` ^ `\) 없이 적습니다\. React와 Zod는 정확한 버전으로 고정합니다\.
- 예외: ` react-test-renderer `는 app만 쓰지만 React와 같은 버전이어야 해서 React 옆에 둡니다\.

한 workspace만 쓰는 패키지는 해당 ` package.json `에 직접 적습니다\. 예를 들어 ` next `는 web만 쓰므로 catalog에 넣지 않습니다\.

---

### install script 허용 목록

pnpm 10은 의존성의 ` postinstall ` 같은 script를 기본으로 실행하지 않습니다\. 필요한 패키지만 허용합니다\.

```yaml
onlyBuiltDependencies:
  - '@scope/stackflow-kit@git+ssh://git@github.com/<org>/stackflow-kit.git#<commit>'
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
<tbody><tr><td><code>@scope/stackflow-kit</code></td><td>Git 의존성이라 설치할 때 <code>prepack</code> build가 필요합니다. commit을 바꾸면 이 항목도 함께 바꿉니다(<code>structure:check</code>가 두 SHA가 같은지 검사)</td></tr><tr><td><code>esbuild</code>, <code>workerd</code></td><td>플랫폼별 바이너리를 내려받습니다(esbuild: OpenNext·wrangler·Storybook/Vite, workerd: wrangler)</td></tr><tr><td><code>fsevents</code>, <code>unrs-resolver</code></td><td>네이티브 모듈을 설치합니다</td></tr></tbody>
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
<tbody><tr><td><code>react-native-webview@13.17.0</code></td><td>화면 최대 주사율이 60Hz를 넘을 때만 WKWebView의 60fps 상한을 꺼서 ProMotion 기기에서 120Hz로 그립니다. 60Hz 기기는 이 설정을 끄면 30fps로 떨어져 제외합니다(WebKit 비공개 API <code>_features</code>·<code>_setEnabled:forFeature:</code>). StackFlow 전환 애니메이션에 필요해 유지합니다. App Store 심사(지침 2.5.1)에서 거절되면 이 블록을 지운다고 patch 주석에 적혀 있습니다</td></tr></tbody>
</table>
</div>

` @react-native-community/cli-tools@20.2.0 ` patch\(Metro 창의 Node 탐색\)는 도구 체인을 정리하면서 지웠습니다\. 이제 ` ~/.zprofile `의 mise shims가 같은 역할을 합니다\.

patch는 정확한 버전에 묶입니다\. 그래서 ` react-native-webview `는 ` ^ ` 없이 ` 13.17.0 `으로 고정합니다\. 대상 버전을 올리려면 ` pnpm patch <pkg>@<새 버전> `으로 patch를 다시 만들어야 합니다\.

---

### 현재 버전과 선택 이유

#### 핵심 프레임워크

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">패키지</th><th scope="col">버전</th><th scope="col">비고</th></tr></thead>
<tbody><tr><td>Node.js</td><td>24.22.1</td><td>LTS, 2028-04-30 지원 종료</td></tr><tr><td>pnpm</td><td>10.34.6</td><td><code>packageManager</code></td></tr><tr><td>React / React DOM</td><td>19.3.1</td><td>최신. RN 0.88이 <code>react ^19.3.0</code>을 요구합니다</td></tr><tr><td>React Native</td><td>0.88.1</td><td>최신 patch. <code>@react-native/*</code>도 전부 같은 버전</td></tr><tr><td>Next.js</td><td>16.4.3</td><td>최신 patch. <code>eslint-config-next</code>도 같은 버전</td></tr><tr><td>TypeScript</td><td>6.0.3</td><td>7은 보류(아래 참고)</td></tr><tr><td>Zod</td><td>4.6.7</td><td>보안 패치 포함</td></tr><tr><td>RN CLI (<code>@react-native-community/cli*</code>)</td><td>20.2.0</td><td>정확 고정, 최신</td></tr></tbody>
</table>
</div>

#### 네이티브 빌드 버전

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">항목</th><th scope="col">버전</th><th scope="col">위치</th></tr></thead>
<tbody><tr><td>Gradle</td><td>9.4.1</td><td><code>app/android/gradle/wrapper/gradle-wrapper.properties</code></td></tr><tr><td>compileSdk / targetSdk / minSdk</td><td>37 / 36 / 28 (Android 9)</td><td><code>app/android/build.gradle</code></td></tr><tr><td>buildTools / NDK / Kotlin</td><td>37.0.0 / 27.1.12297006 / 2.2.0</td><td><code>app/android/build.gradle</code></td></tr><tr><td>iOS 최소 버전</td><td>16.4</td><td><code>app/ios/Podfile</code></td></tr><tr><td>hermes-engine / React-Core-prebuilt</td><td>260318099.0.5 / 0.88.1</td><td><code>app/ios/Podfile.lock</code></td></tr><tr><td>CocoaPods / Bundler</td><td>1.17.0 / 4.0.16</td><td><code>app/Gemfile.lock</code></td></tr></tbody>
</table>
</div>

이 값들은 RN을 올릴 때 React Native Upgrade Helper의 템플릿 차이로 함께 바뀝니다\. 따로 올리지 않습니다\.

#### 테스트·도구

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">패키지</th><th scope="col">버전</th><th scope="col">비고</th></tr></thead>
<tbody><tr><td>Jest</td><td>30.5.2</td><td>app·web 통일. <code>jest-environment-jsdom</code> 30과 메이저를 맞췄습니다</td></tr><tr><td>ESLint</td><td>9.39.5</td><td>app·web 통일. app은 <code>@react-native/eslint-config/flat</code>을 씁니다</td></tr><tr><td>Prettier</td><td>3.9.10</td><td><code>trailingComma: &quot;es5&quot;</code>로 기존 스타일을 유지합니다</td></tr><tr><td>Storybook</td><td>8.6.19</td><td>보안 패치 포함</td></tr><tr><td>Vite (Storybook)</td><td>6.4.5</td><td>5.x 보안 취약점 해소</td></tr><tr><td>Playwright</td><td>1.62.1</td><td>1.64는 보류(아래 참고)</td></tr><tr><td>Turborepo</td><td>2.11.10</td><td></td></tr><tr><td><code>@hey-api/openapi-ts</code></td><td>0.99.0</td><td>보안 패치. <code>api:generate</code>가 config를 자동으로 찾게 고쳤습니다</td></tr></tbody>
</table>
</div>

#### 올리지 않은 버전과 이유

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">패키지</th><th scope="col">현재</th><th scope="col">최신</th><th scope="col">보류 이유</th></tr></thead>
<tbody><tr><td>TypeScript</td><td>6.0.3</td><td>7.0.2</td><td><code>typescript-eslint</code>가 <code>typescript &lt;6.1</code>만 지원합니다</td></tr><tr><td><code>@stackflow/*</code></td><td>1.x</td><td>2.x·3.x</td><td><code>@scope/stackflow-kit</code>의 peer가 <code>@stackflow/react ^1.12.0</code>입니다. patch 번호 안에서도 peer가 바뀌므로(<code>plugin-renderer-basic</code>은 1.1.14부터 core <code>^2</code>, 1.1.15부터 <code>^3</code>) 7개 패키지를 모두 <code>^</code> 없이 고정합니다. <code>@stackflow/core</code> 1.3.2는 1.x 안이라 올릴 수 있지만 필요가 없어 1.3.0에 둡니다</td></tr><tr><td><code>react-native-webview</code></td><td>13.17.0</td><td>14.0.1</td><td>호환 문제가 아니라, 13.17.0에 묶인 120Hz patch를 새 버전에 다시 만들어야 해서 보류합니다</td></tr><tr><td>Playwright</td><td>1.62.1</td><td>1.64.1</td><td>1.64.1(새 Chromium)에서 closet 사진 결과 전환 E2E가 timeout 났습니다. 같은 timeout이 1.62.1에서도 병렬 부하 때 재현돼 테스트의 전환 대기를 고쳤으므로, 다음에 1.64.1로 다시 시도합니다</td></tr><tr><td>Tailwind CSS</td><td>3.4.19</td><td>4.x</td><td>4는 Chrome 111 미만 WebView를 지원하지 않습니다. 최소 지원 Android 9 기기의 WebView 버전을 확인한 뒤 옮깁니다(설정 방식도 바뀌는 재작성, 3은 <code>v3-lts</code>로 유지)</td></tr><tr><td>ESLint</td><td>9.x</td><td>10.x</td><td><code>@react-native/eslint-config</code>(peer <code>^8 || ^9</code>, 최신판도 같음)와 <code>eslint-plugin-react</code>(<code>^9.7</code>까지)가 10을 지원하지 않습니다. <code>eslint-config-next</code>는 <code>&gt;=9</code>라 막지 않습니다</td></tr><tr><td>pnpm</td><td>10.34.6</td><td>12.x (10.x 최신 10.34.9)</td><td>메이저 변경은 설정·lock 형식 영향을 따로 검토해야 해서 보류합니다. 10.x patch는 필요할 때 <code>packageManager</code>만 올립니다</td></tr><tr><td>Babel</td><td>7.x</td><td>8.x</td><td>RN 0.88의 Babel preset과 플러그인이 7 기준입니다</td></tr><tr><td>kakao-login / naver-login</td><td>5.x / 4.x</td><td>6.x / 5.x</td><td>네이티브 SDK 메이저 변경이라 실기기 로그인 검증과 함께 따로 올립니다</td></tr><tr><td>Storybook / Vite</td><td>8.6 / 6.4</td><td>10 / 8</td><td>8.6 보안 패치로 충분하고, 메이저 이전은 설정 변경이 큽니다</td></tr><tr><td><code>@types/node</code></td><td>^24</td><td>26</td><td>실행 Node 24와 맞춥니다</td></tr></tbody>
</table>
</div>

#### 알려진 경고

- ` pnpm install `의 ` unmet peer eslint@^8.1.0 ` 경고는 RN 공식 ESLint 설정에 포함된 ` eslint-plugin-ft-flow `가 냅니다\. 이 플러그인의 Flow 규칙 두 개는 ESLint 9에서 동작하지 않아 ` app/eslint.config.mjs `에서 끕니다\. 앱에는 Flow 코드가 없습니다\.
- 상위 패키지가 아직 고치지 않은 취약 전이 의존성\(OpenNext 하위 ` glob `, hey\-api 하위 ` js-yaml `, Storybook 하위 ` uuid `\)은 ` pnpm-workspace.yaml `의 ` overrides `로 패치 버전에 맞춥니다\. 상위 패키지가 고치면 해당 줄을 지웁니다\.
- ` pnpm audit `에 남는 RN CLI 하위 ` deepmerge `\(low\)는 패치 버전이 없어 받아들입니다\.
- 2026\-10\-30에 advisory 3개\(joi·minimatch·glob\)가 새로 공개되었습니다\. joi를 해소한 뒤 ` pnpm audit `은 advisory 3개·취약 경로 8개\(moderate 7, low 1\)를 보고합니다\.
   - ` joi ` &lt;17\.13\.9 \(high\): RN CLI 하위\(` @react-native-community/cli-config `\)\. 상위 범위 ` ^17.2.1 ` 안에 패치가 있어 lock만 17\.13\.9로 갱신해 해소했습니다\.
   - ` minimatch ` &lt;11\.0\.1 \(moderate\): app ESLint 설정\(` @typescript-eslint `, ` eslint-plugin-react `\), ` babel-plugin-module-resolver `, Jest\(` babel-plugin-istanbul `\) 하위\. 3\.x·8\.x·9\.x·10\.x 경로가 섞여 있고 패치는 11 이상에만 있습니다\.
   - ` glob ` 9\.0\.0~14\.0\.1 \(moderate\): ` babel-plugin-module-resolver `, Jest reporter·` babel-plugin-istanbul ` 하위\. 패치는 14\.0\.2 이상에만 있고, 위 ` overrides `의 ` glob ^10.5.0 `도 이 범위에 들어가므로 처리할 때 함께 다시 정해야 합니다\.
   - minimatch·glob은 같은 메이저 안에 패치가 없어, override로 메이저를 강제하면 상위 패키지가 깨질 수 있습니다\.
- ` pnpm install `의 ` WARN deprecated eslint@9.39.5 `는 ESLint 9 지원 종료 공지입니다\. 10으로 못 가는 이유는 보류 표에 있습니다\.
- zod 4의 ESM\(` export * as `\)은 RN Babel preset이 변환하지 않아 app이 ` @babel/plugin-transform-export-namespace-from `을 씁니다\.

---

### 버전 변경 이력

<div class="notion-table-wrap">
<table>
<thead><tr><th scope="col">단계</th><th scope="col">변경</th><th scope="col">핵심 이유</th></tr></thead>
<tbody><tr><td>1</td><td>Next.js 15 → 16</td><td>지원 종료된 15의 배포 차단 해소</td></tr><tr><td>2</td><td>React Native 0.85 → 0.87.1, TypeScript 6</td><td>RN 지원 범위(최신 세 minor) 유지</td></tr><tr><td>3</td><td>Node 24, npm 11, RN 0.88, React 19.3, Zod 4.6</td><td>도구 체인 고정과 최신화</td></tr><tr><td>4</td><td>Node 22, npm 10, Zod 4.4.3으로 되돌림</td><td>npm 11의 <code>allowScripts</code> 관리 부담, Zod 4.6 타입 우회 코드</td></tr><tr><td>5</td><td>npm → pnpm(isolated), Node 24</td><td>패키지 매니저를 바꿔 npm 11 문제 없이 Node 24 사용</td></tr><tr><td>6</td><td>corepack, catalog, RN 0.88.1, Next 16.4.3, Zod 4.6.7, Jest 30·ESLint 9 통일</td><td>버전 기준을 한 곳으로 모으고 보안 취약점 해소</td></tr><tr><td>7</td><td>design-system의 tailwind·postcss 계열 선언, kit SHA와 install script 허용 일치 검사</td><td>isolated 설치에서 숨김 hoist 의존 제거, kit build 누락 방지</td></tr><tr><td>8</td><td>취약 전이 의존성 <code>overrides</code>, Metro zod 우회 → Babel 플러그인</td><td>audit high 해소, 번들 우회 코드 제거</td></tr><tr><td>9</td><td>corepack 제거, CI <code>setup-toolchain</code> action, cli-tools patch 제거</td><td>도구 버전을 <code>.mise.toml</code>·<code>packageManager</code> 두 곳으로 모으고 CI 버전 드리프트 차단</td></tr><tr><td>10</td><td>Xcode Node를 mise shim으로, <code>@parcel/watcher</code> build script 무시</td><td>설치 경로 하드코딩 제거, 설치 경고 정리</td></tr><tr><td>11</td><td><code>joi</code> 17.13.8 → 17.13.9 (lock만)</td><td>2026-10-30 공개 high advisory 해소</td></tr></tbody>
</table>
</div>

3단계에서 올렸다가 4단계에서 되돌린 일이 이 문서를 만든 이유입니다\. 올리는 이유가 &quot;최신이라서&quot;이면 우회 코드와 관리 부담이 따라옵니다\.

Zod는 그때 되돌렸지만 이번에 4\.6\.7로 다시 올렸습니다\. 4\.6\.6 미만에 high 등급 취약점\(큰 입력을 검증할 때 메모리 고갈\)이 있었기 때문입니다\. TypeScript 6 기준에서는 우회 코드가 필요 없었습니다\.

---

### 버전을 올릴 때

1. 올리는 이유를 먼저 정합니다\. 보안 패치, 지원 종료, 필요한 기능, 다른 패키지의 요구 중 하나여야 합니다\.
1. ` pnpm outdated -r `로 대상과 최신 버전을 확인합니다\.
1. 새 버전의 ` peerDependencies `와 ` engines `를 확인합니다\. 특히 React, React Native, TypeScript, ESLint, StackFlow kit의 peer를 봅니다\.
1. 공통 패키지는 ` catalog `, 전용 패키지는 해당 ` package.json `을 수정합니다\.
1. 루트에서 ` pnpm install `을 실행하고 ` pnpm-lock.yaml ` 변경을 확인합니다\.
1. patch 대상 버전이 바뀌었다면 ` pnpm patch `로 patch를 다시 만듭니다\.
1. 아래 검증 명령을 실행합니다\.
1. 올리지 않기로 한 버전이 있으면 이 문서의 &quot;올리지 않은 버전과 이유&quot; 표에 남깁니다\.

#### React Native를 올릴 때

- ` react-native `와 모든 ` @react-native/* `\(codegen, gradle\-plugin 포함\)를 같은 버전으로 함께 바꿉니다\.
- ` @react-native-community/cli `·` cli-platform-android `·` cli-platform-ios `도 새 RN 템플릿이 요구하는 버전으로 함께 맞춥니다\.
- Android Gradle·SDK·Kotlin, iOS 최소 버전 등 템플릿 변경은 Upgrade Helper diff를 따라 반영합니다\.
- React는 catalog가 모든 workspace에 같은 버전으로 주므로 catalog만 고칩니다\.
- iOS: ` bundle exec pod install ` 뒤에 ` React-Core-prebuilt `가 이전 버전으로 남으면 ` pod update React-Core-prebuilt --no-repo-update `로 맞춥니다\.
- ` pod install `이 ` project.pbxproj `를 재정렬하면, 의도한 변경이 아닌 한 되돌립니다\.

#### 새 라이브러리를 추가할 때

```bash
pnpm --filter <web 패키지> add <pkg>
pnpm --filter <app 패키지> add -D <pkg>
```

- 두 번째 workspace에서도 쓰게 되면 catalog로 옮깁니다\.
- ` Ignored build scripts `가 나오면 script를 확인하고 허용 여부를 정합니다\.

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

` package-lock.json `이 생기면 ` structure:check `가 실패합니다\. frontmatter가 있는 문서와 feature README에 npm·npx·yarn 명령을 적어도 repository harness가 실패합니다\(` pnpx `는 이 검사에 걸리지 않습니다\)\. 두 검사는 커밋할 때 ` pre-commit ` hook에서도 실행됩니다\.

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

전역 pnpm의 버전은 상관없습니다\. 저장소 안에서는 pnpm이 ` packageManager ` 버전으로 바꿔 실행합니다\. ` .mise.toml `에 pnpm을 다시 적으면 버전 기준이 두 곳이 됩니다\.

#### workflow에 도구 버전 적기

```yaml
# 지양
- uses: actions/setup-node@v4
  with:
    node-version: 24.22.1
```

```yaml
# 권장
- uses: ./.github/actions/setup-toolchain
```

workflow에 setup action이나 버전 키를 적으면 repository harness가 실패합니다\.

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

isolated 설치에서는 다른 패키지가 설치한 의존성을 import하면 typecheck나 bundle 단계에서 실패합니다\. import하는 패키지는 해당 workspace의 ` package.json `에 선언합니다\.

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
pnpm --filter <app 패키지> run bundle:android:ci
```

네이티브 버전을 바꿨다면 추가로 확인합니다\.

```bash
cd app/android && ./gradlew :app:testDebugUnitTest
cd app/ios && bundle exec pod install   # 이후 Xcode 시뮬레이터 빌드
```

Storybook 관련 버전을 바꿨다면 확인합니다\.

```bash
pnpm --filter @scope/design-system run build-storybook
```

보안 취약점과 새 버전은 다음 명령으로 확인합니다\.

```bash
pnpm audit
pnpm outdated -r
```

### 구현 근거와 검토 범위

2026\-11\-11, FE commit ` 645a584 ` 기준으로 코드·설정과 관련 변경 이력을 대조했다\. 근거: ` patches/react-native-webview@13.17.0.patch `, ` pnpm-lock.yaml `\. 문서에 인용한 이전 검증 기록과 이번 검토를 구분하며, 이번 작업에서 앱·브라우저 런타임 테스트를 재실행하지 않았다\.

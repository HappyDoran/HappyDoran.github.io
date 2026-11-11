---
schemaVersion: 2
title: "React Hooks 핵심 API 10개"
description: "1. useState"
category: "미분류"
categorySlug: "uncategorized"
tags: ["React", "상태 관리", "성능 최적화"]
publishedAt: "2026-03-02T15:00:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 14
---

### 1\. ` useState `

**&quot;리액트의 심장, 상태 관리의 기본&quot;**

- **핵심 원리**: 컴포넌트 내에서 변할 수 있는 값\(상태\)을 정의합니다\. 이 값이 변경되면 리액트는 자동으로 해당 컴포넌트를 다시 렌더링\(리렌더링\)하여 화면을 업데이트합니다\.
- **사용 시점**: 사용자 입력, 버튼 클릭 등에 따라 화면에 즉각적으로 반영되어야 하는 데이터를 다룰 때 사용합니다\.

```javascript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0); // [상태값, 상태변경함수]

  return (
    <div>
      <p>현재 카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>1 증가</button>
    </div>
  );
}
```

### 2\. ` useEffect `

**&quot;렌더링 이후의 사이드 이펙트\(부수 효과\) 처리&quot;**

- **핵심 원리**: 리액트가 화면 렌더링을 완전히 마친 &\#39;이후&\#39;에 실행되는 코드를 정의합니다\. 비동기 처리이기 때문에 화면 그리기를 방해하지 않습니다\.
- **사용 시점**: 서버에서 데이터를 가져오거나\(Fetch API\), 타이머를 설정하거나, 렌더링에 직접적인 영향을 미치지 않는 부수적인 작업들을 수행할 때 가장 적합합니다\.

```javascript
import { useState, useEffect } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 의존성 배열([])이 비어있으므로 처음 마운트될 때 한 번만 실행
    fetch('https://api.example.com/data')
      .then((res) => res.json())
      .then((data) => setData(data));
      
    return () => {
      // 컴포넌트 언마운트 시 클린업(정리) 함수 실행
    };
  }, []);

  return <div>{data ? data.title : '로딩 중...'}</div>;
}
```

### 3\. ` useRef `

**&quot;리렌더링 없는 상태 유지와 DOM 직접 접근&quot;**

- **핵심 원리**: 두 가지 주요 목적이 있습니다\. 첫째, DOM 노드에 직접 접근할 수 있는 수단을 제공합니다\. 둘째, 값이 변해도 **컴포넌트를 리렌더링 시키지 않고** 값을 기억합니다\.
- **사용 시점**: 특정 input 요소에 강제로 포커스를 주거나 요소의 크기를 가져올 때 사용합니다\. 또한 렌더링 사이클에 영향을 주지 않고 유지되어야 하는 타이머 ID나 이전 상태값을 저장할 때 유용합니다\.

```javascript
import { useRef } from 'react';

function TextInputFocus() {
  const inputRef = useRef(null);

  const focusInput = () => {
    // DOM 요소에 직접 접근하여 포커스 실행
    inputRef.current.focus();
  };

  return (
    <>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>입력창 포커스</button>
    </>
  );
}
```

### 4\. ` useLayoutEffect `

**&quot;렌더링 직전, 화면이 그려지기 전의 동기적 개입&quot;**

- **핵심 원리**: ` useEffect `와 비슷하지만 실행 시점이 다릅니다\. DOM 트리가 구성된 직후, 하지만 **브라우저가 화면에 Paint\(그리기\) 하기 직전**에 동기적으로 실행됩니다\.
- **사용 시점**: 영상의 예시처럼 &\#39;박스 1&\#39;의 크기를 기준으로 &\#39;박스 2&\#39;의 위치나 크기를 즉각적으로 계산해 반영해야 할 때 씁니다\. 무거운 작업을 넣으면 화면 출력이 지연되어 성능 저하가 발생할 수 있으므로, 눈에 띄는 UI 깜빡임을 방지할 때만 주의해서 사용해야 합니다\.

```javascript
import { useState, useLayoutEffect, useRef } from 'react';

function MeasureBox() {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    // 화면에 페인트되기 전에 크기를 측정하여 깜빡임을 방지합니다.
    if (boxRef.current) {
      setWidth(boxRef.current.getBoundingClientRect().width);
    }
  }, []);

  return (
    <div ref={boxRef} style={{ width: '50%' }}>
      내 너비는 {width}px 입니다.
    </div>
  );
}
```

### 5\. ` useReducer `

**&quot;복잡한 상태의 체계적인 관리&quot;**

- **핵심 원리**: ` useState `의 심화 버전입니다\. 여러 상태가 복잡하게 얽혀있을 때, 상태를 업데이트하는 로직\(Reducer\)을 컴포넌트 외부로 분리할 수 있는 명시적인 방법을 제공합니다\.
- **사용 시점**: 서로 연관된 여러 개의 상태를 관리하거나, 상태 업데이트 로직이 복잡할 때 사용합니다\. 이벤트를 직접 처리하는 대신 ` dispatch `를 통해 어떤 액션\(` type `\)을 할 것인지 명시하여 외부 함수를 호출하는 방식으로 구조를 깔끔하게 유지합니다\.

```javascript
import { useReducer } from 'react';

// 상태 업데이트 로직을 외부로 분리
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
    default: return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <>
      <p>카운트: {state.count}</p>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </>
  );
}
```

### 6\. ` useContext `

**&quot;Props 지옥\(Prop Drilling\) 탈출하기&quot;**

- **핵심 원리**: 상위 컴포넌트에서 정의한 상태를 하위, 그 하위로 끝없이 ` props `로 전달하는 것은 비효율적입니다\. Context를 사용하면 전역 공간에 값을 두고 어느 자식 컴포넌트에서든 다이렉트로 접근할 수 있습니다\.
- **사용 시점**: 다크/라이트 테마 설정, 현재 로그인한 사용자 정보, 다국어 설정 등 애플리케이션 전반에서 공유되어야 하는 데이터를 다룰 때 필수적입니다\. 부모에서 ` Provider `로 값을 감싸면 됩니다\.

```javascript
import { createContext, useContext } from 'react';

const UserContext = createContext();

function App() {
  return (
    // 하위의 모든 컴포넌트에 user 정보 제공
    <UserContext.Provider value={{ name: 'Seodong-won' }}>
      <Profile />
    </UserContext.Provider>
  );
}

function Profile() {
  // 깊이에 상관없이 즉시 데이터 가져오기
  const user = useContext(UserContext);
  return <p>안녕하세요, {user.name}님!</p>;
}
```

### 7\. ` useMemo `

**&quot;동일한 연산 반복 방지 \(값의 캐싱\)&quot;**

- **핵심 원리**: 컴포넌트가 리렌더링될 때마다 내부의 변수나 연산도 다시 실행되는 리액트의 단점을 보완합니다\. 이전에 계산된 값\(결과값\)을 메모리\(메모이제이션\)에 저장해 두고, 의존성 배열의 값이 바뀌지 않는 한 기존 값을 재사용합니다\.
- **사용 시점**: 복잡한 수학적 계산, 대규모 배열 필터링이나 정렬 등 매번 계산하기에 리소스가 많이 드는 작업의 성능을 최적화할 때 사용합니다\.

```javascript
import { useMemo } from 'react';

function List({ items }) {
  // items가 변경될 때만 무거운 정렬 로직을 실행
  const sortedItems = useMemo(() => {
    console.log('정렬 연산 중...');
    return [...items].sort((a, b) => a - b);
  }, [items]);

  return <div>{/* 렌더링 로직 */}</div>;
}
```

### 8\. ` useCallback `

**&quot;함수 재생성 방지 \(함수의 캐싱\)&quot;**

- **핵심 원리**: ` useMemo `가 &\#39;값&\#39;을 기억한다면, ` useCallback `은 &\#39;함수&\#39; 자체를 메모리에 기억합니다\. 리액트에서는 리렌더링 시 함수도 새로 생성되는데, 이를 방지하여 불필요한 메모리 낭비를 줄입니다\.
- **사용 시점**: 특히 **자식 컴포넌트에 함수를 Props로 전달할 때** 매우 중요합니다\. 부모가 리렌더링되어 함수 참조 주소가 바뀌면 자식도 불필요하게 리렌더링됩니다\. 이때 자식을 ` React.memo `로 감싸고, 부모에서 ` useCallback `으로 함수를 감싸서 넘기면 자식의 불필요한 렌더링을 완벽하게 차단할 수 있습니다\.

```javascript
import { useState, useCallback, memo } from 'react';

// 자식 컴포넌트의 불필요한 렌더링 방지
const Child = memo(({ onClick }) => {
  console.log('자식 렌더링');
  return <button onClick={onClick}>클릭</button>;
});

function Parent() {
  const [text, setText] = useState('');
  
  // text가 변해도 이 함수는 재생성되지 않음
  const handleClick = useCallback(() => {
    console.log('버튼 클릭됨');
  }, []);

  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <Child onClick={handleClick} />
    </>
  );
}
```

### 9\. ` useTransition `

**&quot;자연스러운 UX를 위한 동시성 처리&quot;**

- **핵심 원리**: React 18에 도입된 Concurrent\(동시성\) 모드의 핵심입니다\. 상태 업데이트의 우선순위를 낮춰줍니다\. 화면 렌더링이 오래 걸리는 무거운 작업\(예: 대규모 리스트 필터링\)이 실행될 때 UI가 멈추는\(블로킹\) 현상을 막아줍니다\.
- **사용 시점**: 영상에서 보듯 탭 전환 시 작업이 느려져도 다른 탭을 누르면 즉각 반응하게 만듭니다\. 서스펜스\(Suspense\)의 로딩 창 대신 기존 화면을 딤\(dim\) 처리하거나 유지하면서 자연스럽게 전환 효과를 낼 때 유용합니다\.

```javascript
import { useState, useTransition } from 'react';

function SearchApp() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    // 텍스트 입력 자체는 즉각 반영 (높은 우선순위)
    // 연관된 무거운 작업(예: 검색 결과 업데이트)은 우선순위를 낮춤
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input onChange={handleChange} />
      {isPending ? <p>업데이트 중...</p> : <SearchResults query={query} />}
    </div>
  );
}
```

### 10\. ` useDeferredValue `

**&quot;스마트한 렌더링 지연&quot;**

- **핵심 원리**: ` useTransition `과 결이 비슷하게 동시성 모드에서 사용됩니다\. 차이점은 함수 실행의 우선순위를 낮추는 게 아니라, **특정 &\#39;값&\#39;의 업데이트 타이밍을 늦추는 것**입니다\.
- **사용 시점**: 빠른 타이핑이나 스크롤 등으로 자식 컴포넌트에서 수많은 렌더링 요청이 발생할 때, 리액트가 스마트하게 이전 렌더링 작업을 무효화\(취소\)하고 가장 마지막 최신 상태값으로 한 번에 계산을 처리하도록 유도할 때 사용합니다\. 끊김 없는 자연스러운 인터페이스를 제공합니다\.

```javascript
import { useState, useDeferredValue } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  // 사용자가 타이핑하는 동안에는 업데이트를 지연시키고, 입력이 멈추면 반영합니다.
  const deferredQuery = useDeferredValue(query);

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {/* 쿼리가 지연되는 동안 이전 검색 결과를 보여줄 수 있습니다. */}
      <SlowList text={deferredQuery} />
    </>
  );
}
```

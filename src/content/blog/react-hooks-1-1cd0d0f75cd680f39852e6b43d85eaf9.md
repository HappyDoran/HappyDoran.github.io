---
schemaVersion: 2
title: "React Hooks (1)"
description: "함수형 컴포넌트에서 React의 상태와 생명주기의 기능을 연동할 수 있게 해주는 함수"
tags: ["React", "상태 관리"]
publishedAt: "2025-04-06T06:18:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 28
---

## React Hooks 이란?

함수형 컴포넌트에서 React의 상태와 생명주기의 기능을 연동할 수 있게 해주는 함수

useState, useEffect와 같은 <strong>내장 훅</strong>과 사용자가 이 훅을 이용해서 정의할 수 있는 <strong>Custom Hook</strong> 존재\.

> 💡 <strong>함수형 컴포넌트?</strong>
> 
> ```javascript
> function Welcome(props) {
>   return <h1>안녕하세요, {props.name}님!</h1>;
> }
> ```

> 💡 <strong>React의 생명주기?</strong>
> 
> 
> React에서의 생명주기는 React 컴포넌트가 브라우저 DOM에 렌더링되는 순간부터 제거되는 순간까지의 여러 단계를 말한다\.
> ex\) 마운트 될때, props나 state가 변경될 때, 언마운트 될 때\(useEffect의 return\)

## React Hook의 유용성

함수형 컴포넌트에 Hook이 나오기 전에는 클래스형 컴포넌트를 사용\.

→ state를 사용하고, 생명주기 메서드를 사용하는 방식이 불편

재사용 컴포넌트를 구현하기 힘들고, 컴포넌트가 복잡함

> 💡 <strong>클래스형 컴포넌트?</strong>
> 
> ```javascript
> class Welcome extends React.Component {
>   render() {
>     return <h1>안녕하세요, {this.props.name}님!</h1>;
>   }
> }
> ```

Hook의 등장과 함께,

- 컴포넌트들 간의 계층을 바꾸지 않고, 상태 로직을 ` 재사용 `할 수 있다\.
- 생명주기가 아닌 기능을 기반으로 하기 때문에 ` 작은 함수 단위 `로 나눌 수 있다\.

## React Hook 규칙

### 1\. 같은 훅을 여러 번 호출할 수 있다\.

```javascript
function ProfileForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  
  // 각각의 useState 호출은 독립적인 상태를 생성한다.
  return (
    <form>
      <input value={firstName} onChange={e => setFirstName(e.target.value)} />
      <input value={lastName} onChange={e => setLastName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <textarea value={bio} onChange={e => setBio(e.target.value)} />
    </form>
  );
}
```

이렇게 여러 상태를 관리할 때 독립적인 useState를 통해 명확한 코드 작성이 가능하다\.

### 2\. 컴포넌트 내부 최상위에서만 호출할 수 있다\. 

<strong>잘못된 사용</strong>

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  if (count > 5) {
    // 🚫 조건문 내부에서 훅 호출 - 규칙 위반!
    const [warning, setWarning] = useState(true);
  }
  
  for (let i = 0; i < 3; i++) {
    // 🚫 반복문 내부에서 훅 호출 - 규칙 위반!
    const [item, setItem] = useState('');
  }
  
  function handleClick() {
    // 🚫 일반 함수 내부에서 훅 호출 - 규칙 위반!
    const [clicked, setClicked] = useState(true);
  }
  
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

<strong>올바른 사용</strong>

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  const [warning, setWarning] = useState(false);
  const [items, setItems] = useState(['']);
  const [clicked, setClicked] = useState(false);
  
  // 조건에 따라 훅의 결과를 사용
  if (count > 5) {
    setWarning(true);
  }
  
  function handleClick() {
    setClicked(true);
    setCount(count + 1);
  }
  
  return (
    <>
      <button onClick={handleClick}>Count: {count}</button>
      {warning && <p>경고: 숫자가 5보다 큽니다!</p>}
    </>
  );
}
```

이렇게 훅은 조건문, 반복문, 일반 함수 내부에서 호출이 불가하고, 컴포넌트 내부의 최상위에서만 호출이 가능하다\.

컴포넌트 내부의 최상위에서 호출된 훅은 컴포넌트의 여러 렌더링 간에 상태를 정확하게 유지하기 위해서 훅이 호출되는 순서에 의존한다\. 무슨 말이냐면,

```javascript
function Counter() {
  // 첫 번째 렌더링: React는 첫 번째 useState 호출의 상태를 기억합니다
  const [count, setCount] = useState(0);
  
  if (count > 0) {
    // 조건부 훅: 첫 번째 렌더링에서는 실행되지 않지만,
    // 두 번째 렌더링에서 실행될 수 있습니다
    // 이렇게 되면 두 번째 렌더링에서 useState의 호출 순서가 변경됩니다!
    const [history, setHistory] = useState([]);
  }
  
  // 두 번째 훅: React는 두 번째 훅이라고 생각하지만,
  // 실제로는 조건에 따라 두 번째 또는 세 번째 훅이 될 수 있습니다
  const [name, setName] = useState('');
  
  // 이런 불일치로 인해 React는 상태를 올바르게 추적할 수 없게 됩니다
}
```

이러한 이유 때문에 리액트 훅의 규칙은 예측 가능하고 일관성있는 애플리케이션 동작을 보장하기 위해 존재한다\.

### 3\. Hook은 React 함수 내에서만 호출할 수 있다\.

<strong>잘못된 사용</strong>

```javascript
// 🚫 일반 JavaScript 함수에서 훅 호출 - 규칙 위반!
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  // ...
}

// 🚫 클래스 컴포넌트에서 훅 호출 - 규칙 위반!
class Counter extends React.Component {
  render() {
    const [count, setCount] = useState(0); // 작동하지 않음!
    return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
  }
}
```

<strong>올바른 사용</strong>

```javascript
// ✅ 함수형 컴포넌트에서 훅 사용
function WindowSize() {
  const [width, setWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return <p>Window width: {width}px</p>;
}

// ✅ 커스텀 훅에서 훅 사용
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return width;
}

// 커스텀 훅 사용
function WindowSizeDisplay() {
  const width = useWindowWidth();
  return <p>Window width: {width}px</p>;
}
```

### 4\. 비동기 함수는 콜백함수로 사용할 수 없다\.

<strong>잘못된 사용</strong>

```javascript
function UserData() {
  const [user, setUser] = useState(null);
  
  // 🚫 useEffect에 직접 async 함수 전달 - 규칙 위반!
  useEffect(async () => {
    const response = await fetch('/api/user');
    const data = await response.json();
    setUser(data);
  }, []);
  
  return user ? <p>Hello, {user.name}</p> : <p>Loading...</p>;
}
```

<strong>올바른 사용</strong>

```javascript
function UserData() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // ✅ 내부에서 async 함수 정의 후 호출
    const fetchUser = async () => {
      const response = await fetch('/api/user');
      const data = await response.json();
      setUser(data);
    };
    
    fetchUser();
  }, []);
  
  return user ? <p>Hello, {user.name}</p> : <p>Loading...</p>;
}
```

## React Hook 종류

### useState

- 리엑트 훅의 기본이자 가장 많이 사용하는 훅\.
- 컴포넌트의 ` 상태(state)를 관리할 수 있는 훅 `이다\.

```c++
const [number, setNumber] = useState(1);
setNumber(2);
```

이렇게 하면 초기값이 1인 number가 생성되고, setNumber 메서드를 호출함으로 써 2로 상태 값을 변경할 수 있다\.

#### 상태값 변경시 리렌더링 발생

setNumber\(setter 함수\)에 의해 상태값이 변경이 될 경우엔 리렌더링이 발생하고, 그 상태가 유지된다\.

### useEffect

컴포넌트 내의 ` 상태의 변화가 있을 때, 이를 감지하여 특정 작업을 해줄 수 있는 훅 `이다\. 보통은 Side Effect를 처리하기 위해서 사용된다\.

> 💡 <strong>Side Effect란?</strong>
> 
> 
> Side Effect는 React 컴포넌트의 주요 역할인 “UI 렌더링” 이외의 모든 작업을 의미한다\.
> ex\) 데이터 패칭, DOM 직접 조작, 이벤트 리스너 관리, 타이머, 로컬 스토리지 접근 등
> 
> → 컴포넌트의 렌더링 흐름을 방해하지 않고, 비동기적으로 처리될 수 있어야 한다\. useEffect는 React가 렌더링을 완료한 후에 실행되므로, 렌더링을 차단하지 않고 부수 효과를 처리할 수 있게 해줍니다\.

```c++

useEffect(()=>{}) // 기본적으로 첫 렌더링(마운트)과 그 이후의 모든 업데이트에 대해 재실행
useEffect(() => {}, []) // 최초 마운트시에만 실행, []를 의존성 배열이라고 한다.
useEffect(() => {}, [count]) // count값이 바뀔 떄만 재실행
```

#### clean up

```javascript
useEffect(()=>{
    console.log("Component Loaded");
    const handleScroll = () => {
        console.log(window.scrollY);
    };
    
    document.addEventListener("scroll", handleScroll);
    
    return () => document.removeEventListener('scroll', handleScroll);
}, []);
```

컴포넌트가 마운트 되면, scroll에 대한 이벤트를 등록하고, 컴포넌트 언마운트시 scroll 이벤트를 해제해줄 수 있다\.

→ return은 컴포넌트가 제거될 때 실행된다\. useEffect는 원래 컴포넌트가 살아있는 동안 계속 실행되는데, 이를 감지하기 위해 컴포넌트가 살아있는 동안 계속 살아있다가, 제거되면 return을 통해 제거되는 것 같다\.

#### useLayoutEffect

useEffect와 비슷하지만 ` 실행 타이밍 `에서 중요한 차이가 있다\.

<strong>useEffect</strong>

컴포넌트 렌더링 → 화면 업데이트 → useEffect를 비동기적으로 실행

비동기적으로 실행이 되므로 성능에 유리하다\.

<strong>useLayoutEffect</strong>

 컴포넌트 렌더링 → useLayoutEffect를 동기적으로 실행 → 화면 업데이트

동기적으로 실행되기 때문에 화면 구성이 끝난 후 실행이 되기 때문에  특정 레이아웃 측정이나 DOM 조작이 필요할 때 유용하다\.

```javascript
// 문제 (useEffect 사용)
function FlickerExample() {
  const [width, setWidth] = useState(0);
  
  // 화면이 그려진 후 측정하므로 깜빡임 발생 가능
  useEffect(() => {
    const measuredWidth = someElement.getBoundingClientRect().width;
    setWidth(measuredWidth); // 이로 인해 컴포넌트가 다시 렌더링됨
  }, []);
  
  return <div style={{ width }}>내용</div>;
}

// 해결 (useLayoutEffect 사용)
function NoFlickerExample() {
  const [width, setWidth] = useState(0);
  
  // 화면이 그려지기 전에 측정하므로 깜빡임 없음
  useLayoutEffect(() => {
    const measuredWidth = someElement.getBoundingClientRect().width;
    setWidth(measuredWidth);
  }, []);
  
  return <div style={{ width }}>내용</div>;
}
```

useLayoutEffect는 브라우저가 화면을 다시 그리기 전에 동기적으로 실행되므로, 렌더링 성능에 영향을 줄 수 있다\. 따라서 꼭 필요한 경우에만 사용하고, 대부분의 경우에는 useEffect를 사용하는 것이 좋다\.

### useRef

useRef는 두가지 주요 용도로 사용된다\.

#### 1\. DOM 요소에 직접 접근하기

리액트에서는 DOM으로의 직접적인 접근을 막기 때문에 ref를 통해 접근해야 한다\.

```javascript
import React, { useRef, useEffect } from 'react';

function AutoFocusInput() {
  // input 요소를 참조하기 위한 ref 생성
  const inputRef = useRef(null);
  
  // 컴포넌트가 마운트된 후 실행
  useEffect(() => {
    // ref.current로 실제 DOM 요소에 접근해 focus() 메서드 호출
    inputRef.current.focus();
  }, []);
  
  return (
    <div>
      <h3>이 입력 필드는 자동으로 포커스됩니다</h3>
      <input 
        ref={inputRef} // ref 연결
        type="text" 
        placeholder="이름을 입력하세요" 
      />
    </div>
  );
}
```

이런식으로 입력 필드에 자동 포커스를 주는 것이 가능하다\. 

이 예시에서 inputRef\.current는 실제 input DOM 요소를 가리킨다\. 포커스 설정, 스크롤 위치 설정, 텍스트 선택 등처럼 DOM 요소에 접근해야하는 것들은 ref를 통해 접근해야 한다\.

```javascript
import React, { useRef } from 'react';

function VideoPlayer() {
  // 비디오 요소를 참조할 ref 생성
  const videoRef = useRef(null);
  
  const playVideo = () => {
    // video 요소의 play() 메서드 호출
    videoRef.current.play();
  };
  
  const pauseVideo = () => {
    // video 요소의 pause() 메서드 호출
    videoRef.current.pause();
  };
  
  return (
    <div>
      <video 
        ref={videoRef} // ref 연결
        width="320" 
        height="240" 
        src="movie.mp4"
      />
      <div>
        <button onClick={playVideo}>재생</button>
        <button onClick={pauseVideo}>일시정지</button>
      </div>
    </div>
  );
}
```

이런식으로 비디오 재생을 제어할 수 있다\.

여기서는 videoRef\.current를 통해서 video 요소의 내장 메서드에 접근한다\. 이런 방식으로 React의 상태 관리 시스템을 우회하고 직접 DOM API를 활용할 수 있다\.

```javascript
function App() {
    const inputRef = useRef(); // useRef 선언
    
    return (
    	<div>
    		<Input ref={inputRef}/> // ref 전달 
			<button onClick={()=>inputRef.current.focus()}> Focus </button>
        </div>
	);
}

const Input = React.forwardRef(( _, ref ) => {
    return (
    <>
    	Input: <input ref={ref} />
    </>
    );
});

export default Input;
```

App 컴포넌트에서 하위 컴포넌트인 Input 컴포넌트에 접근하고 싶다면 forwardRef를 사용하면 된다\.

#### 2\. 리렌더링 없이 값 유지하기

```javascript
import React, { useState, useRef, useEffect } from 'react';

function CounterWithPrevious() {
  const [count, setCount] = useState(0);
  // 이전 count 값을 저장할 ref
  const prevCountRef = useRef();
  
  useEffect(() => {
    // 렌더링 후 현재 count를 prevCountRef에 저장
    prevCountRef.current = count;
  });
  
  // 첫 렌더링에서는 prevCountRef.current가 undefined
  const prevCount = prevCountRef.current;
  
  return (
    <div>
      <h3>현재 카운트: {count}, 이전 카운트: {prevCount}</h3>
      <button onClick={() => setCount(count + 1)}>증가</button>
    </div>
  );
}
```

이런식으로 이전의 상태값을 기억하는 것이 가능하다\.

이 예시에서는 prevCountRef는 이전 렌더링의 count 값을 저장한다\. useState와 달리 useRef의 값이 변경되어도 컴포넌트가 다시 렌더링되지 않는다\.

```javascript
import React, { useState, useRef, useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  // 타이머 ID를 저장할 ref
  const timerRef = useRef(null);
  
  // 타이머 시작
  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      // setInterval의 반환값(타이머 ID)을 ref에 저장
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
      
      console.log('타이머 시작:', timerRef.current);
    }
  };
  
  // 타이머 정지
  const stopTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      // ref에 저장된 타이머 ID로 타이머 중지
      clearInterval(timerRef.current);
      console.log('타이머 정지:', timerRef.current);
    }
  };
  
  // 타이머 리셋
  const resetTimer = () => {
    stopTimer();
    setSeconds(0);
  };
  
  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  return (
    <div>
      <h2>타이머: {seconds}초</h2>
      <button onClick={startTimer} disabled={isRunning}>시작</button>
      <button onClick={stopTimer} disabled={!isRunning}>정지</button>
      <button onClick={resetTimer}>리셋</button>
    </div>
  );
}
```

이 예시에서는 timeRef\.current에 setInterval의 ID를 저장한다\.\(참조한다의 느낌이 더 강하다\.\) 타이머를 멈추거나 재생할 때 동일한 ID를 이용해서 올바르게 타이머를 조작할 수 있다\. 컴포넌트가 언마운트 될때도 ref를 사용해서 타이머를 중지한다\.

#### useRef의 작동 원리 쉽게 이해하기

> 💡 <strong>기본적으로 useRef는 “박스”라고 생각하면 된다\.</strong>
> 
> 
> ```javascript
> ┌───────────────────┐
> │     useRef()      │
> │                   │
> │   ┌───────────┐   │
> │   │  current  │───┼───> 저장된 값 (객체, DOM 요소 등)
> │   └───────────┘   │
> └───────────────────┘
> ```
> 
> 
> 1\. 이 박스\(useRef가 반환하는 객체\)는 컴포넌트의 생애주기 동안 유지된다\.
> 2\. 박스 안의 current 속성은 언제든 변경이 가능하다\.
> 3\. 박스 자체는 변하지 않기 때문에 React는 렌더링을 감지하지 않는다\.
> 4\. 박스의 내용물을 변경해도 박스는 그대로이다\.
> 
> 일반 변수와의 차이는 렌더링 사이에도 값이 유지된다는 것이다\. useState와의 차이점으로 값이 변경되어도 박스 자체는 변하지 않기 때문에 리렌더링을 유발하지 않는다\.

### useMemo

원래, 컴포넌트 내의 변수는 리렌더링 시에 다시 정의된다\. useMemo를 사용하면, 매 리렌더링 시마다 다시 정의되는 것이 아니라, ` 특정 값이 변할 때만 정의 `된다\. 그럼 useEffect와 비슷한 느낌인건가?

즉, useMemo는 ` 변수의 최적화를 위한 훅 `이다\.

어떠한 느낌이냐면, 레스토랑에서 복잡한 요리를 손님이 주문할 때 마다 다시 만들면 시간이 오래 걸린다\. 하지만 주문이 같다면 미리 만들어둔 요리를 제공하는 것이 효율적이다\. 주문이 바뀌면 다시 만들면 되고,,,

컴포넌트가 렌더링이 되는 것은 함수 컴포넌트를 호출해서 실행하는 것을 의미한다\.
→ 함수가 실행될 때마다 내부에 선언 되어 있던 변수, 함수 등이 매번 다시 선언되거나 다시 실행 되는 것을 의미

#### 컴포넌트가 리렌더링 되는 조건

1. 컴포넌트의 state가 변경
1. 컴포넌트의 props가 변경
1. 부모 컴포넌트의 리렌더링

→ 부모 컴포넌트가 리렌더링될 때 새로운 prop이 들어오지 않더라도 부모 컴포넌트가 리렌더링되면 자식 컴포넌트 역시 리렌더링 된다\.

```javascript
import React, { useState, useMemo } from 'react';

function ExpensiveCalculation({ numbers }) {
  // 고비용 계산 시뮬레이션
  function calculateSum(numbers) {
    console.log("복잡한 계산 실행!");
    return numbers.reduce((acc, num) => acc + num, 0);
  }

  const [color, setColor] = useState('red');
  
  // useMemo 없이 사용하면:
  // const sum = calculateSum(numbers);
  // color가 바뀔 때도 매번 계산됨!
  
  // useMemo 사용:
  const sum = useMemo(() => calculateSum(numbers), [numbers]);
  // numbers가 바뀔 때만 계산됨!

  return (
    <div>
      <div style={{ color }}>합계: {sum}</div>
      <button onClick={() => setColor(color === 'red' ? 'blue' : 'red')}>
        색상 변경
      </button>
    </div>
  );
}
```

이 예제에서는 color의 상태가 바뀌면 컴포넌트는 리렌더링 된다\. 
useMemo를 사용하지 않으면, 리렌더링될 때마다 calculateSum이 다시 실행된다\. 
하지만 useMemo를 사용함으로써 number값\(의존성 배열에 들어있는 값\)이 바뀔 때만 calculateSum이 실행되고, 그 외에는 이전에 계산된 값을 재사용한다\.

> 💡 <strong>그렇다면 useMemo를 이용한 변수는 상태값인가?</strong>
> 
> 상태값이랑은 조금 별개로 메모이제이션된 값을 반환하는 훅이다\. ` 특정 값이나 연산의 결과를 기억 `하여, ` 의존성이 변경되지 않으면 이전에 계산된 값을 재사용 `한다\.
> 
> 그러니까 useMemo의 경우 ` 계산 비용이 높은 연산의 결과를 저장하고 싶을 때 사용 `한다\.

### React\.Memo

React\.memo는 컴포넌트 자체를 메모이제이션하는 고차 컴포넌트\(HOC\)이다\. 

어떠한 느낌이냐면, 매일 아침 동일한 준비물을 가방에 넣어야 된다고 생각해보자\. 매번 새로 준비하는 대신, 한번 준비해두고, 변화가 필요할 때만 업데이트 하는 것이 효율적인 느낌이다\.

```javascript
const Box = React.memo(()=>{
    console.log("Box 컴포넌트 렌더링");
    return <div/>
})

export default Box;

function App(){
    const [count, setCount] = useState(0);
    
    return (
    	<div>
        	{count}
            <button onClick={()=>setCount(count+1)}>+</button>
        	<Box/>
        </div>
    )
}

export default App;
```

이렇게 할 경우에 버튼을 클릭하여 부모 컴포넌트가 리렌더링이 되어도, 메모이즈된 Box 컴포넌트는 리렌더링 되지 않는다\.

> 💡 <strong>useMemo와 React\.Memo의 차이점</strong>
> 
> 
> 
> <strong>useMemo</strong>
> 
> - <strong>대상</strong>: 값이나 계산 결과
> - <strong>목적</strong>: 계산 비용이 큰 연산 결과를 재사용
> - <strong>언제 사용</strong>: 복잡한 계산이나 데이터 변환이 필요할 때
> 
> <strong>React\.memo</strong>
> 
> - <strong>대상</strong>: 컴포넌트 자체
> - <strong>목적</strong>: 불필요한 컴포넌트 리렌더링 방지
> - <strong>언제 사용</strong>: 부모 컴포넌트가 자주 리렌더링되지만, 자식 컴포넌트의 props는 자주 변경되지 않을 때

### useCallback

컴포넌트가 렌더링될 때마다 ` 함수가 재정의 `되지 않고, 의존성 배열 내의 값이 변할 때만 재정의되도록 만들어주는 훅이다\. 

함수가 재정의 되면, 함수는 객체 타입이기 때문에 그 참조값이 바뀌게 된다\. 이 때 함수가 다시 정의되는 것을 막기 위해 useCallback 훅을 사용할 수 있다\.

하위 컴포넌트에 함수가 props로 전달되게 되면 그 하위 컴포넌트의 리렌더링을 방지할 수 있다\.

→ 참조값이 변하지 않기 때문에 prop으로 전달되는 값도 변하지 않는다\.

```javascript
const CheckBox = React.memo(({ label, on, onChange})) => {
  console.log(label, on);
  return (
    <label>
      {label}
      <input type="checkbox" defaultChecked={on} onChange={onChange}/>
    </label>
  )
}

export default CheckBox;

function App(){
  const [foodOn, setFoodOn] = useState(false);
  const [clothesOn, setClothesOn] = useState(false);
  const [shelterOn, setShelterOn] = useState(false);

  // const foodChange = useCallback((e)=> setFoodOn(e.target.checked), []);
  // const clothesChange = useCallback((e)=> setClothesOn(e.target.checked), []);
  // const shelterChange = useCallback((e)=> setShelterOn(e.target.checked), []);
  
  // 함수형 업데이트를 사용하자.
  const foodChange = useCallback((e) => {
	  setFoodOn(prevState => e.target.checked)
  }, []);
  const clothesChange = useCallback((e) => {
	  setClothesOn(prevState => e.target.checked)
  }, []);
  const shelterChange = useCallback((e) => {
	  setShelterOn(prevState => e.target.checked)
  }, []);
  
  return (
    <div>
      <CheckBox label="Food" on={foodOn} onChange={foodChange} />
      <CheckBox label="Clothes" on={clothesOn} onChange={clothesChange} />
      <CheckBox label="Shelter" on={shelterOn} onChange={shelterChange} />
    </div>
  )
}

export default App;
```

- Food check box의 체크를 누르면 props로 전달된 onChange인 foodChange가 실행되고 이를 통해 App 컴포넌트의 foodOn의 상태값이 변경된다\.
- App 컴포넌트의 state가 변경되었으므로, App 컴포넌트는 리렌더링된다\.  이때 useCallback으로 감싸주지 않으면, 이 함수들은 모두 다시 재정의된다\.
- 이 함수들은 자식 컴포넌트들에게 props로 전달되고, 따라서 자식 컴포넌트들도 리렌더링 된다\.
- useCallback으로 감싸주면 App 컴포넌트의 state가 리렌더링 되어도 재정의 되지 않는다\.

 

> 💡 <strong>useCallback을 사용할 때의 유의점</strong>
> 
> 이전의 상태를 사용해서 새 상태를 계산하는 경우에, useCallback을 사용하게 된다면 의존성 배열을 넘기고, setData로 state를 초기화 해줄 때, 함수형 업데이트로 초기화를 해주어야 한다\.
> 
> 함수형 업데이트로 초기화를 해주어야 의존성 배열을 빈 값으로 해도 항상 최신의 state를 함수형 업데이트의 인자를 통해서 참조할 수 있다\. 

```javascript
// 함수형 업데이트를 사용하지 않은 경우 - count를 의존성 배열에 포함해야 함
const increment = useCallback(() => {
  setCount(count + 1);
}, [count]); // count가 변경될 때마다 함수가 재생성됨

// 함수형 업데이트 사용 - 의존성 배열을 비울 수 있음
const incrementBetter = useCallback(() => {
  setCount(prevCount => prevCount + 1);
}, []); // 컴포넌트가 마운트될 때만 함수가 생성됨
```

## React Hook 정리

<strong>useState</strong>: 컴포넌트에 ` 상태 `를 추가하여 변경 가능한 값을 관리하고 업데이트할 수 있게 해주는 Hook

<strong>useEffect</strong>: 컴포넌트의 렌더링 이후에 ` 부수 효과(side effect) `를 실행할 수 있게 해주는 Hook

<strong>useRef</strong>: 렌더링 사이에 ` 지속되는 변경 가능한 값 `을 저장하고, DOM 요소에 직접 접근할 수 있게 해주는 Hook

<strong>useMemo</strong>: ` 계산 비용이 높은 값 `을 메모이제이션하여 의존성이 변경될 때만 재계산하는 성능 최적화 Hook

<strong>React\.memo</strong>: ` 컴포넌트 `를 메모이제이션하여 props가 변경되지 않으면 리렌더링을 방지하는 고차 컴포넌트

<strong>useCallback</strong>: ` 함수 `를 메모이제이션하여 의존성이 변경될 때만 함수를 재생성하는 성능 최적화 Hook

## 참고

<a class="notion-resource-card" href="https://velog.io/@minw0_o/%EB%A6%AC%EC%95%A1%ED%8A%B8-hook-%EC%B4%9D-%EC%A0%95%EB%A6%AC"><span class="notion-resource-label">링크</span><span>https://velog.io/@minw0_o/%EB%A6%AC%EC%95%A1%ED%8A%B8-hook-%EC%B4%9D-%EC%A0%95%EB%A6%AC</span></a>

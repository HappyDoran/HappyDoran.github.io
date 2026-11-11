---
schemaVersion: 2
title: "React.memo, useMemo, useCallback으로 컴포넌트 최적화"
description: "랜더링이 지나치게 발생하거나, 랜더링마다 무거운 작업을 계속하게 된다면 성능에 부담을 줄 경우 사용할 수 있다."
tags: ["React", "렌더링", "성능 최적화"]
publishedAt: "2025-07-27T05:44:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 4
---

랜더링이 지나치게 발생하거나, 랜더링마다 무거운 작업을 계속하게 된다면 성능에 부담을 줄 경우 사용할 수 있다\.

props가 변경이 되는 경우에만 랜더링이 되게 만든다면 효율적으로 될 것이다\.

## React\.memo

> 💡 <strong>HOC\(고차 컴포넌트\)</strong>
> 
> 어떠한 컴포넌트를 인자로 받아서 새로운 컴포넌트를 반환해주는 함수
> ㄴ 최적화된 컴포넌트는 prop check를 통해서 본인이 받는 props에 변화가 있는지 없는지 체크
> 
> prop check 후에 변동된 props가 있다면 렌더링을 다시하고, 아니면 재사용 한다\.

React Memo는 오직 props의 변화로만 체크가 가능하다\.

### React\.memo 예시

```javascript
// 부모 컴포넌트인 App.tsx

import { useState } from "react";
import Children from "./Children";
import "./styles.css";

export default function App() {
  const [parentAge, setParentAge] = useState(0);
  const [childAge, setChildAge] = useState(0);

  const increaseParentAge = () => {
    setParentAge(parentAge + 1);
  };

  const increaseChildAge = () => {
    setChildAge(childAge + 1);
  };

  console.log("부모 컴포넌트 랜더링");

  return (
    <>
      <div style={{ border: "1px solid red", padding: "10px" }}>
        <h1>부모</h1>
        <p>age: {parentAge}</p>
        <button onClick={increaseParentAge}>부모 나이 증가</button>
        <button onClick={increaseChildAge}>자식 나이 증가</button>
        <Children name={"홍길동"} age={childAge} />
      </div>
    </>
  );
}
```

```javascript
// 자식 컴포넌트인 Children.tsx

import React from "react";

const Children = ({ name, age }: { name: string; age: number }) => {
  console.log("자식 컴포넌트 랜더링");
  return (
    <div style={{ border: "1px solid blue", padding: "10px" }}>
      <h2>자식</h2>
      <p>name: {name}</p>
      <p>age: {age}</p>
    </div>
  );
};

export default React.memo(Children);
```

다음과 같은 컴포넌트에서 자식 컴포넌트가 React\.memo로 감싸져 있으면, 부모 컴포넌트가 랜더링이 되어도, 자식 컴포넌트에서는 prop check에서 변경된 props가 없기 때문에 재랜더링 되지 않고, 재사용을 하기 때문에 console\.log가 출력이 되지 않는다\.

### React\.memo \+ useMemo

```javascript
// 부모 컴포넌트인 App.tsx

import { useCallback, useMemo, useState } from "react";
import Children from "./Children";
import "./styles.css";

export default function App() {
  const [parentAge, setParentAge] = useState(0);

  const increaseParentAge = () => {
    setParentAge(parentAge + 1);
  };

  console.log("부모 컴포넌트 랜더링");

  const name = useMemo(() => {
    return {
      firstName: "홍",
      lastName: "길동",
    };
  }, []);

  return (
    <>
      <div style={{ border: "1px solid red", padding: "10px" }}>
        <h1>부모</h1>
        <p>age: {parentAge}</p>
        <button onClick={increaseParentAge}>부모 나이 증가</button>
        <Children name={name} />
      </div>
    </>
  );
}

```

```javascript
// 자식 컴포넌트인 Children.tsx

import React from "react";

const Children = ({
  name,
}: {
  name: { firstName: string; lastName: string };
}) => {
  console.log("자식 컴포넌트 랜더링");
  return (
    <div style={{ border: "1px solid blue", padding: "10px" }}>
      <h2>자식</h2>
      <p>성: {name.firstName}</p>
      <p>이름: {name.lastName}</p>
    </div>
  );
};

export default React.memo(Children);

```

name의 경우 객체이다\. 즉 원시 타입이 아니기 때문에 랜더링이 될 때 주소값이 보존되지 않는다\. 따라서 주소값이 바뀌기 때문에 계속 랜더링이 되는거다\. 따라서 이 name을 useMemo로 감싸주게 되면, 메모이제이션 되면서 값이 바뀌기 전까지 랜더링이 되지 않는다\.

### React\.memo \+ useCallback

```javascript
// 부모 컴포넌트인 App.tsx

import { useCallback, useState } from "react";
import Children from "./Children";
import "./styles.css";

export default function App() {
  const [parentAge, setParentAge] = useState(0);

  const increaseParentAge = () => {
    setParentAge(parentAge + 1);
  };

  console.log("부모 컴포넌트 랜더링");

  const tellMe = useCallback(() => {
    console.log("tellMe");
  }, []);

  return (
    <>
      <div style={{ border: "1px solid red", padding: "10px" }}>
        <h1>부모</h1>
        <p>age: {parentAge}</p>
        <button onClick={increaseParentAge}>부모 나이 증가</button>
        <Children name={"홍길동"} tellMe={tellMe} />
      </div>
    </>
  );
}
```

```javascript
// 자식 컴포넌트인 Children.tsx

import React from "react";

const Children = ({ name, tellMe }: { name: string; tellMe: () => void }) => {
  console.log("자식 컴포넌트 랜더링");
  return (
    <div style={{ border: "1px solid blue", padding: "10px" }}>
      <h2>자식</h2>
      <p>name: {name}</p>
      <button onClick={tellMe}>tellMe 호출</button>
    </div>
  );
};

export default React.memo(Children);

```

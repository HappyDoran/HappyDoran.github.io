---
schemaVersion: 2
title: "React Query란?"
description: "React Query는 서버로부터 데이터 패칭, 캐싱, 캐시 제어 등 데이터를 쉽고 효율적으로 관리할 수 있는 라이브러리이다."
tags: ["React", "상태 관리", "네트워크"]
publishedAt: "2025-04-09T05:30:00.000Z"
updatedAt: "2026-11-10T15:31:00.000Z"
manuscriptPages: 19
---

React Query는 서버로부터 데이터 패칭, 캐싱, 캐시 제어 등 데이터를 쉽고 효율적으로 관리할 수 있는 라이브러리이다\.

대표적인 기능은 다음과 같다\.

- 데이터 <strong>패칭</strong> 및 <strong>캐싱</strong>
- 동일한 요청의 <strong>중복 제거</strong>
- <strong>신선한 데이터</strong> 유지
- 무한 스크롤, 페이지네이션 등의 <strong>성능 최적화</strong>
- 네트워크 재연결, 요청 실패 등의 <strong>자동 갱신</strong>

## 데이터 캐싱

React Query를 활용해서 데이터를 가져올 때는 항상 ` 쿼리 키(queryKey) `를 지정하게 된다\. 이 쿼리 키는 캐시된 데이터와 비교해 새로운 데이터를 가져올지, 캐시된 데이터를 사용할지 결정하는 기준이 된다\.

```javascript
export const useGetArtistList: GetArtistFnType = () => {
  const getArtistLst = () => {
    return instance.get('/artist/get');
  };

  return useQuery({
    queryKey: ['getArtist'],
    queryFn: getArtistLst,
    select: ({ data }) => {
      return data.artists;
    },
  });
};
```

![](<../../assets/blog/react-query-1d00d0f75cd68084aa40c6a0bf3ea5a0/image-001.png>)

쿼리 키는 캐시된 데이터를 구분하는 중요한 지표가 된다\. 다음 이미지는 쿼리 키와 일치하는 캐시 데이터가 없을 때, 서버에서 새로운 데이터를 가져오는 과정을 보여준다\.

서버에서 데이터를 가져오면 그 데이터는 캐시되고 그 이후 요청부터는 캐시된 데이터를 사용할 수 있다\.

![](<../../assets/blog/react-query-1d00d0f75cd68084aa40c6a0bf3ea5a0/image-002.png>)

반대로 쿼리 키와 일치하는 캐시된 데이터가 있으면, 서버에 요청하지 않고 캐시된 데이터를 사용할 수 있다\. 따라서 같은 데이터를 가져오는 요청이 여러 번 발생해도, 캐시된 데이터를 사용할 수 있기 때문에 중복 요청을 줄일  수 있다\.

### 데이터의 신선도

React Query는 캐시된 데이터를 신선\(Fresh\)하거나 상한\(Stale\) 상태로 구분해 관리한다\. 캐시된 데이터가 신선하다면 캐시된 데이터를 사용하고, 만약 데이터가 상했다면 서버에 다시 요청해 신선한 데이터를 가져온다\.

→ 데이터의 유통기한

```javascript
export const useGetList = (params?: GetTodosParams) => {
  return useQuery({
    queryKey: ['todos', params],
    queryFn: () => getTodos(params),
    staleTime: 1000 * 10, // 10초 후 상한, 즉 10초 동안 신선함.
  });
};

```

#### Stale Time

데이터가 상하는데 걸리는 시간

fresh → stale까지의 걸리는 시간

#### Cache Time\(V5에선 gcTime으로 명명\)

데이터가 캐시에 저장되고 없어지는데까지 걸리는 시간

다음과 같은 개념에 이어서 stale Time이 10000\(10초\), gc Time이 60000\(1분\)일 때를 가정해서의 흐름을 설명해보겠다\.

### Query를 요청했을 때의 흐름

<strong>1\. 초기 데이터 요청</strong>

- 쿼리를 처음 실행하게 되면 서버에 데이터를 요청한다\.\(request\)
- 데이터를 받아오면 캐시에 저장하고, 화면에 랜더링한다\.
- 초기에 받아온 데이터는 신선한\(fresh\) 상태이다\.

<strong>2\. Stale time 기간\(데이터가 신선한 상태\)</strong>

- 10초 동안은 데이터가 신선한\(fresh\) 상태로 간주된다\.
- 이 기간동안은 같은 쿼리가 다시 실행되면 네크워크 요청 없이 캐시에서 데이터를 바로 반환한다\.

<strong>3\. Stale time이 지난 후</strong>

- 지정해놓은 stale Time\(10초\)가 지나면 데이터는 stale 상태로 간주된다\.
- stale로 변한 데이터를 호출하는 쿼리가 호출된다면, gc Time\(1분\) 동안에는 캐시에 있는 데이터를 보여준다\.
- 동시에 백그라운드에서 새로운 데이터를 요청한다\.\(Refetch\)
- 새로운 데이터가 오면 화면을 업데이트한다\.

<strong>4\. gc Time 기간\(데이터를 마지막으로 사용하고 난 시점부터 gc Time 동안\)</strong>

- 데이터를 마지막으로 사용한 시점부터 gc Time 동안은 캐시에 유지된다\.
- 컴포넌트가 언마운트 되어도 gc Time 동안에는 캐시 메모리에 보관된다\.
- gc Time 안에, 즉 1분 안에 다시 컴포넌트 마운트가 되면, 캐시된 데이터를 먼저 보여주고 백그라운드 API 에서 업데이트 한다\.

> 💡 gc Time 기간 동안에 백그라운드에서 새로운 데이터를 가져오면 캐시 데이터도 갱신되고, stale time과 gc time도 갱신됩니다\.

<strong>5\. 가비지 콜랙션</strong>

- gc Time이 지난 후, 해당 쿼리 데이터는 메모리에서 완전히 제거된다\.
- 이후에 같은 쿼리를 실행하게 되면 처음부터 다시 요청해야 한다\.

## useQuery

가장 기본적인 쿼리 훅으로, 컴포넌트에서 데이터를 가져올 때 사용한다\.

```javascript
import { useQuery } from '@tanstack/react-query'

type ResponseValue = {
  message: string
  time: string
}

export default function DelayedData() {
  const { data } = useQuery<ResponseValue>({
    queryKey: ['delay'],
    queryFn: async () => (await fetch('URL')).json(),
    staleTime: 1000 * 10
  })
  return <div>{data?.time}</div>
}
```

### Query Key

쿼리 키는 쿼리를 식별하는 고유한 값으로, 배열 형태로 저장된다\. 

```javascript
// 단일 아이템 쿼리 키
useQuery({ queryKey: ['hello'] })

// 다중 아이템 쿼리 키
useQuery({ queryKey: ['hello', 'world', 123, { a: 1, b: 2 }] })

// 서로 같은 쿼리
useQuery({ queryKey: ['hello', 'world', 123, { a: 1, b: 2 }] })
useQuery({ queryKey: ['hello', 'world', 123, { b: 2, c: undefined, a: 1 }] })

// 서로 다른 쿼리
useQuery({ queryKey: ['hello', 'world', 123, { a: 1, b: 2 }] })
useQuery({ queryKey: ['hello', 'world', 123, { a: 1, b: 2, c: 3 }] })
useQuery({ queryKey: ['hello', 'world'] })
```

### QueryFn

쿼리 함수는 데이터를 가져오는 비동기 함수로, 꼭 데이터를 반환하거나 오류를 던져야 한다\. 던져진 오류는 반환되는 error 객체로 확인할 수 있다\. 기본적으로 error는 null이다\.

```javascript
import { useQuery } from '@tanstack/react-query'

type ResponseValue = {
  message: string
  time: string
}

export default function DelayedData() {
  const { data, error } = useQuery<ResponseValue>({
    queryKey: ['delay'],
    queryFn: async () => {
      const res = await fetch('URL')
      const data = await res.json()
      if (!data.time) {
        throw new Error('문제가 발생했습니다!')
      }
      return data
    },
    staleTime: 1000 * 10,
    retry: 1
  })
  return (
    <>
      {data && <div>{JSON.stringify(data)}</div>}
      {error && <div>{error.message}</div>}
    </>
  )
}
```

### 옵션

#### select

선택 옵션을 사용하면 가져온 데이터를 변형\(선택\)을 할 수 있습니다\. 쿼리 함수가 반환하는 데이터를 인수로 받아 선택 함수에서 처리하고 반환하면 최종 데이터가 됩니다\. 최종 데이터의 타입은 useQuery 의 3번째 제네릭 타입으로 선언할 수 있습니다\.

```javascript
async function queryFn(): Promise<Users> {
  const res = await fetch('https://api.heropy.dev/v0/users')
  const { users } = await res.json()
  return users
}
export default function UserNames() {
  // data는 string[] 타입으로 추론
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn,
    staleTime: 1000 * 10,
    select: data => data.map(user => user.name)
  })
  // ...
}

```

#### placeholderData

새로운 데이터를 가져오는 과정에서 쿼리가 무효화 되기 때문에, 일시적으로 데이터가 없는 상태\(undefined\)가 되면 데이터 출력 화면이 깜빡거릴 수 있다\. 

이런 현상을 방지하기 위해 placeholderData를 사용하여, 쿼리가 호출되는 대기 상태\(Pending\)에서 임시로 표시할 데이터를 미리 지정할 수 있다\.

placeholderData 옵션에는 함수를 지정할 수 있으며, 이 함수는 새로운 데이터를 가져오기 직전의 이전\(Previous\) 데이터를 받을 수 있어서 이를 반환해 임시 데이터로 사용할 수 있습니다\.

```javascript
// ...

export default function Movies() {
  // ...
  
  const { data: movies } = useQuery<Movie[]>({
    queryKey: ['movies', searchText], // 검색어
    queryFn: async () => {
      const res = await fetch(`https://omdbapi.com?apikey=7035c60c&s=${searchText}`)
      const { Search: movies } = await res.json()
      return movies
    },
    placeholderData: prev => prev
  })
  
  // ...
}
```

사용자가 검색어\(searchText\)를 변경하면 새로운 쿼리키가 생성된다\. 새 쿼리가 로딩되는 동안 React Query는 이전 검색 결과\(prev\)를 임시 데이터로 표시한다\. 새 쿼리 결과가 도착하면 UI가 새 데이터로 자동 업데이트 된다\. 

#### 그 외의 옵션

위에서 설명한 옵션 이외에도 쿼리를 실행할 때의 옵션을 추가할 수 있다\.

` structuralSharing ` \- 새로운 데이터와 이전의 데이터를 비교해서 변경되지 않은 부분은 재사용

` meta ` \- 쿼리에 대한 추가 정보 제공

<a class="notion-resource-card" href="https://www.heropy.dev/p/HZaKIE"><span class="notion-resource-label">링크</span><span>https://www.heropy.dev/p/HZaKIE</span></a>

### 반환

#### isFetching, isPending, enabled, isLoading

` isfetching ` \- 쿼리 함수가 실행 중인지의 여부로, 데이터를 가져오는 중을 나타낸다\.

` isPending ` \- 캐시된 데이터가 없고, 쿼리가 아직 완료되지 않은 상태의 여부로, initialData 혹은 placeholderData 옵션으로 데이터를 제공하면 출력 대기\(Pending\)가 필요하지 않으므로 false를 반환한다\.

` enabled ` \- 옵션을 false로 지정하면 쿼리가 대기 상태를 시작하므로 isPending은 true를 반환한다\.

` isLoading ` \- 쿼리의 첫 번째 가져오기가 진행중인 경우를 나타낸다\. ` isFetching && isPending ` 

#### refetch

데이터를 항상 새롭게 다시 가져올 수 있다\.

```javascript
export default function DelayedData() {
  const { data, isStale, refetch } = useQuery<ResponseValue>({
    queryKey: ['delay'],
    queryFn: async () => (await fetch('https://api.heropy.dev/v0/delay?t=1000')).json(),
    staleTime: 1000 * 10
  })
  return (
    <>
      <div>{data?.time}</div>
      <div>데이터가 상했나요?: {JSON.stringify(isStale)}</div>
      <button onClick={() => refetch()}>데이터 가져오기!</button>
    </>
  )
}
```

만약 신선도를 기반으로 데이터를 가져오려면, ` QueryClient.fetchQuery() ` 메소드를 사용하여 가져올 수 있다\. 

```javascript
import { useQuery, useQueryClient, queryOptions } from '@tanstack/react-query'
// ...

const options = queryOptions<ResponseValue>({
  queryKey: ['delay'],
  queryFn: async () => (await fetch('https://api.heropy.dev/v0/delay?t=1000')).json(),
  staleTime: 1000 * 10
})

export default function DelayedData() {
  const queryClient = useQueryClient()
  const { data, isStale } = useQuery(options)
  
  function fetchData() {
    const data = await queryClient.fetchQuery(options)
    console.log(data) // 캐시된 데이터 or 새로 가져온 데이터
  }
  return (
    <>
      <div>{data?.time}</div>
      <div>데이터가 상했나요?: {JSON.stringify(isStale)}</div>
      <button onClick={fetchData}>데이터 가져오기!</button>
    </>
  )
}
```

만약 캐시된 데이터가 필요하다면, ` queryClient.getQueryData() ` 메소드를 사용할 수 있다\. 

캐시된 데이터가 없을 때 자동으로 fetchQuery를 호출하여 데이터를 호출할 수 있는 ` ensureQueryData() `를 사용할 수도 있다\.

```javascript
import { useQuery, useQueryClient } from '@tanstack/react-query'
// ...

export default function DelayedData() {
  const queryClient = useQueryClient()
  const { data, isStale } = useQuery<ResponseValue>({
    queryKey: ['delay'],
    queryFn: async () => (await fetch('https://api.heropy.dev/v0/delay?t=1000')).json(),
    staleTime: 1000 * 10
  })
  
  function getCachedData() {
    const data = queryClient.getQueryData(['delay'])
    console.log(data) // 캐시된 데이터 or undefined
  }
  return (
    <>
      <div>{data?.time}</div>
      <div>데이터가 상했나요?: {JSON.stringify(isStale)}</div>
      <button onClick={getCachedData}>데이터 가져오기!</button>
    </>
  )
}
```

## useMutation

데이터 변경 작업\(생성, 수정,삭제, 단순 get을 제외한 모든 작업\)은 useMutation 훅을 제공한다\.

이를 통해, 데이터 변경 작업을 처리하고 다양한 성공, 실패, 로딩 등의 상태를 얻을 수 있다\.

요청 실패 시의 자동 재시도나 낙관적 업데이트 같은 고급 기능도 쉽게 처리할 수 있다\.

> 💡 낙관적 업데이트?
> 
> 서버 요청의 응답을 기다리지 않고, 먼저 UI를 업데이트 하는 기능을 말합니다\.
> 
> 서버 응답이 느린 상황에서도 빠른 인터페이스를 제공할 수 있어 사용자 경험을 크게 향상시킬 수 있다\.

### 옵션

#### mutationFn

실행할 비동기 변이 함수, 필수 옵션

```typescript
export const useArtist: ArtistFnType = (onSuccess, onError) => {
  const artist = async ({ file, data }: ArtistParams) => {
    const formData = new FormData();

    formData.append('artistData', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (file) {
      formData.append('profileImage', file);
    }

    return instance.post('/artist/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  return useMutation({
    mutationFn: artist, // 비동기로 실행할 함수
    onSuccess: onSuccess,
    onError: onError,
  });
};
```

#### onMutate

변이 함수가 실행되기 전에 호출되는 함수

```javascript
onMutate: async newUser => {
      // 낙관적 업데이트 전에 사용자 목록 쿼리를 취소해 잠재적인 충돌 방지!
      await queryClient.cancelQueries({ queryKey: ['users'] })

      // 캐시된 데이터(사용자 목록) 가져오기!
      const previousUsers = queryClient.getQueryData<Users>(['users'])

      // 낙관적 업데이트
      if (previousUsers) {
        queryClient.setQueryData<Users>(['users'], [...previousUsers, newUser])
      }

      // 각 콜백의 context로 전달할 데이터 반환!
      return { previousUsers }
    },
```

#### onSuccess, onError

변이에 성공하거나, 실패하게 되면 호출하는 함수

## 참고

<a class="notion-resource-card" href="https://www.heropy.dev/p/HZaKIE"><span class="notion-resource-label">링크</span><span>https://www.heropy.dev/p/HZaKIE</span></a>

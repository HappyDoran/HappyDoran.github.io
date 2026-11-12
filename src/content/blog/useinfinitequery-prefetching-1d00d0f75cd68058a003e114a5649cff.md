---
schemaVersion: 2
title: "useInfiniteQuery와 Prefetching"
description: "무한 스크롤은 다음 데이터가 필요해진 순간 요청하면 네트워크 지연이 그대로 드러난다. useInfiniteQuery로 페이지를 관리하면서 다음 페이지를 미리 가져와 캐시에 두는 구조를 살펴본다."
tags: ["React", "상태 관리", "네트워크", "성능 최적화"]
publishedAt: "2025-04-09T05:30:00.000Z"
updatedAt: "2026-11-12T04:03:00.000Z"
manuscriptPages: 11
---

무한 스크롤은 다음 데이터가 필요해진 순간 요청하면 네트워크 지연이 그대로 드러난다\. useInfiniteQuery로 페이지를 관리하면서 다음 페이지를 미리 가져와 캐시에 두는 구조를 살펴본다\.

API·컴포넌트 이름은 가상 예시다\. 코드는 요청·캐시 조립의 구조를 보여주는 발췌이며 데이터 응답 형태와 페이지 번호 규칙은 서버 계약에 맞춰야 한다\.

### useInfiniteQuery

React Query의 useInfiniteQuery는 페이지네이션된 데이터를 효율적으로 가져오기 위한 훅이다\. 여러 개의 페이지를 하나의 결과 집합으로 관리하며, 각 페이지를 로드할 때마다 이전 데이터에 새로운 데이터를 추가한다\.

useInfiniteQuery의 단조로운 옵션은 다음과 같다\.

<strong>queryKey</strong>

: 쿼리를 호출할 때 해당되는 키값과 매치되는 데이터가 있는지 없는지 먼저 체크하기 위해 사용한다\.

<strong>queryFn</strong>

: 쿼리에서 실행할 함수이다\.

<strong>getNextPageParam</strong>

: queryFn에서 함수를 실행할 때 필요한 offset\(예를 들어, 다음 페이지를 뜻하는 params\)를 설정한다\.

<strong>initialPageParam</strong> 

: 처음 페이지 offset을 뜻한다\. 대체적으로 0페이지부터 가져오거나, 1페이지부터 가져온다\.

### 무한 스크롤 흐름

#### usePaginatedItems

```typescript
export const usePaginatedItems: PaginatedItemsFnType = () => {
  const getItemPage = (page: number) => {
    return instance.get(`/api/items?page=${page}`);
  };

  return useInfiniteQuery({
    queryKey: ['infiniteItems'],
    queryFn: ({ pageParam = 0 }) => getItemPage(pageParam),
    initialPageParam: startPage,
    getNextPageParam: (lastPage, allPages) => {
	    // 마지막 페이지의 데이터가 없다면, undefined 반환. 아니면 지금 페이지 + 1 반환.
      if (!lastPage.data.contents.length) return undefined;
      return allPages.length + 1;
    },
    select: (data) => {
      return data.pages.flatMap((page) => page.data.contents);
    },
  });
};
```

#### ItemList\.tsx

```typescript
const {
    data: itemData,
    fetchNextPage: fetchNextItems,
    hasNextPage: hasNextItems,
    isFetchingNextPage: isFetchingNextItems,
    status: itemStatus,
  } = usePaginatedItems();

...
// Intersection Observer API 에서 제공되는 무한 스크롤 훅.
const { ref: lastItemRef, inView } = useInView({
    threshold: 0.1,
  });

// 리액트 컴포넌트의 inView 상태를 모니터링
useEffect(() => {
	if (inView) {
		fetchNextItems?.();
	}
}, [inView]);
...

...
{itemData.map((item, index) => (
	<div key={item.id} ref={index === itemData.length - 1 ? lastItemRef : undefined}>
		<ItemCell item={item} onDelete={handleDeleteItem} onEdit={handleEditItem} />
	</div>
))}
...
```

` useRef ` 를 사용하여 ` fetchNextPage `를 수행할 트리거를 설정해 주면 해당 영역에 도달하였을 때, 즉 ref에 도달 하였을 때 다음 페이지를 불러온다\.

### useInfiniteQuery만을 사용할 때의 한계점

하지만 <strong>무한스크롤만으로는 사용자 경험을 극대화할 수 없다\.</strong>

> 💡 <strong>가정</strong>  사용자가 네트워크 상태가 느릴 경우에, 사용자는 다음 데이터를 보기 위해서 스크롤을 내린다 하자\.
> 
> 트리거에 맞춰 사용자가 다음에 볼 데이터를 그때서야 불러오게 된다면, 사용자는 데이터를 가져오는 시간을 기다려야된다\.
> 
> → 데이터와 사용자간의 딜레이가 생기게 된다\.

이러한 결론으로, 사용자가 현재 보고 있는 데이터 외에 미리 필요한 것은 그 다음 데이터이다\. 그래서 필요한 것이 ` Prefetch `이다\.

### prefetchQuery

데이터가 실제로 필요하기 전에 사전에 데이터를 가져오고 캐시에 저장하는 프로세스를 말한다\. 데이터를 미리 가져와서 필요할 때 데이터를 즉시 사용할 수 있도록 해서 사용자 경험을 개선할 수 있다\.

prefetchQuery를 적용하기 전에 미리 숙지하고 가면 좋을 개념은 다음과 같다\.

<strong>useQueryClient</strong>

: React Query는 내부적으로 queryClient를 사용하여 각종 상태를 저장하고, 부가 기능을 제공한다\.

<strong>prefetchQuery</strong>

:  useQuery와 똑같이 쿼리 함수를 실행해서 서버에서 데이터를 가져오되, 가져와서 캐시에 저장한다\.

<strong>getQueryData</strong>

: QueryKey에 해당하는 데이터를 가져온다\.

그렇다면 InfiniteQuery와 Prefetch는 어떻게 같이 사용할 수 있을까?

### InfiniteQuery와 Prefetch를 같이 사용하는 방법

두개의 개념을 같이 적용할 때의 흐름을 그림으로 그려보면 다음과 같다\.

![](<../../assets/blog/useinfinitequery-prefetching-1d00d0f75cd68058a003e114a5649cff/image-001.jpg>)

![](<../../assets/blog/useinfinitequery-prefetching-1d00d0f75cd68058a003e114a5649cff/image-002.jpg>)

### 코드 설명

#### usePaginatedItems

```typescript
export const usePaginatedItems = (startPage = DEFAULT_INFINITY_SCROLL_START_PAGE, size = DEFAULT_INFINITY_SCROLL_PAGE_SIZE) => {
  const queryClient = useQueryClient();
  const queryKey = ['infiniteItems'];

  const getItemPage = async (page: number) => {
    return await instance.get(`/api/items?page=${page}&size=${size}`);
  };

  const getNextPageParam = (lastPage: any, allPages: any[]) => {
    if (!lastPage.data.contents.length) {
      console.log('마지막 페이지 도달, 가져올 데이터 없음');
      return undefined;
    }
    return allPages.length + 1;
  };

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = startPage }) => getItemPage(pageParam),
    initialPageParam: startPage,
    getNextPageParam,
    select: (data) => {
      return data.pages.flatMap((page) => page.data.contents);
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const fetchNextPage = useCallback(async () => {
    const lastPage = query.data?.pages?.[query.data.pages.length - 1];
    const nextPage = getNextPageParam(lastPage, query.data?.pages || []);

    if (nextPage === undefined) return;

    const cachedData = queryClient.getQueryData([...queryKey, nextPage]);
    console.log(cachedData);

    if (cachedData) {
      console.log('캐시된 데이터에서 가져옵니다.');

      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: [...oldData.pages, cachedData],
          pageParams: [...oldData.pageParams, nextPage],
        };
      });
    } else {
      console.log('캐시된 데이터가 없으므로 Fetch 합니다.');
      await query.fetchNextPage();
    }
  }, [query.data, queryClient, queryKey]);

  useEffect(() => {
    if (!query.data?.pages?.length) return;

    const lastPage = query.data.pages[query.data.pages.length - 1];
    const nextPage = getNextPageParam(lastPage, query.data.pages);

    if (nextPage !== undefined) {
      queryClient.prefetchQuery({
        queryKey: [...queryKey, nextPage],
        queryFn: async () => {
          return getItemPage(nextPage);
        },
        staleTime: 60 * 1000,
      });
    }
  }, [query.data, queryClient, queryKey]);

  return {
    ...query,
    fetchNextPage,
  };
};
```

<strong>fetchNextPage</strong>

fetchNextPage, 다음 페이지를 가져오는 함수에서 쿼리키에 해당되는 데이터, 캐시 데이터가 있는지 먼저 파악한 후 있으면 서버로부터 데이터를 가져오는 query를 실행하지 않고, 캐시 데이터를 가져온다\.

<strong>useEffect</strong>

데이터가 바뀔 경우, 즉 데이터가 추가될 경우에 prefetch를 실행하여 미리 데이터를 가져오는 prefetch를 실행한다\.

### 주의할 점

useInfiniteQuery의 원본 pages·pageParams와 select가 반환하는 표시용 배열을 구분해야 한다\. 평탄화한 배열에서 다시 pages를 읽는 식으로 두 데이터 형태를 혼용하지 않는다\. 아래와 같은 수동 캐시 결합 패턴을 적용할 때는 페이지 번호, 중복 추가, 요청 중 상태를 함께 검증한다\.

### 정리

이렇게 무한 스크롤 \+ prefetch를 같이 사용할 경우 데이터와 사용자 사이의 딜레이가 줄어들기 때문에 사용성이 증가한다\.

### 참고

<a class="notion-resource-card" href="https://velog.io/@imphj3/React-Query-React-Query-%EA%B0%9C%EB%85%90-%EA%B8%B0%EB%B3%B8-%EB%AC%B8%EB%B2%95-%EC%82%AC%EC%9A%A9%EB%B2%95"><span class="notion-resource-label">링크</span><span>https://velog.io/@imphj3/React-Query-React-Query-%EA%B0%9C%EB%85%90-%EA%B8%B0%EB%B3%B8-%EB%AC%B8%EB%B2%95-%EC%82%AC%EC%9A%A9%EB%B2%95</span></a>

import {
  infiniteQueryOptions,
  queryOptions,
  type DefaultError,
  type InfiniteData,
  type UndefinedInitialDataInfiniteOptions,
  type UndefinedInitialDataOptions,
} from "@tanstack/react-query";

import {
  createEntityQueryKeys,
  type EntityId,
  type QueryFilters,
} from "@/lib/query/keys";

type ListKey<
  TNamespace extends string,
  TFilters extends QueryFilters,
> = readonly [TNamespace, "list", TFilters];

type InfiniteKey<
  TNamespace extends string,
  TFilters extends QueryFilters,
> = readonly [TNamespace, "infinite", TFilters];

type DetailKey<TNamespace extends string, TId extends EntityId> = readonly [
  TNamespace,
  "detail",
  TId,
];

export function createEntityQueryFactory<const TNamespace extends string>(
  namespace: TNamespace,
) {
  const keys = createEntityQueryKeys(namespace);

  return {
    keys,
    list: <
      const TFilters extends QueryFilters,
      TQueryFnData,
      TError = DefaultError,
      TData = TQueryFnData,
    >(
      filters: TFilters,
      options: Omit<
        UndefinedInitialDataOptions<
          TQueryFnData,
          TError,
          TData,
          ListKey<TNamespace, TFilters>
        >,
        "queryKey"
      >,
    ) => queryOptions({ ...options, queryKey: keys.list(filters) }),
    infinite: <
      const TFilters extends QueryFilters,
      TQueryFnData,
      TPageParam,
      TError = DefaultError,
      TData = InfiniteData<TQueryFnData, TPageParam>,
    >(
      filters: TFilters,
      options: Omit<
        UndefinedInitialDataInfiniteOptions<
          TQueryFnData,
          TError,
          TData,
          InfiniteKey<TNamespace, TFilters>,
          TPageParam
        >,
        "queryKey"
      >,
    ) => infiniteQueryOptions({ ...options, queryKey: keys.infinite(filters) }),
    detail: <
      const TId extends EntityId,
      TQueryFnData,
      TError = DefaultError,
      TData = TQueryFnData,
    >(
      id: TId,
      options: Omit<
        UndefinedInitialDataOptions<
          TQueryFnData,
          TError,
          TData,
          DetailKey<TNamespace, TId>
        >,
        "queryKey"
      >,
    ) => queryOptions({ ...options, queryKey: keys.detail(id) }),
  };
}

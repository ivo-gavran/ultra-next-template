export type EntityId = number | string;
export type QueryFilters = object;

export function createEntityQueryKeys<const TNamespace extends string>(
  namespace: TNamespace,
) {
  const all = [namespace] as const;

  return {
    all,
    details: () => [...all, "detail"] as const,
    detail: <const TId extends EntityId>(id: TId) =>
      [...all, "detail", id] as const,
    infiniteLists: () => [...all, "infinite"] as const,
    infinite: <const TFilters extends QueryFilters>(filters: TFilters) =>
      [...all, "infinite", filters] as const,
    lists: () => [...all, "list"] as const,
    list: <const TFilters extends QueryFilters>(filters: TFilters) =>
      [...all, "list", filters] as const,
  };
}

import type { QueryClient, QueryKey } from "@tanstack/react-query";

export type OptimisticUpdate = {
  rollback: () => void;
};

export async function optimisticallyUpdateQuery<TData>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  updater: (current: TData) => TData,
): Promise<OptimisticUpdate> {
  await queryClient.cancelQueries({ queryKey, exact: true });

  const previousData = queryClient.getQueryData<TData>(queryKey);

  if (previousData === undefined) return { rollback() {} };

  const before = queryClient.getQueryState(queryKey);
  queryClient.setQueryData<TData>(queryKey, updater(previousData));
  const query = queryClient.getQueryCache().find({ queryKey, exact: true });
  const optimisticState = query?.state;
  let pending = optimisticState !== before;

  return {
    rollback() {
      if (!pending) return;
      pending = false;
      // Any later state transition conservatively relinquishes ownership,
      // including equal-data responses, resets and invalidation.
      // Overlapping mutations must invalidate/refetch after all have settled.
      if (
        queryClient.getQueryCache().find({ queryKey, exact: true }) !== query ||
        query?.state !== optimisticState
      )
        return;

      queryClient.setQueryData<TData>(queryKey, previousData);
    },
  };
}

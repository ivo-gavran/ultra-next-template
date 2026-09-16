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

  if (previousData !== undefined) {
    queryClient.setQueryData<TData>(queryKey, updater(previousData));
  }

  return {
    rollback() {
      if (previousData === undefined) {
        queryClient.removeQueries({ queryKey, exact: true });
        return;
      }

      queryClient.setQueryData<TData>(queryKey, previousData);
    },
  };
}

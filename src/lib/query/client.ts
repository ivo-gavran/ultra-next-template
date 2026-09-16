import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

type CreateQueryClientOptions = {
  notifyError: (error: unknown) => void;
};

export function createQueryClient({ notifyError }: CreateQueryClientOptions) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
    queryCache: new QueryCache({
      onError(error, query) {
        if (!query.meta?.suppressErrorToast) notifyError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _variables, _onMutateResult, mutation) {
        if (!mutation.meta?.suppressErrorToast) notifyError(error);
      },
    }),
  });
}

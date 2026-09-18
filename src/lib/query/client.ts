import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import {
  reportAppError,
  type ErrorReportContext,
} from "@/lib/errors/reporting";

type CreateQueryClientOptions = {
  notifyError: (error: unknown) => void;
  reportError?: (
    error: unknown,
    context: ErrorReportContext,
  ) => void | Promise<void>;
};

function getOperation(key: readonly unknown[] | undefined) {
  const namespace = key?.[0];
  return typeof namespace === "string" ? namespace : undefined;
}

export function createQueryClient({
  notifyError,
  reportError = reportAppError,
}: CreateQueryClientOptions) {
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
        if (!query.meta?.suppressErrorReport) {
          const operation = getOperation(query.queryKey);
          void reportError(error, {
            source: "query",
            ...(operation ? { operation } : {}),
          });
        }
        if (!query.meta?.suppressErrorToast) notifyError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _variables, _onMutateResult, mutation) {
        if (!mutation.meta?.suppressErrorReport) {
          const operation = getOperation(mutation.options.mutationKey);
          void reportError(error, {
            source: "mutation",
            ...(operation ? { operation } : {}),
          });
        }
        if (!mutation.meta?.suppressErrorToast) notifyError(error);
      },
    }),
  });
}

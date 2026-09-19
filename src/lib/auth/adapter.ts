import type { ApiAuthHooks } from "@/lib/api/client";
import type { AppError } from "@/lib/errors";

type Awaitable<T> = T | Promise<T>;

export type AuthAdapter<TSession> = {
  getSession: () => Awaitable<TSession | null>;
  getAccessToken?: (session: TSession) => Awaitable<string | null | undefined>;
  refreshSession?: () => Promise<TSession | null>;
  onUnauthorized?: (error: AppError) => Awaitable<void>;
};

export function createApiAuthHooks<TSession>(
  adapter: AuthAdapter<TSession>,
): ApiAuthHooks {
  return {
    ...(adapter.getAccessToken
      ? {
          getAccessToken: async () => {
            const session = await adapter.getSession();
            return session ? adapter.getAccessToken?.(session) : null;
          },
        }
      : {}),
    ...(adapter.refreshSession
      ? {
          refreshSession: async () => {
            const session = await adapter.refreshSession?.();
            if (!session) throw new Error("Authentication session expired");
          },
        }
      : {}),
    ...(adapter.onUnauthorized
      ? {
          onUnauthorized: (error: AppError) => adapter.onUnauthorized?.(error),
        }
      : {}),
  };
}

import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosAdapter,
  type AxiosRequestConfig,
  type Method,
} from "axios";
import type { z } from "zod";

import { publicEnv } from "@/config/public-env";
import { validatePublicUrl } from "@/config/url-validation";
import { AppError, ErrorCode, isAppError } from "@/lib/errors";
import { reportAppError } from "@/lib/errors/reporting";

const DEFAULT_TIMEOUT_MS = 15_000;

type Awaitable<T> = T | Promise<T>;

export type ApiHeaders = Record<string, string | undefined>;
export type ApiPathParams = Record<string, string | number>;
export type ApiQueryParams = Record<string, unknown>;

export type ApiAuthHooks = {
  getAccessToken?: () => Awaitable<string | null | undefined>;
  refreshSession?: () => Promise<void>;
  onUnauthorized?: (error: AppError) => Awaitable<void>;
};

export type CreateApiClientOptions = {
  baseURL: string;
  timeout?: number;
  /** Bounds shared refresh waiting; a timed-out provider must settle before another refresh. */
  refreshTimeoutMs?: number;
  withCredentials?: boolean;
  getHeaders?: () => Awaitable<ApiHeaders>;
  auth?: ApiAuthHooks;
  adapter?: AxiosAdapter;
};

export type ApiRequestOptions<
  TSchema extends z.ZodType | undefined = undefined,
  TBody = unknown,
> = Pick<AxiosRequestConfig<TBody>, "headers" | "timeout" | "responseType"> & {
  signal?: AbortSignal;
  body?: TBody;
  pathParams?: ApiPathParams;
  query?: ApiQueryParams;
  schema?: TSchema;
  skipAuth?: boolean;
  skipAuthRefresh?: boolean;
};

type ApiResponse<TSchema extends z.ZodType | undefined> =
  TSchema extends z.ZodType ? z.output<TSchema> : undefined;

type InternalRequestConfig = AxiosRequestConfig & {
  authRetryAttempted?: boolean;
  providerHeaderNames?: string[];
  skipAuth?: boolean;
  skipAuthRefresh?: boolean;
};

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

function findErrorCode(value: unknown) {
  return Object.values(ErrorCode).find((candidate) => candidate === value);
}

function getStatusErrorCode(status: number | undefined) {
  if (status === 401) return ErrorCode.Unauthorized;
  if (status === 403) return ErrorCode.Forbidden;
  if (status === 404) return ErrorCode.NotFound;
  return ErrorCode.RequestFailed;
}

function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (!axios.isAxiosError(error)) {
    return new AppError({
      code: ErrorCode.Unexpected,
      message: "An unexpected request error occurred.",
      cause: error,
    });
  }

  if (error.code === "ERR_CANCELED") {
    return new AppError({
      code: ErrorCode.RequestAborted,
      message: "The request was canceled.",
      cause: error,
    });
  }

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return new AppError({
      code: ErrorCode.RequestTimeout,
      message: "The request timed out.",
      cause: error,
    });
  }

  if (!error.response) {
    return new AppError({
      code: ErrorCode.Network,
      message: "The API could not be reached.",
      cause: error,
    });
  }

  const status = error.response.status;
  const body = error.response.data as ErrorBody | null;

  return new AppError({
    code: findErrorCode(body?.error?.code) ?? getStatusErrorCode(status),
    message:
      body?.error?.message ?? `Request failed with status ${String(status)}`,
    status,
    details: body?.error?.details,
    cause: error,
  });
}

function buildPath(path: string, pathParams?: ApiPathParams) {
  return path.replace(
    /(^|\/):([A-Za-z0-9_]+)/g,
    (_match, prefix: string, key: string) => {
      const value = pathParams?.[key];

      if (value === undefined) {
        throw new AppError({
          code: ErrorCode.Validation,
          message: `Missing path parameter: ${key}`,
          details: { parameter: key },
        });
      }

      return prefix + encodeURIComponent(String(value));
    },
  );
}

function reportApiError(error: AppError, method: Method) {
  void reportAppError(error, {
    source: "api",
    operation: method.toUpperCase(),
    metadata: { code: error.code, status: error.status },
  });
}

function invalidDestination(): never {
  throw new AppError({
    code: ErrorCode.Validation,
    message:
      "Request URL must stay within the configured API origin and path prefix.",
  });
}

function createDestinationResolver(baseURL: string) {
  const base = new URL(validatePublicUrl(baseURL, "api"));
  const prefix = base.pathname.replace(/\/+$/, "");
  return (path: string) => {
    // Reject ambiguous URL forms and encoded/nested separators before URL normalization.
    const pathname = path.split("?")[0] ?? "";
    if (
      /[\s\\]/.test(path) ||
      path.startsWith("//") ||
      path.includes("#") ||
      /%(?:2f|5c|25)/i.test(pathname)
    )
      invalidDestination();
    try {
      if (
        pathname.split("/").some((segment) => {
          const decoded = decodeURIComponent(segment);
          return decoded === "." || decoded === "..";
        })
      )
        invalidDestination();
      const absolute = /^[a-z][a-z0-9+.-]*:/i.test(path);
      if (absolute && !/^https?:\/\//i.test(path)) invalidDestination();
      const url = new URL(
        absolute
          ? path
          : `${base.href.replace(/\/+$/, "")}/${path.replace(/^\//, "")}`,
      );
      if (
        url.origin !== base.origin ||
        url.username ||
        url.password ||
        (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`))
      )
        invalidDestination();
      return url.href;
    } catch {
      invalidDestination();
    }
  };
}

function abortedError() {
  return new AppError({
    code: ErrorCode.RequestAborted,
    message: "The request was canceled.",
  });
}

function waitForRefresh(
  promise: Promise<void>,
  signal: InternalRequestConfig["signal"],
) {
  if (signal?.aborted) return Promise.reject(abortedError());
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      cleanup();
      reject(abortedError());
    };
    const cleanup = () => signal?.removeEventListener?.("abort", abort);
    signal?.addEventListener?.("abort", abort, { once: true });
    promise.then(
      () => {
        cleanup();
        resolve();
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
}

export function createApiClient({
  baseURL,
  timeout = DEFAULT_TIMEOUT_MS,
  refreshTimeoutMs = DEFAULT_TIMEOUT_MS,
  withCredentials = false,
  getHeaders,
  auth,
  adapter,
}: CreateApiClientOptions) {
  const resolveDestination = createDestinationResolver(baseURL);
  if (!Number.isFinite(refreshTimeoutMs) || refreshTimeoutMs <= 0) {
    throw new Error("refreshTimeoutMs must be a finite positive duration");
  }
  const instance = axios.create({
    baseURL: validatePublicUrl(baseURL, "api"),
    // Node HTTP and browser Fetch both stop redirects; XHR cannot enforce this.
    adapter: adapter ?? ["http", "fetch"],
    maxRedirects: 0,
    fetchOptions: { redirect: "error" },
    proxy: false,
    timeout,
    withCredentials,
    headers: { Accept: "application/json" },
  });

  let refreshPromise: Promise<void> | undefined;

  instance.interceptors.request.use(async (config) => {
    // Validate before any provider is called or any credential is attached.
    config.url = resolveDestination(config.url ?? "");
    const internal = config as InternalRequestConfig;
    if (config.signal?.aborted) throw abortedError();
    const headers = AxiosHeaders.from(config.headers);
    // Node permits Host overrides; they can route credentials to another virtual host.
    if (headers.has("Host") || headers.has(":authority")) invalidDestination();
    for (const name of internal.providerHeaderNames ?? []) headers.delete(name);
    internal.providerHeaderNames = [];
    const callerHasAuthorization = headers.has("Authorization");

    // Explicit caller headers win. Only provider-injected headers are rebuilt on retry.
    if (!internal.skipAuth) {
      const dynamicHeaders = (await getHeaders?.()) ?? {};
      if (
        Object.entries(dynamicHeaders).some(
          ([name, value]) =>
            value !== undefined && /^(?:host|:authority)$/i.test(name.trim()),
        )
      )
        invalidDestination();
      for (const [name, value] of Object.entries(dynamicHeaders)) {
        if (value !== undefined && !headers.has(name)) {
          headers.set(name, value);
          internal.providerHeaderNames.push(name);
        }
      }
      const accessToken = await auth?.getAccessToken?.();
      if (accessToken && !callerHasAuthorization) {
        headers.set("Authorization", `Bearer ${accessToken}`);
        internal.providerHeaderNames.push("Authorization");
      }
    }
    if (config.signal?.aborted) throw abortedError();
    if (headers.has("Host") || headers.has(":authority")) invalidDestination();
    config.headers = headers;
    return config;
  });

  function notifyUnauthorized(error: AppError) {
    // Sign-out must not extend bounded refresh waiting or replace the request error.
    void Promise.resolve()
      .then(() => auth?.onUnauthorized?.(error))
      .catch((cause: unknown) => {
        void reportAppError(cause, { source: "api" });
      });
  }

  async function refreshSession(
    error: AxiosError,
    signal: InternalRequestConfig["signal"],
  ) {
    if (!auth?.refreshSession) return false;
    if (signal?.aborted) throw abortedError();

    if (!refreshPromise) {
      const unauthorizedError = toAppError(error);
      let timer: ReturnType<typeof setTimeout>;
      const providerRefresh = Promise.resolve().then(() =>
        auth.refreshSession!(),
      );
      const deadline = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("Session refresh timed out.")),
          refreshTimeoutMs,
        );
      });
      const shared = Promise.race([providerRefresh, deadline])
        .catch((cause: unknown) => {
          notifyUnauthorized(unauthorizedError);
          throw new AppError({
            code: ErrorCode.Unauthorized,
            message: unauthorizedError.message,
            status: 401,
            details: unauthorizedError.details,
            cause,
          });
        })
        .finally(() => clearTimeout(timer));
      refreshPromise = shared;
      // Retain a timed-out flight until the underlying provider settles. New callers
      // fail fast instead of starting overlapping refreshes with stale credentials.
      const clearFlight = () => {
        if (refreshPromise === shared) refreshPromise = undefined;
      };
      void providerRefresh.then(clearFlight, clearFlight);
    }

    await waitForRefresh(refreshPromise, signal);
    if (signal?.aborted) throw abortedError();
    return true;
  }

  instance.interceptors.response.use(undefined, async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw toAppError(error);

    const config = error.config as InternalRequestConfig | undefined;
    const canRefresh =
      error.response?.status === 401 &&
      config !== undefined &&
      !config.skipAuthRefresh &&
      !config.skipAuth &&
      !config.authRetryAttempted;

    if (canRefresh) {
      config.authRetryAttempted = true;
      if (await refreshSession(error, config.signal))
        return instance.request(config);
    }

    const appError = toAppError(error);
    if (appError.status === 401 && !config?.skipAuth) {
      notifyUnauthorized(appError);
    }

    throw appError;
  });

  async function request<
    TSchema extends z.ZodType | undefined = undefined,
    TBody = unknown,
  >(
    method: Method,
    path: string,
    {
      body,
      pathParams,
      query,
      schema,
      skipAuth,
      skipAuthRefresh,
      headers,
      timeout: requestTimeout,
      signal,
      responseType,
    }: ApiRequestOptions<TSchema, TBody> = {},
  ): Promise<ApiResponse<TSchema>> {
    try {
      const response = await instance.request<unknown>({
        // Runtime allowlist also protects JavaScript callers and unsafe casts.
        headers,
        timeout: requestTimeout ?? timeout,
        signal,
        responseType,
        method,
        url: resolveDestination(buildPath(path, pathParams)),
        params: query,
        data: body,
        skipAuth,
        skipAuthRefresh,
      } as InternalRequestConfig);

      if (!schema) return undefined as ApiResponse<TSchema>;

      const payload = response.data === "" ? undefined : response.data;
      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        throw new AppError({
          code: ErrorCode.InvalidResponse,
          message: "The server returned an unexpected response.",
          status: response.status,
          details: parsed.error.flatten(),
        });
      }

      return parsed.data as ApiResponse<TSchema>;
    } catch (error) {
      const appError = toAppError(error);
      reportApiError(appError, method);
      throw appError;
    }
  }

  return {
    getUrl(
      path: string,
      options?: Pick<ApiRequestOptions, "pathParams" | "query">,
    ) {
      return resolveDestination(
        instance.getUri({
          url: resolveDestination(buildPath(path, options?.pathParams)),
          params: options?.query,
        }),
      );
    },
    request,
    get: <TSchema extends z.ZodType | undefined = undefined>(
      path: string,
      options?: Omit<ApiRequestOptions<TSchema>, "body">,
    ) => request<TSchema>("GET", path, options),
    post: <TSchema extends z.ZodType | undefined = undefined, TBody = unknown>(
      path: string,
      options?: ApiRequestOptions<TSchema, TBody>,
    ) => request<TSchema, TBody>("POST", path, options),
    put: <TSchema extends z.ZodType | undefined = undefined, TBody = unknown>(
      path: string,
      options?: ApiRequestOptions<TSchema, TBody>,
    ) => request<TSchema, TBody>("PUT", path, options),
    patch: <TSchema extends z.ZodType | undefined = undefined, TBody = unknown>(
      path: string,
      options?: ApiRequestOptions<TSchema, TBody>,
    ) => request<TSchema, TBody>("PATCH", path, options),
    delete: <
      TSchema extends z.ZodType | undefined = undefined,
      TBody = unknown,
    >(
      path: string,
      options?: ApiRequestOptions<TSchema, TBody>,
    ) => request<TSchema, TBody>("DELETE", path, options),
  };
}

export const apiClient = createApiClient({
  baseURL: publicEnv.NEXT_PUBLIC_API_URL,
});

export function getApiUrl(path: string) {
  return apiClient.getUrl(path);
}

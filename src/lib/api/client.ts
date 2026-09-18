import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosAdapter,
  type AxiosRequestConfig,
  type Method,
} from "axios";
import type { z } from "zod";

import { publicEnv } from "@/config/public-env";
import { AppError, ErrorCode, isAppError } from "@/lib/errors";

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
  withCredentials?: boolean;
  getHeaders?: () => Awaitable<ApiHeaders>;
  auth?: ApiAuthHooks;
  adapter?: AxiosAdapter;
};

export type ApiRequestOptions<
  TSchema extends z.ZodType | undefined = undefined,
  TBody = unknown,
> = Omit<
  AxiosRequestConfig<TBody>,
  "baseURL" | "data" | "method" | "params" | "url"
> & {
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
  return path.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = pathParams?.[key];

    if (value === undefined) {
      throw new AppError({
        code: ErrorCode.Validation,
        message: `Missing path parameter: ${key}`,
        details: { parameter: key },
      });
    }

    return encodeURIComponent(String(value));
  });
}

export function createApiClient({
  baseURL,
  timeout = DEFAULT_TIMEOUT_MS,
  withCredentials = false,
  getHeaders,
  auth,
  adapter,
}: CreateApiClientOptions) {
  const instance = axios.create({
    baseURL: baseURL.replace(/\/$/, ""),
    timeout,
    withCredentials,
    headers: { Accept: "application/json" },
    ...(adapter ? { adapter } : {}),
  });

  let refreshPromise: Promise<void> | undefined;

  instance.interceptors.request.use(async (config) => {
    const headers = AxiosHeaders.from(config.headers);
    const dynamicHeaders = (await getHeaders?.()) ?? {};

    for (const [name, value] of Object.entries(dynamicHeaders)) {
      if (value !== undefined && !headers.has(name)) headers.set(name, value);
    }

    const accessToken = (config as InternalRequestConfig).skipAuth
      ? undefined
      : await auth?.getAccessToken?.();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    config.headers = headers;
    return config;
  });

  async function refreshSession(error: AxiosError) {
    if (!auth?.refreshSession) return false;

    if (!refreshPromise) {
      const unauthorizedError = toAppError(error);
      refreshPromise = auth
        .refreshSession()
        .catch(async (refreshError: unknown) => {
          await auth.onUnauthorized?.(unauthorizedError);
          throw new AppError({
            code: ErrorCode.Unauthorized,
            message: unauthorizedError.message,
            details: unauthorizedError.details,
            cause: refreshError,
            ...(unauthorizedError.status === undefined
              ? {}
              : { status: unauthorizedError.status }),
          });
        })
        .finally(() => {
          refreshPromise = undefined;
        });
    }

    await refreshPromise;
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
      if (await refreshSession(error)) return instance.request(config);
    }

    const appError = toAppError(error);
    if (appError.status === 401) {
      await auth?.onUnauthorized?.(appError);
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
      ...config
    }: ApiRequestOptions<TSchema, TBody> = {},
  ): Promise<ApiResponse<TSchema>> {
    const response = await instance.request<unknown>({
      ...config,
      method,
      url: buildPath(path, pathParams),
      params: query,
      data: body,
      skipAuth,
      skipAuthRefresh,
    } as InternalRequestConfig);

    const payload = response.data === "" ? undefined : response.data;
    if (!schema) return undefined as ApiResponse<TSchema>;

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
  }

  return {
    getUrl(
      path: string,
      options?: Pick<ApiRequestOptions, "pathParams" | "query">,
    ) {
      return instance.getUri({
        url: buildPath(path, options?.pathParams),
        params: options?.query,
      });
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

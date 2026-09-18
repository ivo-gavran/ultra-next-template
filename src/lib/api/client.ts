import type { z } from "zod";

import { publicEnv } from "@/config/public-env";
import { AppError, ErrorCode } from "@/lib/errors";

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

type RequestOptions<TSchema extends z.ZodType> = Omit<RequestInit, "body"> & {
  schema: TSchema;
  body?: unknown;
};

export function getApiUrl(path: string) {
  const baseUrl = publicEnv.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const normalizedPath = path.replace(/^\//, "");
  return `${baseUrl}/${normalizedPath}`;
}

export async function apiRequest<TSchema extends z.ZodType>(
  path: string,
  { schema, body, headers, ...init }: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const response = await fetch(getApiUrl(path), {
    ...init,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload as ErrorBody | null;
    const code = Object.values(ErrorCode).find(
      (candidate) => candidate === error?.error?.code,
    );

    throw new AppError({
      code: code ?? ErrorCode.RequestFailed,
      message:
        error?.error?.message ??
        `Request failed with status ${response.status}`,
      status: response.status,
      details: error?.error?.details,
    });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new AppError({
      code: ErrorCode.InvalidResponse,
      message: "The server returned an unexpected response.",
      status: response.status,
      details: parsed.error.flatten(),
    });
  }

  return parsed.data;
}

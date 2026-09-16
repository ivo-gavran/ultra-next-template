import type { z } from "zod";

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = "REQUEST_FAILED",
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions<TSchema extends z.ZodType> = Omit<RequestInit, "body"> & {
  schema: TSchema;
  body?: unknown;
};

export async function apiRequest<TSchema extends z.ZodType>(
  path: string,
  { schema, body, headers, ...init }: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const response = await fetch(path, {
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
    throw new ApiError(
      error?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      error?.error?.code ?? "REQUEST_FAILED",
      error?.error?.details,
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(
      "The server returned an unexpected response.",
      response.status,
      "INVALID_RESPONSE",
      parsed.error.flatten(),
    );
  }

  return parsed.data;
}

import { ErrorCode, isAppError } from "@/lib/errors/app-error";

export const errorMessageKeys = {
  [ErrorCode.CreateFailed]: "createFailed",
  [ErrorCode.Forbidden]: "forbidden",
  [ErrorCode.InvalidResponse]: "invalidResponse",
  [ErrorCode.NotFound]: "notFound",
  [ErrorCode.Network]: "network",
  [ErrorCode.RequestAborted]: "requestAborted",
  [ErrorCode.RequestFailed]: "requestFailed",
  [ErrorCode.RequestTimeout]: "requestTimeout",
  [ErrorCode.Unauthorized]: "unauthorized",
  [ErrorCode.Unexpected]: "unexpected",
  [ErrorCode.Validation]: "validation",
} as const satisfies Record<ErrorCode, string>;

export type ErrorMessageKey = (typeof errorMessageKeys)[ErrorCode];

export function getErrorMessageKey(error: unknown): ErrorMessageKey {
  if (!isAppError(error)) {
    return errorMessageKeys[ErrorCode.Unexpected];
  }

  return errorMessageKeys[error.code];
}

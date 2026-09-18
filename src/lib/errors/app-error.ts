export const ErrorCode = {
  CreateFailed: "CREATE_FAILED",
  InvalidResponse: "INVALID_RESPONSE",
  NotFound: "NOT_FOUND",
  RequestFailed: "REQUEST_FAILED",
  Unauthorized: "UNAUTHORIZED",
  Unexpected: "UNEXPECTED_ERROR",
  Validation: "VALIDATION_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

type AppErrorOptions = {
  code: ErrorCode;
  message?: string;
  status?: number;
  details?: unknown;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number | undefined;
  readonly details: unknown;

  constructor({ code, message, status, details, cause }: AppErrorOptions) {
    super(
      message ?? "An application error occurred.",
      cause === undefined ? undefined : { cause },
    );
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

import { ErrorCode, isAppError } from "@/lib/errors/app-error";

const REDACTED = "[REDACTED]";
const MAX_METADATA_DEPTH = 5;
const MAX_COLLECTION_SIZE = 25;
const MAX_STRING_LENGTH = 1_000;
const sensitiveKeyPattern =
  /authorization|cookie|credential|password|secret|session|token|api[-_]?key/i;

type Awaitable<T> = T | Promise<T>;

export type AppError = Error & { digest?: string };

export type ErrorReportSource =
  | "api"
  | "global-boundary"
  | "mutation"
  | "query"
  | "route-boundary"
  | "server";

export type ErrorReportContext = {
  source: ErrorReportSource;
  operation?: string;
  metadata?: Record<string, unknown>;
};

export type ReportedError = Error & {
  code?: string;
  digest?: string;
  status?: number;
};

export type ErrorReport = {
  context: ErrorReportContext;
  error: ReportedError;
  timestamp: string;
};

export type ErrorReporter = {
  captureException: (report: ErrorReport) => Awaitable<void>;
};

const consoleReporter: ErrorReporter = {
  captureException(report) {
    console.error("Unhandled application error", report);
  },
};

let activeReporter = consoleReporter;
const reportedErrors = new WeakSet<object>();

function sanitizeString(value: string) {
  return value.length <= MAX_STRING_LENGTH
    ? value
    : `${value.slice(0, MAX_STRING_LENGTH)}…`;
}

function sanitizeValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value;
  }

  if (typeof value === "string") return sanitizeString(value);
  if (typeof value === "bigint") return String(value);
  if (typeof value === "undefined") return undefined;
  if (typeof value === "function" || typeof value === "symbol") {
    return String(value);
  }

  if (depth >= MAX_METADATA_DEPTH) return "[MAX_DEPTH]";
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { message: sanitizeString(value.message), name: value.name };
  }
  if (seen.has(value)) return "[CIRCULAR]";

  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_COLLECTION_SIZE)
      .map((item) => sanitizeValue(item, depth + 1, seen));
  }

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, MAX_COLLECTION_SIZE)
      .map(([key, item]) => [
        key,
        sensitiveKeyPattern.test(key)
          ? REDACTED
          : sanitizeValue(item, depth + 1, seen),
      ])
      .filter((entry) => entry[1] !== undefined),
  );
}

export function sanitizeReportMetadata(metadata: Record<string, unknown>) {
  return sanitizeValue(metadata, 0, new WeakSet()) as Record<string, unknown>;
}

function getStringProperty(value: unknown, property: string) {
  if (
    typeof value === "object" &&
    value !== null &&
    property in value &&
    typeof value[property as keyof typeof value] === "string"
  ) {
    return value[property as keyof typeof value] as string;
  }

  return undefined;
}

function getNumberProperty(value: unknown, property: string) {
  if (
    typeof value === "object" &&
    value !== null &&
    property in value &&
    typeof value[property as keyof typeof value] === "number"
  ) {
    return value[property as keyof typeof value] as number;
  }

  return undefined;
}

function createReportedError(error: unknown): ReportedError {
  const message =
    error instanceof Error ? error.message : sanitizeString(String(error));
  const reportedError = new Error(message) as ReportedError;

  reportedError.name =
    error instanceof Error ? error.name : "NonErrorException";
  if (error instanceof Error && error.stack) reportedError.stack = error.stack;

  const code = getStringProperty(error, "code");
  const digest = getStringProperty(error, "digest");
  const status = getNumberProperty(error, "status");

  if (code) reportedError.code = code;
  if (digest) reportedError.digest = digest;
  if (status !== undefined) reportedError.status = status;

  return reportedError;
}

function isExpectedOperationalError(error: unknown, source: ErrorReportSource) {
  if (
    source === "global-boundary" ||
    source === "route-boundary" ||
    source === "server" ||
    !isAppError(error)
  ) {
    return false;
  }

  if (
    error.code === ErrorCode.RequestAborted ||
    error.code === ErrorCode.Unauthorized ||
    error.code === ErrorCode.Forbidden ||
    error.code === ErrorCode.NotFound ||
    error.code === ErrorCode.Validation
  ) {
    return true;
  }

  return (
    error.code === ErrorCode.RequestFailed &&
    error.status !== undefined &&
    error.status < 500
  );
}

export function configureErrorReporter(reporter: ErrorReporter) {
  const previousReporter = activeReporter;
  activeReporter = reporter;

  return () => {
    if (activeReporter === reporter) activeReporter = previousReporter;
  };
}

export async function reportAppError(
  error: unknown,
  context: ErrorReportContext,
) {
  if (isExpectedOperationalError(error, context.source)) return;

  if (typeof error === "object" && error !== null) {
    if (reportedErrors.has(error)) return;
    reportedErrors.add(error);
  }

  const safeContext: ErrorReportContext = {
    source: context.source,
    ...(context.operation ? { operation: context.operation } : {}),
    ...(context.metadata
      ? { metadata: sanitizeReportMetadata(context.metadata) }
      : {}),
  };
  const report: ErrorReport = {
    context: safeContext,
    error: createReportedError(error),
    timestamp: new Date().toISOString(),
  };

  try {
    await activeReporter.captureException(report);
  } catch (reporterError) {
    console.error("Error reporter failed", {
      error: createReportedError(reporterError),
      originalReport: report,
    });
  }
}

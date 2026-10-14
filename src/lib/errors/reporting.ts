import { ErrorCode, isAppError } from "@/lib/errors/app-error";

const controlledCodes = new Set<string>(Object.values(ErrorCode));
const safeErrorNames = new Set([
  "Error",
  "AppError",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "ReferenceError",
  "URIError",
  "EvalError",
  "AggregateError",
]);
const safeOperations = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);
const safeSources = new Set([
  "api",
  "global-boundary",
  "mutation",
  "query",
  "route-boundary",
  "server",
]);
const metadataEnums: Record<string, readonly string[]> = {
  renderSource: [
    "react-server-components",
    "react-server-components-payload",
    "server-rendering",
  ],
  revalidateReason: ["on-demand", "stale"],
  routeType: ["render", "route", "action", "proxy"],
  routerKind: ["Pages Router", "App Router"],
};

type Awaitable<T> = T | Promise<T>;

export type BoundaryError = Error & { digest?: string };

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
  /** Only framework integrations may supply a trusted Next.js numeric digest. */
  trustedDigest?: string;
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

function safeStatus(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 100 &&
    value <= 599
  );
}

/** Closed diagnostic vocabulary: unknown fields and arbitrary text never leave the app. */
export function sanitizeReportMetadata(metadata: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  if (typeof metadata.code === "string" && controlledCodes.has(metadata.code))
    result.code = metadata.code;
  if (safeStatus(metadata.status)) result.status = metadata.status;
  for (const [key, values] of Object.entries(metadataEnums)) {
    const value = metadata[key];
    if (typeof value === "string" && values.includes(value))
      result[key] = value;
  }
  return result;
}

function getProperty(value: unknown, property: string): unknown {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)[property]
    : undefined;
}

function createReportedError(
  error: unknown,
  trustedDigest?: string,
): ReportedError {
  const rawName = error instanceof Error ? error.name : "NonErrorException";
  const name = safeErrorNames.has(rawName)
    ? rawName
    : error instanceof Error
      ? "Error"
      : "NonErrorException";
  const code = getProperty(error, "code");
  const safeCode =
    typeof code === "string" && controlledCodes.has(code) ? code : undefined;
  const message = safeCode
    ? `Application error: ${safeCode}`
    : `Unhandled ${name}`;
  const reportedError = new Error(message) as ReportedError;
  reportedError.name = name;
  // Original stacks can contain message text, URLs, query strings and user data.
  // Keep only a controlled summary, never raw frames or causes.
  reportedError.stack = `${name}: ${message}`;
  if (safeCode) reportedError.code = safeCode;
  if (trustedDigest && /^\d{1,20}$/.test(trustedDigest))
    reportedError.digest = trustedDigest;
  const status = getProperty(error, "status");
  if (safeStatus(status)) reportedError.status = status;
  return reportedError;
}

function createReport(
  error: unknown,
  context: ErrorReportContext,
): ErrorReport {
  return {
    context: {
      source: safeSources.has(context.source) ? context.source : "server",
      ...(context.operation && safeOperations.has(context.operation)
        ? { operation: context.operation }
        : {}),
      ...(context.metadata
        ? { metadata: sanitizeReportMetadata(context.metadata) }
        : {}),
    },
    error: createReportedError(error, context.trustedDigest),
    timestamp: new Date().toISOString(),
  };
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

  const report = createReport(error, context);

  try {
    await activeReporter.captureException(report);
  } catch (reporterError) {
    console.error("Error reporter failed", {
      error: createReportedError(reporterError),
      // A failing adapter may have mutated its input. Rebuild from the source.
      originalReport: createReport(error, context),
    });
  }
}

export type AppError = Error & { digest?: string };

export type ErrorReportContext = {
  boundary: "global" | "route";
};

export function reportAppError(error: AppError, context: ErrorReportContext) {
  console.error("Unhandled application error", {
    boundary: context.boundary,
    digest: error.digest,
    error,
  });
}

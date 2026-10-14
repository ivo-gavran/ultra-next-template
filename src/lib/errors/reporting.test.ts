import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError, ErrorCode } from "@/lib/errors/app-error";
import {
  configureErrorReporter,
  reportAppError,
  sanitizeReportMetadata,
} from "@/lib/errors/reporting";

const restoreCallbacks: Array<() => void> = [];

afterEach(() => {
  restoreCallbacks
    .splice(0)
    .reverse()
    .forEach((restore) => restore());
  vi.restoreAllMocks();
});

describe("reportAppError", () => {
  it("sends a safe error and context through the configured adapter", async () => {
    const captureException = vi.fn();
    restoreCallbacks.push(configureErrorReporter({ captureException }));
    const cause = new Error("Axios request failed");
    const error = new AppError({
      code: ErrorCode.Network,
      message: "API unavailable",
      details: { authorization: "Bearer secret" },
      cause,
    });

    await reportAppError(error, {
      source: "api",
      operation: "GET /items/:id",
      metadata: {
        authorization: "Bearer secret",
        nested: { password: "secret", safe: "value" },
      },
    });

    expect(captureException).toHaveBeenCalledOnce();
    const report = captureException.mock.calls[0]?.[0];
    expect(report).toMatchObject({
      context: {
        source: "api",
        operation: "GET /items/:id",
        metadata: {
          authorization: "[REDACTED]",
          nested: { password: "[REDACTED]", safe: "value" },
        },
      },
      error: {
        code: ErrorCode.Network,
        message: "API unavailable",
        name: "AppError",
      },
    });
    expect(report.error).not.toBe(error);
    expect(report.error).not.toHaveProperty("cause");
    expect(report.error).not.toHaveProperty("details");
  });

  it("does not report expected operational errors outside boundaries", async () => {
    const captureException = vi.fn();
    restoreCallbacks.push(configureErrorReporter({ captureException }));
    const error = new AppError({
      code: ErrorCode.Unauthorized,
      status: 401,
    });

    await reportAppError(error, { source: "query" });

    expect(captureException).not.toHaveBeenCalled();
  });

  it("still reports operational errors that reached an error boundary", async () => {
    const captureException = vi.fn();
    restoreCallbacks.push(configureErrorReporter({ captureException }));
    const error = new AppError({
      code: ErrorCode.NotFound,
      status: 404,
    });

    await reportAppError(error, { source: "route-boundary" });

    expect(captureException).toHaveBeenCalledOnce();
  });

  it("deduplicates the same error across API and query reporting", async () => {
    const captureException = vi.fn();
    restoreCallbacks.push(configureErrorReporter({ captureException }));
    const error = new Error("Request failed");

    await reportAppError(error, { source: "api" });
    await reportAppError(error, { source: "query" });

    expect(captureException).toHaveBeenCalledOnce();
  });

  it("contains reporter failures without replacing the application error", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    restoreCallbacks.push(
      configureErrorReporter({
        captureException: () => {
          throw new Error("Reporter unavailable");
        },
      }),
    );

    await expect(
      reportAppError(new Error("Application failed"), {
        source: "global-boundary",
      }),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "Error reporter failed",
      expect.objectContaining({
        error: expect.objectContaining({ message: "Reporter unavailable" }),
      }),
    );
  });
});

describe("sanitizeReportMetadata", () => {
  it("redacts sensitive keys and handles circular values", () => {
    const metadata: Record<string, unknown> = {
      apiKey: "secret",
      cookie: "session=secret",
    };
    metadata.circular = metadata;

    expect(sanitizeReportMetadata(metadata)).toEqual({
      apiKey: "[REDACTED]",
      cookie: "[REDACTED]",
      circular: "[CIRCULAR]",
    });
  });
});

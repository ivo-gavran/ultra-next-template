import { inspect } from "node:util";

import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError, ErrorCode } from "@/lib/errors/app-error";
import {
  configureErrorReporter,
  reportAppError,
  sanitizeReportMetadata,
} from "@/lib/errors/reporting";

const restoreCallbacks: Array<() => void> = [];
const secrets = [
  "synthetic-bearer-token",
  "synthetic-api-key",
  "synthetic-password",
  "private.person@example.test",
  "opaqueCredential123",
];
const unsafeText = `Bearer ${secrets[0]} api_key=${secrets[1]} password=${secrets[2]} ${secrets[3]} ${secrets[4]}`;
function expectPrivate(value: unknown) {
  const serialized = inspect(value, { depth: null, showHidden: true });
  for (const secret of secrets) expect(serialized).not.toContain(secret);
}

afterEach(() => {
  restoreCallbacks
    .splice(0)
    .reverse()
    .forEach((restore) => restore());
  vi.restoreAllMocks();
});

describe("reportAppError privacy", () => {
  it("retains controlled diagnostics and does not mutate the application error", async () => {
    const captureException = vi.fn();
    restoreCallbacks.push(configureErrorReporter({ captureException }));
    const cause = new Error(unsafeText);
    const error = new AppError({
      code: ErrorCode.Network,
      status: 503,
      message: unsafeText,
      details: { innocent: unsafeText },
      cause,
    });
    error.stack = `${unsafeText}\n at https://user:${secrets[2]}@example.test/${secrets[4]}?key=${secrets[1]}`;
    await reportAppError(error, {
      source: "api",
      operation: "GET",
      trustedDigest: "1234567890",
      metadata: {
        code: ErrorCode.Network,
        status: 503,
        innocent: unsafeText,
        nested: { innocent: unsafeText },
        authorization: unsafeText,
      },
    });
    const report = captureException.mock.calls[0]?.[0];
    expect(report).toMatchObject({
      context: {
        source: "api",
        operation: "GET",
        metadata: { code: ErrorCode.Network, status: 503 },
      },
      error: {
        name: "AppError",
        message: "Application error: NETWORK_ERROR",
        code: ErrorCode.Network,
        status: 503,
        digest: "1234567890",
      },
    });
    expect(report.error).not.toHaveProperty("cause");
    expect(report.error).not.toHaveProperty("details");
    expectPrivate(report);
    expect(error.message).toBe(unsafeText);
    expect(error.cause).toBe(cause);
  });

  it.each([
    new Error(unsafeText),
    unsafeText,
    {
      message: unsafeText,
      code: unsafeText,
      digest: unsafeText,
      name: unsafeText,
    },
  ])(
    "discards arbitrary exception text, names, codes and digests",
    async (error) => {
      const captureException = vi.fn();
      restoreCallbacks.push(configureErrorReporter({ captureException }));
      if (error instanceof Error)
        Object.assign(error, {
          name: unsafeText,
          stack: unsafeText,
          code: unsafeText,
          digest: unsafeText,
        });
      await reportAppError(error, {
        source: "server",
        operation: unsafeText,
        trustedDigest: unsafeText,
        metadata: {
          [unsafeText]: unsafeText,
          safe: [unsafeText, new Error(unsafeText)],
        },
      });
      const report = captureException.mock.calls[0]?.[0];
      expectPrivate(report);
      expect(report.error).not.toHaveProperty("code");
      expect(report.error).not.toHaveProperty("digest");
      expect(report.context).not.toHaveProperty("operation");
    },
  );

  it("retains safe error types but requires explicit trust for digests", async () => {
    const captureException = vi.fn();
    restoreCallbacks.push(configureErrorReporter({ captureException }));
    await reportAppError(
      Object.assign(new TypeError(unsafeText), {
        digest: "12345678",
        status: Infinity,
      }),
      { source: "server" },
    );
    const report = captureException.mock.calls[0]?.[0];
    expect(report.error).toMatchObject({
      name: "TypeError",
      message: "Unhandled TypeError",
    });
    expect(report.error).not.toHaveProperty("digest");
    expect(report.error).not.toHaveProperty("status");
    expectPrivate(report);
  });

  it("the default console reporter follows the same policy", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    await reportAppError(new Error(unsafeText), {
      source: "global-boundary",
      operation: unsafeText,
      metadata: { harmless: unsafeText },
    });
    expect(consoleError).toHaveBeenCalledOnce();
    expectPrivate(consoleError.mock.calls);
  });

  it("contains reporter failures and rebuilds privacy-safe fallback data after adapter mutations", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    restoreCallbacks.push(
      configureErrorReporter({
        captureException(report) {
          report.error.message = unsafeText;
          report.error.stack = unsafeText;
          report.context.metadata = { innocent: unsafeText };
          throw new Error(unsafeText);
        },
      }),
    );
    await expect(
      reportAppError(new Error(unsafeText), {
        source: "global-boundary",
        metadata: { innocent: unsafeText },
      }),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "Error reporter failed",
      expect.objectContaining({
        error: expect.objectContaining({ message: "Unhandled Error" }),
      }),
    );
    expectPrivate(consoleError.mock.calls);
  });

  it.each([
    ErrorCode.RequestAborted,
    ErrorCode.Unauthorized,
    ErrorCode.Forbidden,
    ErrorCode.NotFound,
    ErrorCode.Validation,
    ErrorCode.RequestFailed,
  ])("suppresses expected %s outside boundaries", async (code) => {
    const captureException = vi.fn();
    restoreCallbacks.push(configureErrorReporter({ captureException }));
    await reportAppError(new AppError({ code, status: 400 }), {
      source: "query",
    });
    expect(captureException).not.toHaveBeenCalled();
  });

  it("still reports operational errors that reached an error boundary", async () => {
    const captureException = vi.fn();
    restoreCallbacks.push(configureErrorReporter({ captureException }));
    await reportAppError(
      new AppError({ code: ErrorCode.NotFound, status: 404 }),
      { source: "route-boundary" },
    );
    expect(captureException).toHaveBeenCalledOnce();
  });

  it("deduplicates the same error across API and query reporting", async () => {
    const captureException = vi.fn();
    restoreCallbacks.push(configureErrorReporter({ captureException }));
    const error = new Error(unsafeText);
    await reportAppError(error, { source: "api" });
    await reportAppError(error, { source: "query" });
    expect(captureException).toHaveBeenCalledOnce();
  });
});

describe("sanitizeReportMetadata", () => {
  it("drops arbitrary values regardless of key names and supports cyclic input", () => {
    const metadata: Record<string, unknown> = {
      innocent: unsafeText,
      authorization: unsafeText,
      values: [unsafeText, new Error(unsafeText)],
      callback: () => unsafeText,
      symbol: Symbol(unsafeText),
      bigint: 123n,
      date: new Date(),
      [unsafeText]: true,
      code: ErrorCode.InvalidResponse,
      status: 500,
      renderSource: "server-rendering",
      routeType: "render",
      routerKind: "App Router",
      revalidateReason: "stale",
    };
    metadata.circular = metadata;
    const result = sanitizeReportMetadata(metadata);
    expect(result).toEqual({
      code: ErrorCode.InvalidResponse,
      status: 500,
      renderSource: "server-rendering",
      routeType: "render",
      routerKind: "App Router",
      revalidateReason: "stale",
    });
    expectPrivate(result);
  });

  it("rejects untrusted values even under diagnostic field names", () => {
    expect(
      sanitizeReportMetadata({
        code: unsafeText,
        status: NaN,
        renderSource: unsafeText,
        routeType: unsafeText,
        routerKind: unsafeText,
        revalidateReason: unsafeText,
      }),
    ).toEqual({});
  });
});

// @vitest-environment node

import { inspect } from "node:util";
import { AxiosError, type AxiosAdapter } from "axios";
import { expect, it, vi } from "vitest";

import { createApiClient } from "@/lib/api/client";
import { configureErrorReporter } from "@/lib/errors/reporting";

it("preserves backend error behavior while keeping backend text and request paths out of telemetry", async () => {
  const secrets =
    "Bearer synthetic-token synthetic-api-key private.person@example.test synthetic-password";
  const captureException = vi.fn();
  const restore = configureErrorReporter({ captureException });
  const adapter: AxiosAdapter = async (config) => {
    throw new AxiosError(secrets, "ERR_BAD_RESPONSE", config, undefined, {
      config,
      status: 500,
      statusText: "Failure",
      headers: {},
      data: {
        error: {
          code: "REQUEST_FAILED",
          message: secrets,
          details: { ordinary: secrets },
        },
      },
    });
  };
  try {
    const client = createApiClient({
      baseURL: "https://api.example.test/v1",
      adapter,
      auth: { getAccessToken: () => "synthetic-token" },
    });
    await expect(
      client.get("/private.person@example.test", {
        query: { key: "synthetic-api-key" },
      }),
    ).rejects.toMatchObject({
      message: secrets,
      details: { ordinary: secrets },
      status: 500,
    });
    expect(captureException).toHaveBeenCalledOnce();
    const report = captureException.mock.calls[0]?.[0];
    expect(report.error).toMatchObject({
      message: "Application error: REQUEST_FAILED",
      code: "REQUEST_FAILED",
      status: 500,
    });
    const serialized = inspect(report, { showHidden: true, depth: null });
    for (const secret of [
      "synthetic-token",
      "synthetic-api-key",
      "private.person@example.test",
      "synthetic-password",
    ])
      expect(serialized).not.toContain(secret);
  } finally {
    restore();
  }
});

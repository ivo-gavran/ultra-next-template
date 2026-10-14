import { describe, expect, it, vi } from "vitest";

import { onRequestError } from "@/instrumentation";
import { reportAppError } from "@/lib/errors/reporting";

vi.mock("@/lib/errors/reporting", () => ({
  reportAppError: vi.fn(),
}));

describe("onRequestError", () => {
  it("reports server failures without request headers or concrete URLs", async () => {
    const error = new Error("Server render failed");

    await onRequestError(
      error,
      {
        path: "/en/items?token=secret",
        method: "GET",
        headers: { authorization: "Bearer secret" },
      },
      {
        routerKind: "App Router",
        routePath: "/app/[locale]/items/page",
        routeType: "render",
        renderSource: "server-rendering",
        revalidateReason: undefined,
      },
    );

    expect(reportAppError).toHaveBeenCalledWith(error, {
      source: "server",
      operation: "GET /app/[locale]/items/page",
      metadata: {
        renderSource: "server-rendering",
        revalidateReason: undefined,
        routeType: "render",
        routerKind: "App Router",
      },
    });
  });
});

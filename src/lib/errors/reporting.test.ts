import { describe, expect, it, vi } from "vitest";

import { reportAppError } from "@/lib/errors/reporting";

describe("reportAppError", () => {
  it("sends errors through the central reporting adapter", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const error = Object.assign(new Error("Render failed"), {
      digest: "error-123",
    });

    reportAppError(error, { boundary: "global" });

    expect(consoleError).toHaveBeenCalledWith("Unhandled application error", {
      boundary: "global",
      digest: "error-123",
      error,
    });

    consoleError.mockRestore();
  });
});

import { describe, expect, it, vi } from "vitest";

import { AppError, ErrorCode } from "@/lib/errors";

import { createApiAuthHooks } from "./adapter";

describe("createApiAuthHooks", () => {
  it("reads bearer tokens from the current provider session", async () => {
    const hooks = createApiAuthHooks({
      getSession: () => ({ accessToken: "token" }),
      getAccessToken: (session) => session.accessToken,
    });

    await expect(hooks.getAccessToken?.()).resolves.toBe("token");
  });

  it("does not request a token for an anonymous session", async () => {
    const getAccessToken = vi.fn();
    const hooks = createApiAuthHooks({
      getSession: () => null,
      getAccessToken,
    });

    await expect(hooks.getAccessToken?.()).resolves.toBeNull();
    expect(getAccessToken).not.toHaveBeenCalled();
  });

  it("supports cookie sessions without adding an authorization hook", () => {
    const hooks = createApiAuthHooks({ getSession: () => ({ userId: "1" }) });

    expect(hooks.getAccessToken).toBeUndefined();
  });

  it("rejects an expired refresh and forwards unauthorized handling", async () => {
    const onUnauthorized = vi.fn();
    const hooks = createApiAuthHooks({
      getSession: () => null,
      refreshSession: async () => null,
      onUnauthorized,
    });
    const error = new AppError({
      code: ErrorCode.Unauthorized,
      message: "Unauthorized",
      status: 401,
    });

    await expect(hooks.refreshSession?.()).rejects.toThrow("session expired");
    await hooks.onUnauthorized?.(error);
    expect(onUnauthorized).toHaveBeenCalledWith(error);
  });
});

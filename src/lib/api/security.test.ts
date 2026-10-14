// @vitest-environment node

import { createServer, type Server } from "node:http";
import { once } from "node:events";

import axios, {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createApiClient, type ApiRequestOptions } from "@/lib/api/client";
import { ErrorCode } from "@/lib/errors";

vi.mock("@/lib/errors/reporting", () => ({ reportAppError: vi.fn() }));

const baseURL = "https://api.example.test/v1";
function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function success(config: InternalAxiosRequestConfig) {
  return { config, status: 200, statusText: "OK", data: {}, headers: {} };
}
function unauthorized(config: InternalAxiosRequestConfig): never {
  throw new AxiosError("Denied", "ERR_BAD_REQUEST", config, undefined, {
    config,
    status: 401,
    statusText: "Unauthorized",
    data: {},
    headers: {},
  });
}
afterEach(() => vi.useRealTimers());

describe("API destination confinement", () => {
  it.each([
    "https://evil.example.test/steal",
    "//evil.example.test/steal",
    "https://api.example.test/v10/steal",
    "https://api.example.test/outside",
    "http://api.example.test/v1/steal",
    "https://user:password@api.example.test/v1/items",
    "../steal",
    "/../steal",
    "items/../../steal",
    "items/./one",
    "/%2e%2e/steal",
    "/.%2e/steal",
    "/%252e%252e/steal",
    "/items%2f..%2fsteal",
    "/items%5c..%5csteal",
    "\\\\evil.example.test/steal",
    "https:\\evil.example.test",
    "file:///etc/passwd",
    "ftp://api.example.test/v1/items",
    " https://evil.example.test",
    "/items#secret",
    "/%zz",
  ])(
    "rejects %s before resolving credentials or calling the adapter",
    async (path) => {
      const adapter = vi.fn<AxiosAdapter>(async (config) => success(config));
      const getHeaders = vi.fn(() => ({ "X-Api-Key": "synthetic-api-key" }));
      const getAccessToken = vi.fn(() => "synthetic-bearer-token");
      const client = createApiClient({
        baseURL,
        adapter,
        getHeaders,
        auth: { getAccessToken },
      });
      await expect(
        client.get(path, {
          headers: { Authorization: "Bearer synthetic-caller-token" },
        }),
      ).rejects.toMatchObject({ code: ErrorCode.Validation });
      expect(() => client.getUrl(path)).toThrow();
      expect(adapter).not.toHaveBeenCalled();
      expect(getHeaders).not.toHaveBeenCalled();
      expect(getAccessToken).not.toHaveBeenCalled();
    },
  );

  it("preserves prefixes, same-origin absolute URLs, query values and encoded identifiers", async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => success(config));
    const client = createApiClient({ baseURL: `${baseURL}/`, adapter });
    expect(
      client.getUrl("/items/:id", {
        pathParams: { id: "item one" },
        query: { page: 2 },
      }),
    ).toBe(`${baseURL}/items/item%20one?page=2`);
    expect(client.getUrl(`${baseURL}/items`)).toBe(`${baseURL}/items`);
    await client.get("items");
    expect(adapter.mock.calls[0]?.[0].url).toBe(`${baseURL}/items`);
    expect(
      createApiClient({ baseURL: "http://localhost:4000/v1" }).getUrl("/items"),
    ).toBe("http://localhost:4000/v1/items");
    expect(() => client.getUrl("/:id", { pathParams: { id: ".." } })).toThrow();
  });

  it.each(["Host", ":authority"])(
    "rejects caller %s routing overrides before provider access",
    async (name) => {
      const getAccessToken = vi.fn(() => "synthetic-token");
      const adapter = vi.fn<AxiosAdapter>();
      const client = createApiClient({
        baseURL,
        adapter,
        auth: { getAccessToken },
      });
      await expect(
        client.get("/items", { headers: { [name]: "evil.example.test" } }),
      ).rejects.toMatchObject({ code: ErrorCode.Validation });
      expect(getAccessToken).not.toHaveBeenCalled();
      expect(adapter).not.toHaveBeenCalled();
    },
  );

  it("rejects provider authority overrides before retrieving or attaching bearer credentials", async () => {
    const getAccessToken = vi.fn(() => "synthetic-token");
    const adapter = vi.fn<AxiosAdapter>();
    const client = createApiClient({
      baseURL,
      adapter,
      getHeaders: () => ({
        host: "evil.example.test",
        "X-Api-Key": "synthetic-key",
      }),
      auth: { getAccessToken },
    });
    await expect(client.get("/items")).rejects.toMatchObject({
      code: ErrorCode.Validation,
    });
    expect(getAccessToken).not.toHaveBeenCalled();
    expect(adapter).not.toHaveBeenCalled();
  });

  it("ignores unsafe request-level Axios overrides even from untyped callers", async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      expect(config.url).toBe(`${baseURL}/items`);
      expect(config.baseURL).toBe(baseURL);
      expect(config.maxRedirects).toBe(0);
      expect(config.fetchOptions).toEqual({ redirect: "error" });
      expect(config.proxy).toBe(false);
      expect(config.transport).toBeUndefined();
      expect(config.socketPath).toBeUndefined();
      expect(config.headers.get("Authorization")).toBe(
        "Bearer synthetic-provider-token",
      );
      expect(config.headers.get("X-Api-Key")).toBe("synthetic-custom-secret");
      return success(config);
    });
    const maliciousAdapter = vi.fn<AxiosAdapter>();
    const transform = vi.fn();
    const client = createApiClient({
      baseURL,
      adapter,
      getHeaders: () => ({ "X-Api-Key": "synthetic-custom-secret" }),
      auth: { getAccessToken: () => "synthetic-provider-token" },
    });
    await client.get("/items", {
      baseURL: "https://evil.example.test",
      url: "https://evil.example.test",
      allowAbsoluteUrls: false,
      adapter: maliciousAdapter,
      transport: {},
      socketPath: "/tmp/other-api.sock",
      proxy: { host: "evil.example.test" },
      maxRedirects: 10,
      beforeRedirect: transform,
      transformRequest: [transform],
      fetchOptions: { redirect: "follow" },
      env: { fetch: transform },
      authRetryAttempted: false,
      providerHeaderNames: ["Authorization"],
    } as unknown as ApiRequestOptions);
    expect(adapter).toHaveBeenCalledOnce();
    expect(maliciousAdapter).not.toHaveBeenCalled();
    expect(transform).not.toHaveBeenCalled();
  });

  it.each(["http", "fetch"])(
    "does not forward bearer or custom credentials on %s redirects",
    async (transport) => {
      const received = vi.fn();
      const destination = createServer((req, res) => {
        received(req.headers);
        res.end("{}");
      });
      const origin = createServer((_req, res) => {
        res.writeHead(302, { Location: `${address(destination)}/steal` });
        res.end();
      });
      function address(server: Server) {
        const bound = server.address();
        if (!bound || typeof bound === "string")
          throw new Error("Missing test address");
        return `http://127.0.0.1:${bound.port}`;
      }
      destination.listen(0, "127.0.0.1");
      await once(destination, "listening");
      origin.listen(0, "127.0.0.1");
      await once(origin, "listening");
      try {
        const client = createApiClient({
          baseURL: address(origin),
          ...(transport === "fetch"
            ? { adapter: axios.getAdapter("fetch") }
            : {}),
          getHeaders: () => ({ "X-Custom-Auth": "synthetic-custom-secret" }),
          auth: { getAccessToken: () => "synthetic-bearer-token" },
        });
        await expect(client.get("/redirect")).rejects.toBeDefined();
        expect(received).not.toHaveBeenCalled();
      } finally {
        origin.closeAllConnections();
        destination.closeAllConnections();
        await Promise.all([
          new Promise<void>((resolve) => origin.close(() => resolve())),
          new Promise<void>((resolve) => destination.close(() => resolve())),
        ]);
      }
    },
  );
});

describe("authentication retries", () => {
  it.each([null, undefined, "fresh"])(
    "rebuilds provider credentials when the refreshed token is %s",
    async (fresh) => {
      let token: string | null | undefined = "stale";
      const headers: unknown[] = [];
      const customHeaders: unknown[] = [];
      const refreshSession = vi.fn(async () => {
        token = fresh;
      });
      const adapter: AxiosAdapter = async (config) => {
        headers.push(config.headers.get("Authorization"));
        customHeaders.push(config.headers.get("X-Custom-Auth"));
        if (headers.length === 1) unauthorized(config);
        return success(config);
      };
      const client = createApiClient({
        baseURL,
        adapter,
        getHeaders: () => ({
          "X-Custom-Auth": token ? `key-${token}` : undefined,
        }),
        auth: { getAccessToken: () => token, refreshSession },
      });
      await client.get("/protected");
      expect(headers).toEqual([
        "Bearer stale",
        fresh ? "Bearer fresh" : undefined,
      ]);
      expect(customHeaders).toEqual([
        "key-stale",
        fresh ? "key-fresh" : undefined,
      ]);
      expect(refreshSession).toHaveBeenCalledOnce();
    },
  );

  it("keeps bearer-hook precedence over dynamically provided Authorization", async () => {
    const client = createApiClient({
      baseURL,
      adapter: async (config) => {
        expect(config.headers.get("Authorization")).toBe(
          "Bearer synthetic-hook-token",
        );
        return success(config);
      },
      getHeaders: () => ({ Authorization: "Bearer synthetic-dynamic-token" }),
      auth: { getAccessToken: () => "synthetic-hook-token" },
    });
    await client.get("/protected");
  });

  it("preserves explicit caller authentication headers across a retry", async () => {
    let attempts = 0;
    const adapter: AxiosAdapter = async (config) => {
      expect(config.headers.get("Authorization")).toBe(
        "Bearer synthetic-caller-token",
      );
      expect(config.headers.get("X-Custom-Auth")).toBe("synthetic-caller-key");
      if (++attempts === 1) unauthorized(config);
      return success(config);
    };
    const client = createApiClient({
      baseURL,
      adapter,
      getHeaders: () => ({ "X-Custom-Auth": "provider-key" }),
      auth: {
        getAccessToken: () => "provider-token",
        refreshSession: async () => undefined,
      },
    });
    await client.get("/protected", {
      headers: {
        authorization: "Bearer synthetic-caller-token",
        "X-Custom-Auth": "synthetic-caller-key",
      },
    });
    expect(attempts).toBe(2);
  });

  it("skipAuth bypasses all provider hooks including refresh and sign-out", async () => {
    const getHeaders = vi.fn();
    const getAccessToken = vi.fn();
    const refreshSession = vi.fn();
    const onUnauthorized = vi.fn();
    const adapter: AxiosAdapter = async (config) => {
      expect(config.headers.get("Authorization")).toBe("Bearer caller");
      unauthorized(config);
    };
    const client = createApiClient({
      baseURL,
      adapter,
      getHeaders,
      auth: { getAccessToken, refreshSession, onUnauthorized },
    });
    await expect(
      client.get("/public", {
        skipAuth: true,
        headers: { Authorization: "Bearer caller" },
      }),
    ).rejects.toMatchObject({ status: 401 });
    for (const hook of [
      getHeaders,
      getAccessToken,
      refreshSession,
      onUnauthorized,
    ])
      expect(hook).not.toHaveBeenCalled();
  });

  it.each([
    "final401",
    "missingCredentials",
    "failedRefresh",
    "noRefresh",
    "skipRefresh",
  ])("handles %s without retry loops", async (mode) => {
    let token: string | null = "old";
    const adapter = vi.fn<AxiosAdapter>(async (config) => unauthorized(config));
    const refreshSession = vi.fn(async () => {
      if (mode === "failedRefresh") throw new Error("Failed refresh");
      if (mode === "missingCredentials") token = null;
    });
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      baseURL,
      adapter,
      auth: {
        getAccessToken: () => token,
        ...(mode !== "noRefresh" ? { refreshSession } : {}),
        onUnauthorized,
      },
    });
    await expect(
      client.get("/protected", { skipAuthRefresh: mode === "skipRefresh" }),
    ).rejects.toMatchObject({ code: ErrorCode.Unauthorized, status: 401 });
    expect(adapter).toHaveBeenCalledTimes(
      ["final401", "missingCredentials"].includes(mode) ? 2 : 1,
    );
    expect(refreshSession).toHaveBeenCalledTimes(
      ["noRefresh", "skipRefresh"].includes(mode) ? 0 : 1,
    );
    expect(onUnauthorized).toHaveBeenCalledOnce();
    if (mode === "missingCredentials")
      expect(adapter.mock.calls[1]?.[0].headers.has("Authorization")).toBe(
        false,
      );
  });
});

describe("shared refresh cancellation and bounds", () => {
  it("aborts one waiter immediately while another completes the same refresh", async () => {
    const bothUnauthorized = deferred();
    const refreshStarted = deferred();
    const refresh = deferred();
    let attempts = 0;
    let token = "old";
    const retried: string[] = [];
    const adapter: AxiosAdapter = async (config) => {
      if (token === "old") {
        if (++attempts === 2) bothUnauthorized.resolve();
        unauthorized(config);
      }
      retried.push(config.url!);
      return success(config);
    };
    const refreshSession = vi.fn(() => {
      refreshStarted.resolve();
      return refresh.promise;
    });
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      baseURL,
      adapter,
      auth: { getAccessToken: () => token, refreshSession, onUnauthorized },
    });
    const controller = new AbortController();
    const cancelled = client.get("/cancelled", { signal: controller.signal });
    const cancelledAssertion = expect(cancelled).rejects.toMatchObject({
      code: ErrorCode.RequestAborted,
    });
    const active = client.get("/active");
    await bothUnauthorized.promise;
    await refreshStarted.promise;
    controller.abort();
    await cancelledAssertion;
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(onUnauthorized).not.toHaveBeenCalled();
    token = "fresh";
    refresh.resolve();
    await active;
    expect(retried).toEqual([`${baseURL}/active`]);
  });

  it("does not start refresh or retry for an already aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    const refreshSession = vi.fn();
    const getAccessToken = vi.fn();
    const adapter = vi.fn<AxiosAdapter>();
    const client = createApiClient({
      baseURL,
      adapter,
      auth: { refreshSession, getAccessToken },
    });
    await expect(
      client.get("/protected", { signal: controller.signal }),
    ).rejects.toMatchObject({ code: ErrorCode.RequestAborted });
    expect(adapter).not.toHaveBeenCalled();
    expect(refreshSession).not.toHaveBeenCalled();
    expect(getAccessToken).not.toHaveBeenCalled();
  });

  it("shares a failed refresh across active waiters and removes abort listeners", async () => {
    const bothUnauthorized = deferred();
    const started = deferred();
    const refresh = deferred();
    let attempts = 0;
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      if (++attempts === 2) bothUnauthorized.resolve();
      unauthorized(config);
    });
    const refreshSession = vi.fn(() => {
      started.resolve();
      return refresh.promise;
    });
    const onUnauthorized = vi.fn();
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, "removeEventListener");
    const client = createApiClient({
      baseURL,
      adapter,
      auth: { refreshSession, onUnauthorized },
    });
    const requests = Promise.allSettled([
      client.get("/one", { signal: controller.signal }),
      client.get("/two"),
    ]);
    await bothUnauthorized.promise;
    await started.promise;
    refresh.reject(new Error("Refresh failed"));
    const outcomes = await requests;
    expect(outcomes.every((result) => result.status === "rejected")).toBe(true);
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
  });

  it("bounds a hanging refresh and does not start overlapping provider refreshes", async () => {
    vi.useFakeTimers();
    const refresh = deferred();
    const started = deferred();
    const refreshSession = vi.fn(() => {
      started.resolve();
      return refresh.promise;
    });
    const adapter = vi.fn<AxiosAdapter>(async (config) => unauthorized(config));
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      baseURL,
      adapter,
      refreshTimeoutMs: 50,
      auth: { refreshSession, onUnauthorized },
    });
    const requests = Promise.allSettled([
      client.get("/one"),
      client.get("/two"),
    ]);
    await started.promise;
    await vi.advanceTimersByTimeAsync(50);
    const outcomes = await requests;
    expect(outcomes).toEqual([
      expect.objectContaining({
        status: "rejected",
        reason: expect.objectContaining({ status: 401 }),
      }),
      expect.objectContaining({
        status: "rejected",
        reason: expect.objectContaining({ status: 401 }),
      }),
    ]);
    await expect(client.get("/three")).rejects.toMatchObject({ status: 401 });
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(adapter).toHaveBeenCalledTimes(3);
    refresh.resolve();
  });

  it.each([0, -1, Infinity, NaN])(
    "rejects an unbounded refresh duration %s",
    (refreshTimeoutMs) => {
      expect(() => createApiClient({ baseURL, refreshTimeoutMs })).toThrow(
        "finite positive",
      );
    },
  );

  it("handles synchronous refresh failure and contains sign-out hook failure", async () => {
    const onUnauthorized = vi.fn(() => {
      throw new Error("Sign-out failed");
    });
    const client = createApiClient({
      baseURL,
      adapter: async (config) => unauthorized(config),
      auth: {
        refreshSession: () => {
          throw new Error("Refresh failed");
        },
        onUnauthorized,
      },
    });
    await expect(client.get("/protected")).rejects.toMatchObject({
      status: 401,
    });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});

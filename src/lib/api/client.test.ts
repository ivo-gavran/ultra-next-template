// @vitest-environment node

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { HttpResponse, http } from "msw/http";
import { delay } from "msw/utils/delay";
import { setupServer } from "msw/node";
import { z } from "zod";
import { AxiosError, type AxiosAdapter } from "axios";

import { createApiClient } from "@/lib/api/client";
import { AppError, ErrorCode } from "@/lib/errors";
import { reportAppError } from "@/lib/errors/reporting";

vi.mock("@/lib/errors/reporting", () => ({
  reportAppError: vi.fn(),
}));

const baseURL = "https://api.example.test";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe("createApiClient", () => {
  it("builds path and query params, resolves headers and validates responses", async () => {
    server.use(
      http.get(`${baseURL}/items/:id`, ({ params, request }) => {
        const url = new URL(request.url);
        expect(params.id).toBe("item one");
        expect(url.searchParams.get("page")).toBe("2");
        expect(url.searchParams.getAll("tag[]")).toEqual(["web", "mobile"]);
        expect(request.headers.get("X-App-Version")).toBe("1");
        expect(request.headers.get("Authorization")).toBe("Bearer token");

        return HttpResponse.json({ data: { id: params.id } });
      }),
    );

    const client = createApiClient({
      baseURL: `${baseURL}/`,
      getHeaders: () => ({ "X-App-Version": "1" }),
      auth: { getAccessToken: () => "token" },
    });

    const result = await client.get("/items/:id", {
      pathParams: { id: "item one" },
      query: { page: 2, tag: ["web", "mobile"] },
      schema: z.object({ data: z.object({ id: z.string() }) }),
    });

    expect(result).toEqual({ data: { id: "item one" } });
  });

  it("throws a structured error for unsuccessful requests", async () => {
    server.use(
      http.get(`${baseURL}/items`, () =>
        HttpResponse.json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Sign in first.",
              details: { reason: "expired" },
            },
          },
          { status: 401 },
        ),
      ),
    );

    const client = createApiClient({ baseURL });
    const request = client.get("/items", {
      schema: z.object({ data: z.array(z.unknown()) }),
    });

    await expect(request).rejects.toMatchObject<Partial<AppError>>({
      status: 401,
      code: ErrorCode.Unauthorized,
      message: "Sign in first.",
      details: { reason: "expired" },
    });
  });

  it("rejects successful but malformed responses", async () => {
    server.use(
      http.get(`${baseURL}/items`, () =>
        HttpResponse.json({ data: { wrong: true } }),
      ),
    );

    const client = createApiClient({ baseURL });
    const request = client.get("/items", {
      schema: z.object({ data: z.object({ id: z.string() }) }),
    });

    await expect(request).rejects.toMatchObject({
      code: ErrorCode.InvalidResponse,
    });
    expect(reportAppError).toHaveBeenCalledWith(
      expect.objectContaining({ code: ErrorCode.InvalidResponse }),
      {
        source: "api",
        operation: "GET /items",
        metadata: { code: ErrorCode.InvalidResponse, status: 200 },
      },
    );
  });

  it("supports empty 204 responses", async () => {
    server.use(
      http.delete(
        `${baseURL}/items/:id`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    const client = createApiClient({ baseURL });

    await expect(
      client.delete("/items/:id", { pathParams: { id: "item-1" } }),
    ).resolves.toBeUndefined();
  });

  it("maps an aborted request to a stable error code", async () => {
    server.use(
      http.get(`${baseURL}/slow`, async () => {
        await delay("infinite");
        return HttpResponse.json({ data: true });
      }),
    );

    const client = createApiClient({ baseURL });
    const controller = new AbortController();
    const request = client.get("/slow", {
      signal: controller.signal,
      schema: z.object({ data: z.boolean() }),
    });

    controller.abort();

    await expect(request).rejects.toMatchObject({
      code: ErrorCode.RequestAborted,
    });
  });

  it("maps request timeouts to a stable error code", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.timeout).toBe(5);
      throw new AxiosError("timeout", "ECONNABORTED", config);
    };

    const client = createApiClient({ baseURL, timeout: 5, adapter });

    await expect(
      client.get("/slow", { schema: z.object({ data: z.boolean() }) }),
    ).rejects.toMatchObject({ code: ErrorCode.RequestTimeout });
  });

  it("refreshes one session for concurrent unauthorized requests and retries once", async () => {
    let accessToken = "expired";
    let unauthorizedRequests = 0;
    let releaseRefresh: (() => void) | undefined;

    server.use(
      http.get(`${baseURL}/protected/:id`, ({ request, params }) => {
        if (request.headers.get("Authorization") !== "Bearer fresh") {
          unauthorizedRequests += 1;
          return HttpResponse.json(
            { error: { code: "UNAUTHORIZED", message: "Expired session." } },
            { status: 401 },
          );
        }

        return HttpResponse.json({ data: { id: params.id } });
      }),
    );

    const refreshSession = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseRefresh = () => {
            accessToken = "fresh";
            resolve();
          };
        }),
    );
    const client = createApiClient({
      baseURL,
      auth: {
        getAccessToken: () => accessToken,
        refreshSession,
      },
    });
    const schema = z.object({ data: z.object({ id: z.string() }) });

    const requests = Promise.all([
      client.get("/protected/:id", { pathParams: { id: "one" }, schema }),
      client.get("/protected/:id", { pathParams: { id: "two" }, schema }),
    ]);

    await vi.waitFor(() => expect(unauthorizedRequests).toBe(2));
    expect(refreshSession).toHaveBeenCalledTimes(1);
    releaseRefresh?.();

    await expect(requests).resolves.toEqual([
      { data: { id: "one" } },
      { data: { id: "two" } },
    ]);
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it("notifies auth once when a shared session refresh fails", async () => {
    let unauthorizedRequests = 0;
    const refreshError = new Error("Refresh failed");

    server.use(
      http.get(`${baseURL}/protected`, () => {
        unauthorizedRequests += 1;
        return HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Expired session." } },
          { status: 401 },
        );
      }),
    );

    const onUnauthorized = vi.fn();
    const refreshSession = vi.fn(async () => {
      await vi.waitFor(() => expect(unauthorizedRequests).toBe(2));
      throw refreshError;
    });
    const client = createApiClient({
      baseURL,
      auth: { refreshSession, onUnauthorized },
    });
    const schema = z.object({ data: z.boolean() });

    const results = await Promise.allSettled([
      client.get("/protected", { schema }),
      client.get("/protected", { schema }),
    ]);

    expect(results.every(({ status }) => status === "rejected")).toBe(true);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});

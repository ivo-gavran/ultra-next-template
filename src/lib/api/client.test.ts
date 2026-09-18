import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { apiRequest } from "@/lib/api/client";
import { AppError } from "@/lib/errors";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("returns a response only after schema validation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "project-1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest("/projects", {
      schema: z.object({ data: z.object({ id: z.string() }) }),
    });

    expect(result.data.id).toBe("project-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/projects",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("throws a structured error for unsuccessful requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: "UNAUTHORIZED", message: "Sign in first." },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const request = apiRequest("/projects", {
      schema: z.object({ data: z.array(z.unknown()) }),
    });

    await expect(request).rejects.toMatchObject<Partial<AppError>>({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Sign in first.",
    });
  });

  it("rejects successful but malformed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { wrong: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const request = apiRequest("/projects", {
      schema: z.object({ data: z.object({ id: z.string() }) }),
    });

    await expect(request).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
});

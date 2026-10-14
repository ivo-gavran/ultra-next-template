import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "@/lib/query/client";

describe("createQueryClient", () => {
  it("reports query errors globally", async () => {
    const notifyError = vi.fn();
    const reportError = vi.fn();
    const error = new Error("Query failed");
    const client = createQueryClient({ notifyError, reportError });

    await expect(
      client.fetchQuery({
        queryKey: ["items"],
        queryFn: () => Promise.reject(error),
        retry: false,
      }),
    ).rejects.toBe(error);

    expect(notifyError).toHaveBeenCalledOnce();
    expect(notifyError).toHaveBeenCalledWith(error);
    expect(reportError).toHaveBeenCalledWith(error, {
      source: "query",
      operation: "items",
    });
  });

  it("supports local query error UI without suppressing observability", async () => {
    const notifyError = vi.fn();
    const reportError = vi.fn();
    const client = createQueryClient({ notifyError, reportError });

    await expect(
      client.fetchQuery({
        queryKey: ["items"],
        queryFn: () => Promise.reject(new Error("Query failed")),
        retry: false,
        meta: { suppressErrorToast: true },
      }),
    ).rejects.toThrow("Query failed");

    expect(notifyError).not.toHaveBeenCalled();
    expect(reportError).toHaveBeenCalledOnce();
  });

  it("reports mutation errors globally", async () => {
    const notifyError = vi.fn();
    const reportError = vi.fn();
    const error = new Error("Mutation failed");
    const client = createQueryClient({ notifyError, reportError });
    const mutation = client.getMutationCache().build(client, {
      mutationKey: ["items", "create"],
      mutationFn: () => Promise.reject(error),
    });

    await expect(mutation.execute(undefined)).rejects.toBe(error);

    expect(notifyError).toHaveBeenCalledOnce();
    expect(notifyError).toHaveBeenCalledWith(error);
    expect(reportError).toHaveBeenCalledWith(error, {
      source: "mutation",
      operation: "items",
    });
  });

  it("allows an intentionally handled error to opt out of reporting", async () => {
    const notifyError = vi.fn();
    const reportError = vi.fn();
    const client = createQueryClient({ notifyError, reportError });

    await expect(
      client.fetchQuery({
        queryKey: ["optional"],
        queryFn: () => Promise.reject(new Error("Expected failure")),
        retry: false,
        meta: { suppressErrorReport: true, suppressErrorToast: true },
      }),
    ).rejects.toThrow("Expected failure");

    expect(reportError).not.toHaveBeenCalled();
    expect(notifyError).not.toHaveBeenCalled();
  });
});

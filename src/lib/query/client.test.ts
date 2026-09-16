import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "@/lib/query/client";

describe("createQueryClient", () => {
  it("reports query errors globally", async () => {
    const notifyError = vi.fn();
    const error = new Error("Query failed");
    const client = createQueryClient({ notifyError });

    await expect(
      client.fetchQuery({
        queryKey: ["projects"],
        queryFn: () => Promise.reject(error),
        retry: false,
      }),
    ).rejects.toBe(error);

    expect(notifyError).toHaveBeenCalledOnce();
    expect(notifyError).toHaveBeenCalledWith(error);
  });

  it("supports local query error UI without a duplicate toast", async () => {
    const notifyError = vi.fn();
    const client = createQueryClient({ notifyError });

    await expect(
      client.fetchQuery({
        queryKey: ["projects"],
        queryFn: () => Promise.reject(new Error("Query failed")),
        retry: false,
        meta: { suppressErrorToast: true },
      }),
    ).rejects.toThrow("Query failed");

    expect(notifyError).not.toHaveBeenCalled();
  });

  it("reports mutation errors globally", async () => {
    const notifyError = vi.fn();
    const error = new Error("Mutation failed");
    const client = createQueryClient({ notifyError });
    const mutation = client.getMutationCache().build(client, {
      mutationFn: () => Promise.reject(error),
    });

    await expect(mutation.execute(undefined)).rejects.toBe(error);

    expect(notifyError).toHaveBeenCalledOnce();
    expect(notifyError).toHaveBeenCalledWith(error);
  });
});

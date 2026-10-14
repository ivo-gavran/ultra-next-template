import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { optimisticallyUpdateQuery } from "@/lib/query/optimistic";

describe("optimisticallyUpdateQuery", () => {
  it("updates cached data and can roll it back", async () => {
    const queryClient = new QueryClient();
    const queryKey = ["items", "list", {}] as const;
    queryClient.setQueryData(queryKey, ["one", "two"]);

    const optimisticUpdate = await optimisticallyUpdateQuery<string[]>(
      queryClient,
      queryKey,
      (items) => items.filter((item) => item !== "one"),
    );

    expect(queryClient.getQueryData(queryKey)).toEqual(["two"]);

    optimisticUpdate.rollback();
    expect(queryClient.getQueryData(queryKey)).toEqual(["one", "two"]);
  });

  it("does not create a cache entry when no data is available", async () => {
    const queryClient = new QueryClient();
    const queryKey = ["items", "list", {}] as const;

    const optimisticUpdate = await optimisticallyUpdateQuery<string[]>(
      queryClient,
      queryKey,
      (items) => [...items, "item"],
    );

    expect(queryClient.getQueryState(queryKey)).toBeUndefined();

    optimisticUpdate.rollback();
    expect(queryClient.getQueryState(queryKey)).toBeUndefined();
  });
  it("keeps data arriving after a skipped optimistic update", async () => {
    const client = new QueryClient();
    const update = await optimisticallyUpdateQuery<string[]>(
      client,
      ["items"],
      () => ["optimistic"],
    );
    client.setQueryData(["items"], ["server"]);
    update.rollback();
    expect(client.getQueryData(["items"])).toEqual(["server"]);
  });

  it.each([false, true])(
    "keeps an intervening server response (equal data: %s)",
    async (equal) => {
      const client = new QueryClient();
      client.setQueryData(["items"], ["initial"]);
      const update = await optimisticallyUpdateQuery<string[]>(
        client,
        ["items"],
        () => ["optimistic"],
      );
      await client.fetchQuery({
        queryKey: ["items"],
        queryFn: async () => (equal ? ["optimistic"] : ["server"]),
      });
      update.rollback();
      expect(client.getQueryData(["items"])).toEqual(
        equal ? ["optimistic"] : ["server"],
      );
    },
  );

  it("does not roll back over a later optimistic update or its successful response", async () => {
    const client = new QueryClient();
    client.setQueryData(["items"], ["initial"]);
    const first = await optimisticallyUpdateQuery<string[]>(
      client,
      ["items"],
      (items) => [...items, "first"],
    );
    const second = await optimisticallyUpdateQuery<string[]>(
      client,
      ["items"],
      (items) => [...items, "second"],
    );
    first.rollback();
    expect(client.getQueryData(["items"])).toEqual([
      "initial",
      "first",
      "second",
    ]);
    client.setQueryData(["items"], ["server", "second"]);
    second.rollback();
    first.rollback();
    expect(client.getQueryData(["items"])).toEqual(["server", "second"]);
  });

  it("does not unwind earlier snapshots after the latest mutation rolls back", async () => {
    const client = new QueryClient();
    client.setQueryData(["items"], ["initial"]);
    const first = await optimisticallyUpdateQuery<string[]>(
      client,
      ["items"],
      () => ["first"],
    );
    const second = await optimisticallyUpdateQuery<string[]>(
      client,
      ["items"],
      () => ["second"],
    );
    second.rollback();
    first.rollback();
    expect(client.getQueryData(["items"])).toEqual(["first"]);
    await client.fetchQuery({
      queryKey: ["items"],
      queryFn: async () => ["authoritative"],
    });
    expect(client.getQueryData(["items"])).toEqual(["authoritative"]);
  });

  it("does not restore a removed and recreated query", async () => {
    const client = new QueryClient();
    client.setQueryData(["items"], ["initial"]);
    const update = await optimisticallyUpdateQuery<string[]>(
      client,
      ["items"],
      () => ["optimistic"],
    );
    client.removeQueries({ queryKey: ["items"] });
    client.setQueryData(["items"], ["new"]);
    update.rollback();
    expect(client.getQueryData(["items"])).toEqual(["new"]);
  });
  it("does not restore a stale snapshot after a query reset", async () => {
    const client = new QueryClient();
    client.setQueryData(["items"], ["initial"]);
    const update = await optimisticallyUpdateQuery<string[]>(
      client,
      ["items"],
      () => ["optimistic"],
    );
    await client.resetQueries({ queryKey: ["items"] });
    client.setQueryData(["items"], ["new"]);
    client.setQueryData(["items"], ["newer"]);
    update.rollback();
    expect(client.getQueryData(["items"])).toEqual(["newer"]);
  });

  it("rolls back only once", async () => {
    const client = new QueryClient();
    client.setQueryData(["items"], ["initial"]);
    const update = await optimisticallyUpdateQuery<string[]>(
      client,
      ["items"],
      () => ["optimistic"],
    );
    update.rollback();
    const state = client.getQueryState(["items"]);
    update.rollback();
    expect(client.getQueryState(["items"])).toBe(state);
  });
});

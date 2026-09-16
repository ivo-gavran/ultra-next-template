import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { optimisticallyUpdateQuery } from "@/lib/query/optimistic";

describe("optimisticallyUpdateQuery", () => {
  it("updates cached data and can roll it back", async () => {
    const queryClient = new QueryClient();
    const queryKey = ["projects", "list", {}] as const;
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
    const queryKey = ["projects", "list", {}] as const;

    const optimisticUpdate = await optimisticallyUpdateQuery<string[]>(
      queryClient,
      queryKey,
      (items) => [...items, "project"],
    );

    expect(queryClient.getQueryState(queryKey)).toBeUndefined();

    optimisticUpdate.rollback();
    expect(queryClient.getQueryState(queryKey)).toBeUndefined();
  });
});

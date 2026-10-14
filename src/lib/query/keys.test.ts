import { describe, expect, it } from "vitest";

import { createEntityQueryKeys } from "@/lib/query/keys";

describe("createEntityQueryKeys", () => {
  const keys = createEntityQueryKeys("items");

  it("creates hierarchical keys for targeted invalidation", () => {
    expect(keys.all).toEqual(["items"]);
    expect(keys.lists()).toEqual(["items", "list"]);
    expect(keys.list({ owner: "user-1" })).toEqual([
      "items",
      "list",
      { owner: "user-1" },
    ]);
    expect(keys.details()).toEqual(["items", "detail"]);
    expect(keys.detail("item-1")).toEqual(["items", "detail", "item-1"]);
  });

  it("keeps infinite lists separate from finite lists", () => {
    expect(keys.infiniteLists()).toEqual(["items", "infinite"]);
    expect(keys.infinite({ status: "active" })).toEqual([
      "items",
      "infinite",
      { status: "active" },
    ]);
  });
});

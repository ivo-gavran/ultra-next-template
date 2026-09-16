import { describe, expect, it } from "vitest";

import { createEntityQueryKeys } from "@/lib/query/keys";

describe("createEntityQueryKeys", () => {
  const keys = createEntityQueryKeys("projects");

  it("creates hierarchical keys for targeted invalidation", () => {
    expect(keys.all).toEqual(["projects"]);
    expect(keys.lists()).toEqual(["projects", "list"]);
    expect(keys.list({ owner: "user-1" })).toEqual([
      "projects",
      "list",
      { owner: "user-1" },
    ]);
    expect(keys.details()).toEqual(["projects", "detail"]);
    expect(keys.detail("project-1")).toEqual([
      "projects",
      "detail",
      "project-1",
    ]);
  });

  it("keeps infinite lists separate from finite lists", () => {
    expect(keys.infiniteLists()).toEqual(["projects", "infinite"]);
    expect(keys.infinite({ status: "active" })).toEqual([
      "projects",
      "infinite",
      { status: "active" },
    ]);
  });
});

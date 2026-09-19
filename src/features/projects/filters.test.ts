import { describe, expect, it } from "vitest";

import {
  defaultProjectListFilters,
  readProjectListFilters,
  writeProjectListFilters,
} from "@/features/projects/filters";

describe("project list filters", () => {
  it("reads validated values from URL search parameters", () => {
    const searchParams = new URLSearchParams(
      "search=portal&sort=name-desc&page=2&pageSize=10",
    );

    expect(readProjectListFilters(searchParams)).toEqual({
      search: "portal",
      sort: "name-desc",
      page: 2,
      pageSize: 10,
    });
  });

  it("falls back atomically when a URL value is invalid", () => {
    expect(readProjectListFilters(new URLSearchParams("page=-1"))).toEqual(
      defaultProjectListFilters,
    );
  });

  it("omits defaults and preserves unrelated search parameters", () => {
    const result = writeProjectListFilters(
      new URLSearchParams("ref=docs&search=old&page=4"),
      { ...defaultProjectListFilters, search: "api", page: 2 },
    );

    expect(result.toString()).toBe("ref=docs&search=api&page=2");
  });
});

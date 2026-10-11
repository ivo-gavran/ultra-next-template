import { createLoader, createSerializer } from "nuqs/server";
import { describe, expect, it } from "vitest";

import {
  defaultProjectListFilters,
  projectListFilterParsers,
} from "@/features/projects/filters";

const loadFilters = createLoader(projectListFilterParsers);
const serializeFilters = createSerializer(projectListFilterParsers);

describe("project list filters", () => {
  it("reads validated values from URL search parameters", () => {
    const searchParams = new URLSearchParams(
      "search=portal&sort=name-desc&page=2&pageSize=10",
    );

    expect(loadFilters(searchParams)).toEqual({
      search: "portal",
      sort: "name-desc",
      page: 2,
      pageSize: 10,
    });
  });

  it("uses schema defaults for missing parameters", () => {
    expect(loadFilters(new URLSearchParams())).toEqual(
      defaultProjectListFilters,
    );
  });

  it.each(["-1", "0", "1.5", "2abc", "NaN", "Infinity", ""])(
    "defaults an invalid page (%s) while retaining valid filters",
    (page) => {
      expect(
        loadFilters({ search: "portal", sort: "name-desc", page }),
      ).toEqual({
        ...defaultProjectListFilters,
        search: "portal",
        sort: "name-desc",
      });
    },
  );

  it.each(["0", "51", "2.5", "invalid"])(
    "enforces page size bounds (%s)",
    (pageSize) => {
      expect(loadFilters({ page: "2", pageSize })).toEqual({
        ...defaultProjectListFilters,
        page: 2,
      });
    },
  );

  it("validates sorting and search length without resetting pagination", () => {
    expect(
      loadFilters({ search: "x".repeat(81), sort: "invalid", page: "2" }),
    ).toEqual({
      ...defaultProjectListFilters,
      page: 2,
    });
  });

  it("normalizes search whitespace", () => {
    expect(loadFilters({ search: "  portal  " }).search).toBe("portal");
  });

  it("omits defaults and preserves unrelated search parameters", () => {
    const result = serializeFilters(
      new URLSearchParams("ref=docs&search=old&page=4"),
      { ...defaultProjectListFilters, search: "api", page: 2 },
    );

    expect(result).toBe("?ref=docs&search=api&page=2");
  });

  it("clears managed parameters when they return to defaults", () => {
    expect(
      serializeFilters(
        "?ref=docs&search=api&sort=name-desc&page=2&pageSize=10",
        defaultProjectListFilters,
      ),
    ).toBe("?ref=docs");
  });

  it("round-trips validated filters including encoded search text", () => {
    const filters = {
      search: "portal & API",
      sort: "name-asc" as const,
      page: 2,
      pageSize: 50,
    };
    expect(loadFilters(new URLSearchParams(serializeFilters(filters)))).toEqual(
      filters,
    );
  });
});

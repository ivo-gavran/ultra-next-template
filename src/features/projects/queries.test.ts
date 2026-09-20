import { describe, expect, it } from "vitest";

import { projectKeys, projectQueries } from "@/features/projects/queries";

describe("projectQueries", () => {
  it("uses the shared list cache contract", () => {
    const filters = {
      search: "portal",
      sort: "name-asc" as const,
      page: 2,
      pageSize: 10,
    };

    expect(projectQueries.list(filters).queryKey).toEqual(
      projectKeys.list(filters),
    );
    expect(projectQueries.list(filters).meta).toEqual({
      suppressErrorToast: true,
    });
  });

  it("keeps the summary query under the shared project cache", () => {
    expect(projectQueries.summary().queryKey).toEqual(projectKeys.summary());
    expect(projectQueries.summary().meta).toEqual({
      suppressErrorToast: true,
    });
  });
});

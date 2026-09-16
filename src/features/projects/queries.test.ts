import { describe, expect, it } from "vitest";

import { projectKeys, projectQueries } from "@/features/projects/queries";

describe("projectQueries", () => {
  it("uses the shared list cache contract", () => {
    expect(projectQueries.list().queryKey).toEqual(projectKeys.list({}));
    expect(projectQueries.list().meta).toEqual({
      suppressErrorToast: true,
    });
  });
});

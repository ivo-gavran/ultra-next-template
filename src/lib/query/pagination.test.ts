import { describe, expect, it } from "vitest";

import {
  getNextCursorPageParam,
  getNextNumberedPageParam,
} from "@/lib/query/pagination";

describe("query pagination helpers", () => {
  it("continues cursor pagination while the API returns a cursor", () => {
    expect(getNextCursorPageParam({ nextCursor: "cursor-2" })).toBe("cursor-2");
    expect(getNextCursorPageParam({ nextCursor: null })).toBeUndefined();
  });

  it("continues numbered pagination until the last page", () => {
    expect(getNextNumberedPageParam({ page: 2, totalPages: 4 })).toBe(3);
    expect(
      getNextNumberedPageParam({ page: 4, totalPages: 4 }),
    ).toBeUndefined();
  });
});

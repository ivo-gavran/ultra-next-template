import { describe, expect, it } from "vitest";

import { createEntityQueryFactory } from "@/lib/query/factory";

interface ProjectFilters {
  archived?: boolean;
  owner: string;
}

describe("createEntityQueryFactory", () => {
  const projects = createEntityQueryFactory("projects");

  it("builds native list query options with the shared cache key", () => {
    const filters: ProjectFilters = { owner: "user-1" };
    const options = projects.list(filters, {
      queryFn: async () => [{ id: "project-1" }],
      meta: { suppressErrorToast: true },
      staleTime: 30_000,
    });

    expect(options.queryKey).toEqual(["projects", "list", { owner: "user-1" }]);
    expect(options.meta).toEqual({ suppressErrorToast: true });
    expect(options.staleTime).toBe(30_000);
  });

  it("builds detail query options without hiding TanStack options", () => {
    const options = projects.detail("project-1", {
      enabled: false,
      queryFn: async () => ({ id: "project-1" }),
    });

    expect(options.queryKey).toEqual(["projects", "detail", "project-1"]);
    expect(options.enabled).toBe(false);
  });

  it("keeps infinite queries in a separate key scope", () => {
    const options = projects.infinite(
      { owner: "user-1" },
      {
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam }) => ({
          items: [pageParam],
          nextCursor: "next-page",
        }),
        getNextPageParam: (page) => page.nextCursor,
      },
    );

    expect(options.queryKey).toEqual([
      "projects",
      "infinite",
      { owner: "user-1" },
    ]);
    expect(options.initialPageParam).toBeNull();
    expect(
      options.getNextPageParam?.(
        {
          items: [null],
          nextCursor: "next-page",
        },
        [],
        null,
        [],
      ),
    ).toBe("next-page");
  });
});

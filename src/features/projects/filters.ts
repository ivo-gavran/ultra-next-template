import {
  projectListFiltersSchema,
  type ProjectListFilters,
} from "@/features/projects/schemas";

type SearchParamReader = Pick<URLSearchParams, "get">;

export const defaultProjectListFilters = projectListFiltersSchema.parse({});

export function readProjectListFilters(
  searchParams: SearchParamReader,
): ProjectListFilters {
  const parsed = projectListFiltersSchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  return parsed.success ? parsed.data : defaultProjectListFilters;
}

export function writeProjectListFilters(
  searchParams: URLSearchParams,
  filters: ProjectListFilters,
) {
  const next = new URLSearchParams(searchParams);

  for (const [key, value] of Object.entries(filters)) {
    const defaultValue =
      defaultProjectListFilters[key as keyof ProjectListFilters];

    if (value === defaultValue || value === "") next.delete(key);
    else next.set(key, String(value));
  }

  return next;
}

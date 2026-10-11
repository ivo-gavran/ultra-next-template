import { createParser } from "nuqs/server";
import type { z } from "zod";

import { projectListFiltersSchema } from "@/features/projects/schemas";

export const defaultProjectListFilters = projectListFiltersSchema.parse({});

function createFilterParser<T extends string | number>(
  schema: z.ZodType<T>,
  defaultValue: T,
) {
  return createParser({
    parse: (value) => {
      const parsed = schema.safeParse(value);
      return parsed.success ? parsed.data : null;
    },
    serialize: String,
  }).withDefault(defaultValue);
}

export const projectListFilterParsers = {
  search: createFilterParser(
    projectListFiltersSchema.shape.search,
    defaultProjectListFilters.search,
  ),
  sort: createFilterParser(
    projectListFiltersSchema.shape.sort,
    defaultProjectListFilters.sort,
  ),
  page: createFilterParser(
    projectListFiltersSchema.shape.page,
    defaultProjectListFilters.page,
  ),
  pageSize: createFilterParser(
    projectListFiltersSchema.shape.pageSize,
    defaultProjectListFilters.pageSize,
  ),
};

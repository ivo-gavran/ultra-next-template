import { z } from "zod";

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional(),
});

export const updateProjectSchema = createProjectSchema;

export const projectSortSchema = z.enum([
  "createdAt-desc",
  "createdAt-asc",
  "name-asc",
  "name-desc",
]);

export const projectListFiltersSchema = z.object({
  search: z.string().trim().max(80).default(""),
  sort: projectSortSchema.default("createdAt-desc"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(3),
});

export const projectsPageSchema = z.object({
  items: z.array(projectSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

export const projectsResponseSchema = z.object({ data: projectsPageSchema });

export const projectResponseSchema = z.object({ data: projectSchema });

export const projectsSummarySchema = z.object({
  createdLast30Days: z.number().int().nonnegative(),
  documented: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  updatedLast7Days: z.number().int().nonnegative(),
});

export const projectsSummaryResponseSchema = z.object({
  data: projectsSummarySchema,
});

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectSort = z.infer<typeof projectSortSchema>;
export type ProjectListFilters = z.infer<typeof projectListFiltersSchema>;
export type ProjectsPage = z.infer<typeof projectsPageSchema>;
export type ProjectsSummary = z.infer<typeof projectsSummarySchema>;

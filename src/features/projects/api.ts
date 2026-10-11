"use client";

import { z } from "zod";

import {
  projectResponseSchema,
  projectsResponseSchema,
  projectsSummaryResponseSchema,
  type CreateProjectInput,
  type ProjectListFilters,
  type UpdateProjectInput,
} from "@/features/projects/schemas";
import { apiClient } from "@/lib/api/client";

type RequestContext = {
  signal?: AbortSignal;
};

export function getProjects(
  filters: ProjectListFilters,
  context: RequestContext = {},
) {
  return apiClient.get("/projects", {
    ...context,
    query: filters,
    schema: projectsResponseSchema,
  });
}

export function getProjectsSummary(context: RequestContext = {}) {
  return apiClient.get("/projects/summary", {
    ...context,
    schema: projectsSummaryResponseSchema,
  });
}

export function createProject(input: CreateProjectInput) {
  return apiClient.post("/projects", {
    body: input,
    schema: projectResponseSchema,
  });
}

export function updateProject({
  id,
  ...input
}: UpdateProjectInput & { id: string }) {
  return apiClient.patch("/projects/:id", {
    pathParams: { id },
    body: input,
    schema: projectResponseSchema,
  });
}

export function deleteProject(id: string) {
  return apiClient.delete("/projects/:id", {
    pathParams: { id },
    schema: z.object({ data: z.object({ id: z.string().uuid() }) }),
  });
}

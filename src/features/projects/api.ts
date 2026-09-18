"use client";

import { z } from "zod";

import {
  projectResponseSchema,
  projectsResponseSchema,
  type CreateProjectInput,
} from "@/features/projects/schemas";
import { apiClient } from "@/lib/api/client";

type RequestContext = {
  signal?: AbortSignal;
};

export function getProjects({ signal }: RequestContext = {}) {
  return apiClient.get("/projects", {
    schema: projectsResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function createProject(input: CreateProjectInput) {
  return apiClient.post("/projects", {
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

"use client";

import { z } from "zod";

import {
  projectResponseSchema,
  projectsResponseSchema,
  type CreateProjectInput,
} from "@/features/projects/schemas";
import { apiRequest } from "@/lib/api/client";

export function getProjects() {
  return apiRequest("/api/projects", { schema: projectsResponseSchema });
}

export function createProject(input: CreateProjectInput) {
  return apiRequest("/api/projects", {
    method: "POST",
    body: input,
    schema: projectResponseSchema,
  });
}

export function deleteProject(id: string) {
  return apiRequest(`/api/projects/${id}`, {
    method: "DELETE",
    schema: z.object({ data: z.object({ id: z.string().uuid() }) }),
  });
}

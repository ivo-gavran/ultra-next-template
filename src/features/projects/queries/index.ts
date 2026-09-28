"use client";

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createProject,
  deleteProject,
  getProjects,
  getProjectsSummary,
  updateProject,
} from "@/features/projects/api";
import type {
  ProjectListFilters,
  ProjectsPage,
} from "@/features/projects/schemas";
import { createEntityQueryKeys, optimisticallyUpdateQuery } from "@/lib/query";

const keys = createEntityQueryKeys("projects");

export const projectKeys = {
  ...keys,
  summary: () => [...keys.all, "summary"] as const,
};

export const projectQueries = {
  keys: projectKeys,
  list: (filters: ProjectListFilters) =>
    queryOptions({
      queryKey: projectKeys.list(filters),
      queryFn: async ({ signal }) =>
        (await getProjects(filters, { signal })).data,
      meta: { suppressErrorToast: true },
    }),
  summary: () =>
    queryOptions({
      queryKey: projectKeys.summary(),
      queryFn: async ({ signal }) =>
        (await getProjectsSummary({ signal })).data,
      meta: { suppressErrorToast: true },
    }),
};

export function useProjects(filters: ProjectListFilters) {
  return useQuery(projectQueries.list(filters));
}

export function useProjectsSummary() {
  return useQuery(projectQueries.summary());
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject(filters: ProjectListFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onMutate: async ({ id, ...input }) => {
      const { queryKey } = projectQueries.list(filters);
      return optimisticallyUpdateQuery<ProjectsPage>(
        queryClient,
        queryKey,
        (page) => ({
          ...page,
          items: page.items.map((project) =>
            project.id === id
              ? {
                  ...project,
                  ...input,
                  description: input.description || null,
                  updatedAt: new Date().toISOString(),
                }
              : project,
          ),
        }),
      );
    },
    onError: (_error, _input, optimisticUpdate) => {
      optimisticUpdate?.rollback();
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProject(filters: ProjectListFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onMutate: async (id) => {
      const { queryKey } = projectQueries.list(filters);
      return optimisticallyUpdateQuery<ProjectsPage>(
        queryClient,
        queryKey,
        (page) => ({
          ...page,
          items: page.items.filter((project) => project.id !== id),
          total: Math.max(0, page.total - 1),
        }),
      );
    },
    onError: (_error, _id, optimisticUpdate) => {
      optimisticUpdate?.rollback();
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProject,
  deleteProject,
  getProjects,
} from "@/features/projects/api";
import type { Project } from "@/features/projects/schemas";
import {
  createEntityQueryFactory,
  optimisticallyUpdateQuery,
} from "@/lib/query";

const allProjectFilters = {} as const;
const projectQueryFactory = createEntityQueryFactory("projects");

export const projectKeys = projectQueryFactory.keys;

export const projectQueries = {
  keys: projectKeys,
  list: () =>
    projectQueryFactory.list(allProjectFilters, {
      queryFn: async ({ signal }) => (await getProjects({ signal })).data,
      meta: { suppressErrorToast: true },
    }),
};

export function useProjects() {
  return useQuery(projectQueries.list());
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onMutate: async (id) => {
      const { queryKey } = projectQueries.list();
      return optimisticallyUpdateQuery<Project[]>(
        queryClient,
        queryKey,
        (projects) => projects.filter((project) => project.id !== id),
      );
    },
    onError: (_error, _id, optimisticUpdate) => {
      optimisticUpdate?.rollback();
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

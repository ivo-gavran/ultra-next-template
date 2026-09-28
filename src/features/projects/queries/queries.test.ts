import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createProject,
  deleteProject,
  getProjects,
  getProjectsSummary,
  updateProject,
} from "@/features/projects/api";
import { defaultProjectListFilters as filters } from "@/features/projects/filters";
import {
  projectKeys,
  projectQueries,
  useCreateProject,
  useDeleteProject,
  useProjects,
  useProjectsSummary,
  useUpdateProject,
} from "@/features/projects/queries";
import type { ProjectsPage } from "@/features/projects/schemas";

vi.mock("@/features/projects/api", () => ({
  createProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjects: vi.fn(),
  getProjectsSummary: vi.fn(),
  updateProject: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const cachedPage: ProjectsPage = {
  items: [
    {
      id: "project-1",
      name: "Original",
      description: "Description",
      createdAt: "2026-09-15T09:00:00.000Z",
      updatedAt: "2026-09-15T09:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 3,
  total: 1,
  totalPages: 1,
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(projectKeys.list(filters), cachedPage);
  client.setQueryData(projectKeys.summary(), { total: 1 });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return { client, wrapper };
}

describe("projectQueries", () => {
  it("uses the shared list cache contract", () => {
    const filters = {
      search: "portal",
      sort: "name-asc" as const,
      page: 2,
      pageSize: 10,
    };

    expect(projectQueries.list(filters).queryKey).toEqual(
      projectKeys.list(filters),
    );
    expect(projectQueries.list(filters).meta).toEqual({
      suppressErrorToast: true,
    });
  });

  it("keeps the summary query under the shared project cache", () => {
    expect(projectQueries.summary().queryKey).toEqual(projectKeys.summary());
    expect(projectQueries.summary().meta).toEqual({
      suppressErrorToast: true,
    });
  });
});

describe("project query lifecycle", () => {
  it("loads the list and summary through their API contracts", async () => {
    const { client, wrapper } = setup();
    client.clear();
    const summary = {
      total: 1,
      documented: 1,
      createdLast30Days: 1,
      updatedLast7Days: 1,
    };
    vi.mocked(getProjects).mockResolvedValue({ data: cachedPage });
    vi.mocked(getProjectsSummary).mockResolvedValue({ data: summary });
    const { result } = renderHook(
      () => ({ list: useProjects(filters), summary: useProjectsSummary() }),
      { wrapper },
    );
    await waitFor(() =>
      expect(
        result.current.list.isSuccess && result.current.summary.isSuccess,
      ).toBe(true),
    );
    expect(result.current.list.data).toEqual(cachedPage);
    expect(result.current.summary.data).toEqual(summary);
    expect(getProjects).toHaveBeenCalledWith(filters, {
      signal: expect.any(AbortSignal),
    });
    expect(getProjectsSummary).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
  });

  it("invalidates project lists and summary after creation", async () => {
    const { client, wrapper } = setup();
    vi.mocked(createProject).mockResolvedValue({ data: cachedPage.items[0]! });
    const { result } = renderHook(useCreateProject, { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ name: "Created" });
    });
    expect(createProject).toHaveBeenCalledWith(
      { name: "Created" },
      expect.anything(),
    );
    expect(client.getQueryState(projectKeys.list(filters))?.isInvalidated).toBe(
      true,
    );
    expect(client.getQueryState(projectKeys.summary())?.isInvalidated).toBe(
      true,
    );
  });

  it("rolls back a failed optimistic edit and invalidates derived data", async () => {
    const { client, wrapper } = setup();
    const pending =
      Promise.withResolvers<Awaited<ReturnType<typeof updateProject>>>();
    vi.mocked(updateProject).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useUpdateProject(filters), { wrapper });
    act(() =>
      result.current.mutate({
        id: "project-1",
        name: "Edited",
        description: "",
      }),
    );
    await waitFor(() =>
      expect(
        client.getQueryData<ProjectsPage>(projectKeys.list(filters))?.items[0],
      ).toMatchObject({ name: "Edited", description: null }),
    );
    await act(async () => {
      pending.reject(new Error("Save failed"));
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(projectKeys.list(filters))).toEqual(cachedPage);
    expect(client.getQueryState(projectKeys.summary())?.isInvalidated).toBe(
      true,
    );
  });

  it("rolls back a failed optimistic deletion including the total", async () => {
    const { client, wrapper } = setup();
    const pending =
      Promise.withResolvers<Awaited<ReturnType<typeof deleteProject>>>();
    vi.mocked(deleteProject).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useDeleteProject(filters), { wrapper });
    act(() => result.current.mutate("project-1"));
    await waitFor(() =>
      expect(client.getQueryData(projectKeys.list(filters))).toMatchObject({
        items: [],
        total: 0,
      }),
    );
    await act(async () => {
      pending.reject(new Error("Delete failed"));
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(projectKeys.list(filters))).toEqual(cachedPage);
    expect(client.getQueryState(projectKeys.summary())?.isInvalidated).toBe(
      true,
    );
  });
});

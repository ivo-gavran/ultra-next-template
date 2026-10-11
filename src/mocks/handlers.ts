import { HttpResponse, http } from "msw/http";

import {
  createProjectSchema,
  projectListFiltersSchema,
  updateProjectSchema,
  type Project,
} from "@/features/projects/schemas";
import { getApiUrl } from "@/lib/api/client";
import { ErrorCode } from "@/lib/errors/app-error";

const projectsUrl = getApiUrl("/projects");

function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown,
) {
  return HttpResponse.json({ error: { code, message, details } }, { status });
}

const initialProjects: Project[] = [
  {
    id: "5e8f9e0d-1cd7-41e3-86f4-7c1305c6be76",
    name: "Connect the real API",
    description: "Replace the development mock URL when your backend is ready.",
    createdAt: "2026-09-15T09:00:00.000Z",
    updatedAt: "2026-09-15T09:00:00.000Z",
  },
  {
    id: "ef2062a6-844c-4129-a383-b10fc52e9dc8",
    name: "Invite the first team",
    description: "Exercise the shared mutation and notification patterns.",
    createdAt: "2026-08-19T11:30:00.000Z",
    updatedAt: "2026-08-19T11:30:00.000Z",
  },
  {
    id: "c7520412-474d-4f82-a352-6f938364f9ef",
    name: "Review accessibility",
    description: "Run the browser-level accessibility quality gate.",
    createdAt: "2026-07-04T14:15:00.000Z",
    updatedAt: "2026-07-04T14:15:00.000Z",
  },
  {
    id: "6687c693-5aba-497f-9f1e-9bd998184459",
    name: "Configure observability",
    description: "Connect the provider-neutral reporting boundary.",
    createdAt: "2026-06-21T08:45:00.000Z",
    updatedAt: "2026-06-21T08:45:00.000Z",
  },
];

let projects = initialProjects.map((project) => ({ ...project }));

function buildProjectsSummary() {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  return {
    createdLast30Days: projects.filter(
      ({ createdAt }) => new Date(createdAt).getTime() >= thirtyDaysAgo,
    ).length,
    documented: projects.filter(({ description }) => Boolean(description))
      .length,
    total: projects.length,
    updatedLast7Days: projects.filter(
      ({ updatedAt }) => new Date(updatedAt).getTime() >= sevenDaysAgo,
    ).length,
  };
}

export const handlers = [
  http.get(`${projectsUrl}/summary`, () =>
    HttpResponse.json({ data: buildProjectsSummary() }),
  ),

  http.get(projectsUrl, ({ request }) => {
    const url = new URL(request.url);
    const parsedFilters = projectListFiltersSchema.safeParse({
      search: url.searchParams.get("search") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });

    if (!parsedFilters.success) {
      return errorResponse(ErrorCode.Validation, "Invalid filters.", 400);
    }

    const { search, sort, page, pageSize } = parsedFilters.data;
    const normalizedSearch = search.toLocaleLowerCase();
    const filteredProjects = projects.filter((project) =>
      `${project.name} ${project.description ?? ""}`
        .toLocaleLowerCase()
        .includes(normalizedSearch),
    );
    const sortedProjects = filteredProjects.sort((left, right) => {
      const comparison = sort.startsWith("name-")
        ? left.name.localeCompare(right.name)
        : left.createdAt.localeCompare(right.createdAt);
      return sort.endsWith("-asc") ? comparison : -comparison;
    });
    const total = sortedProjects.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const resolvedPage = Math.min(page, totalPages);
    const start = (resolvedPage - 1) * pageSize;

    return HttpResponse.json({
      data: {
        items: sortedProjects.slice(start, start + pageSize),
        page: resolvedPage,
        pageSize,
        total,
        totalPages,
      },
    });
  }),

  http.post(projectsUrl, async ({ request }) => {
    const parsed = createProjectSchema.safeParse(await request.json());

    if (!parsed.success) {
      return errorResponse(
        ErrorCode.Validation,
        "Check the submitted fields.",
        400,
        parsed.error.flatten(),
      );
    }

    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      description: parsed.data.description || null,
      createdAt: now,
      updatedAt: now,
    };

    projects = [project, ...projects];
    return HttpResponse.json({ data: project }, { status: 201 });
  }),

  http.patch(`${projectsUrl}/:id`, async ({ params, request }) => {
    const project = projects.find(({ id }) => id === params.id);

    if (!project) {
      return errorResponse(ErrorCode.NotFound, "Project not found.", 404);
    }

    const parsed = updateProjectSchema.safeParse(await request.json());

    if (!parsed.success) {
      return errorResponse(
        ErrorCode.Validation,
        "Check the submitted fields.",
        400,
        parsed.error.flatten(),
      );
    }

    const updatedProject: Project = {
      ...project,
      ...parsed.data,
      description: parsed.data.description || null,
      updatedAt: new Date().toISOString(),
    };
    projects = projects.map((candidate) =>
      candidate.id === project.id ? updatedProject : candidate,
    );

    return HttpResponse.json({ data: updatedProject });
  }),

  http.delete(`${projectsUrl}/:id`, ({ params }) => {
    const project = projects.find(({ id }) => id === params.id);

    if (!project) {
      return errorResponse(ErrorCode.NotFound, "Project not found.", 404);
    }

    projects = projects.filter(({ id }) => id !== project.id);
    return HttpResponse.json({ data: { id: project.id } });
  }),
];

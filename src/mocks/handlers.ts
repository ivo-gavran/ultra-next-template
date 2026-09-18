import { HttpResponse, http } from "msw";

import { createProjectSchema, type Project } from "@/features/projects/schemas";
import { getApiUrl } from "@/lib/api/client";

const initialProjects: Project[] = [
  {
    id: "5e8f9e0d-1cd7-41e3-86f4-7c1305c6be76",
    name: "Connect the real API",
    description: "Replace the development mock URL when your backend is ready.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-01-15T09:00:00.000Z",
  },
];

let projects = initialProjects.map((project) => ({ ...project }));

export const handlers = [
  http.get(getApiUrl("/projects"), () => {
    return HttpResponse.json({ data: projects });
  }),

  http.post(getApiUrl("/projects"), async ({ request }) => {
    const parsed = createProjectSchema.safeParse(await request.json());

    if (!parsed.success) {
      return HttpResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Check the submitted fields.",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
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

  http.delete(`${getApiUrl("/projects")}/:id`, ({ params }) => {
    const project = projects.find(({ id }) => id === params.id);

    if (!project) {
      return HttpResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Project not found.",
          },
        },
        { status: 404 },
      );
    }

    projects = projects.filter(({ id }) => id !== project.id);
    return HttpResponse.json({ data: { id: project.id } });
  }),
];

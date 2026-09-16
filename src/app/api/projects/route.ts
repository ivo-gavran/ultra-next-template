import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { createProjectSchema } from "@/features/projects/schemas";
import { apiError, ok } from "@/lib/api/response";

function serializeProject(project: typeof projects.$inferSelect) {
  return {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  }

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, session.user.id))
    .orderBy(desc(projects.createdAt));

  return ok(rows.map(serializeProject));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Check the submitted fields.",
      400,
      parsed.error.flatten(),
    );
  }

  const [project] = await db
    .insert(projects)
    .values({
      ownerId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .returning();

  if (!project) {
    return apiError("CREATE_FAILED", "The project could not be created.", 500);
  }

  return ok(serializeProject(project), { status: 201 });
}

import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { createProjectSchema } from "@/features/projects/schemas";
import { apiError, ok } from "@/lib/api/response";
import { ErrorCode } from "@/lib/errors";

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
    return apiError(ErrorCode.Unauthorized, "Authentication is required.", 401);
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
    return apiError(ErrorCode.Unauthorized, "Authentication is required.", 401);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      ErrorCode.Validation,
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
    return apiError(
      ErrorCode.CreateFailed,
      "The project could not be created.",
      500,
    );
  }

  return ok(serializeProject(project), { status: 201 });
}

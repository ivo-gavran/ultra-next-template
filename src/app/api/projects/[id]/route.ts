import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { apiError, ok } from "@/lib/api/response";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  }

  const { id } = await params;
  const [deleted] = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, session.user.id)))
    .returning({ id: projects.id });

  if (!deleted) {
    return apiError("NOT_FOUND", "Project not found.", 404);
  }

  return ok(deleted);
}

import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { apiError, ok } from "@/lib/api/response";
import { ErrorCode } from "@/lib/errors";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return apiError(ErrorCode.Unauthorized, "Authentication is required.", 401);
  }

  const { id } = await params;
  const [deleted] = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, session.user.id)))
    .returning({ id: projects.id });

  if (!deleted) {
    return apiError(ErrorCode.NotFound, "Project not found.", 404);
  }

  return ok(deleted);
}

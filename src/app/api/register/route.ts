import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { signUpSchema } from "@/features/auth/schemas";
import { apiError, ok } from "@/lib/api/response";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Check the submitted fields.",
      400,
      parsed.error.flatten(),
    );
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existingUser) {
    return apiError(
      "EMAIL_TAKEN",
      "An account with this email already exists.",
      409,
    );
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const [user] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    })
    .returning({ id: users.id, name: users.name, email: users.email });

  return ok(user, { status: 201 });
}

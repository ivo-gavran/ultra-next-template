import { auth } from "@/auth";
import { apiError, ok } from "@/lib/api/response";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  }

  return ok({ user: session.user });
}

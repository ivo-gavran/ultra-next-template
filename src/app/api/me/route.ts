import { auth } from "@/auth";
import { apiError, ok } from "@/lib/api/response";
import { ErrorCode } from "@/lib/errors";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return apiError(ErrorCode.Unauthorized, "Authentication is required.", 401);
  }

  return ok({ user: session.user });
}

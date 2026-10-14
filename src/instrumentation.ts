import type { Instrumentation } from "next";

import { reportAppError } from "@/lib/errors/reporting";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  await reportAppError(error, {
    source: "server",
    operation: request.method,
    ...(typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string"
      ? { trustedDigest: error.digest }
      : {}),
    metadata: {
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
      routeType: context.routeType,
      routerKind: context.routerKind,
    },
  });
};

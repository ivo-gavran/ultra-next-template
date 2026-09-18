import type { Instrumentation } from "next";

import { reportAppError } from "@/lib/errors/reporting";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  await reportAppError(error, {
    source: "server",
    operation: `${request.method} ${context.routePath}`,
    metadata: {
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
      routeType: context.routeType,
      routerKind: context.routerKind,
    },
  });
};

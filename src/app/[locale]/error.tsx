"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { RouteStateShell } from "@/components/layout/route-state-shell";
import { ErrorState } from "@/components/ui/async-state";
import { reportAppError, type BoundaryError } from "@/lib/errors/reporting";

export default function LocaleError({
  error,
  retry,
}: {
  error: BoundaryError;
  retry: () => void;
}) {
  const t = useTranslations("Resilience");

  useEffect(() => {
    void reportAppError(error, { source: "route-boundary" });
  }, [error]);

  return (
    <RouteStateShell>
      <ErrorState
        title={t("errorTitle")}
        description={t("errorDescription")}
        retryLabel={t("retry")}
        onRetry={retry}
      />
      {error.digest && (
        <p className="text-muted-foreground mt-3 text-center font-mono text-xs">
          {t("errorReference", { digest: error.digest })}
        </p>
      )}
    </RouteStateShell>
  );
}

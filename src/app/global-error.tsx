"use client";

import { useEffect } from "react";

import { RouteStateShell } from "@/components/layout/route-state-shell";
import { ErrorState } from "@/components/ui/async-state";
import siteIdentity from "@/config/site-config.json";
import { reportAppError, type AppError } from "@/lib/errors/reporting";

import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: AppError;
  retry: () => void;
}) {
  useEffect(() => {
    void reportAppError(error, { source: "global-boundary" });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <title>{`Something went wrong · ${siteIdentity.name}`}</title>
        <RouteStateShell as="main" className="min-h-screen">
          <ErrorState
            title="Something went wrong."
            description="The application encountered an unexpected error. Try loading it again."
            retryLabel="Try again"
            onRetry={retry}
          />
          {error.digest && (
            <p className="text-muted-foreground mt-3 text-center font-mono text-xs">
              Error reference: {error.digest}
            </p>
          )}
        </RouteStateShell>
      </body>
    </html>
  );
}

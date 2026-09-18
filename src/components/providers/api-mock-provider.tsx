"use client";

import { useEffect, useState } from "react";

import { publicEnv } from "@/config/public-env";

const mockingEnabled = publicEnv.NEXT_PUBLIC_API_MOCKING === "enabled";

export function ApiMockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!mockingEnabled);
  const [startupError, setStartupError] = useState<unknown>();

  useEffect(() => {
    if (!mockingEnabled) return;

    let active = true;

    void import("@/mocks/browser")
      .then(({ startMockWorker }) => startMockWorker())
      .then(() => {
        if (active) setReady(true);
      })
      .catch((error: unknown) => {
        if (active) setStartupError(error);
      });

    return () => {
      active = false;
    };
  }, []);

  if (startupError) throw startupError;
  if (!ready) return null;

  return children;
}

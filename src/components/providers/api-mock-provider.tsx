"use client";

import { useEffect, useState } from "react";

import { publicEnv } from "@/config/public-env";

const mockingEnabled = publicEnv.NEXT_PUBLIC_API_MOCKING === "enabled";
let mockWorkerReady = false;

export function ApiMockProvider({ children }: { children: React.ReactNode }) {
  // Locale navigation remounts this provider; reuse the already running worker
  // so the page does not disappear and reset the user's scroll position.
  const [ready, setReady] = useState(() => !mockingEnabled || mockWorkerReady);
  const [startupError, setStartupError] = useState<unknown>();

  useEffect(() => {
    if (!mockingEnabled) return;

    let active = true;

    void import("@/mocks/browser")
      .then(({ startMockWorker }) => startMockWorker())
      .then(() => {
        mockWorkerReady = true;
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

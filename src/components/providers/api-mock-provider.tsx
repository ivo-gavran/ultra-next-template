"use client";

import { useEffect, useState } from "react";

let mockWorkerReady = false;

export function ApiMockProvider({ children }: { children: React.ReactNode }) {
  // Locale navigation remounts this provider; reuse the already running worker
  // so the page does not disappear and reset the user's scroll position.
  const [ready, setReady] = useState(() => mockWorkerReady);
  const [startupError, setStartupError] = useState<unknown>();

  useEffect(() => {
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

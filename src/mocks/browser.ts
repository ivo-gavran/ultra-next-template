import { setupWorker } from "msw/browser";

import { handlers } from "@/mocks/handlers";

export const worker = setupWorker(...handlers);

let startPromise: Promise<unknown> | undefined;

export function startMockWorker() {
  startPromise ??= worker.start({ onUnhandledRequest: "bypass" });
  return startPromise;
}

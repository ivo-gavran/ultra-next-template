import { defineConfig } from "@playwright/test";

import baseConfig from "./playwright.config";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  ...baseConfig,
  testIgnore: [],
  testMatch: "**/visual.spec.ts",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.001,
    },
  },
  webServer: {
    command: "pnpm build && pnpm start --hostname 127.0.0.1 --port 3100",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_APP_URL: baseURL,
      NEXT_PUBLIC_API_URL: "https://api.example.test",
      NEXT_PUBLIC_API_MOCKING: "enabled",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});

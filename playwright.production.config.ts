import { defineConfig } from "@playwright/test";

import baseConfig from "./playwright.config";

const baseURL = "http://127.0.0.1:3150";

export default defineConfig({
  ...baseConfig,
  testIgnore: [],
  testMatch: [
    "**/production.spec.ts",
    "**/routing.spec.ts",
    "**/metadata.spec.ts",
  ],
  use: { ...baseConfig.use, baseURL },
  webServer: {
    command: "pnpm build && pnpm start --hostname 127.0.0.1 --port 3150",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_APP_URL: baseURL,
      NEXT_PUBLIC_API_URL: "https://api.example.test",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});

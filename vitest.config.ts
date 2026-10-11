import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    env: {
      NEXT_PUBLIC_APP_URL: "https://app.example.test",
      NEXT_PUBLIC_API_URL: "https://api.example.test",
      NEXT_PUBLIC_API_MOCKING: "disabled",
    },
    exclude: [...configDefaults.exclude, "e2e/**"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportOnFailure: true,
      include: [
        "src/components/ui/{async-state,button,data-table,sonner}.tsx",
        "src/components/ui/pagination.tsx",
        "src/config/{security-headers,site}.ts",
        "src/features/projects/{filters,queries}.ts",
        "src/lib/api/client.ts",
        "src/lib/auth/adapter.ts",
        "src/lib/errors/{app-error,messages,reporting}.ts",
        "src/lib/intl/date-locale.ts",
        "src/lib/metadata.ts",
        "src/lib/performance/reporting.ts",
        "src/lib/query/**/*.ts",
        "src/lib/validation/error-map.ts",
      ],
      thresholds: {
        branches: 75,
        functions: 70,
        lines: 80,
        statements: 80,
      },
    },
  },
});

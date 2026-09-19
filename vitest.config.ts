import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    env: {
      NEXT_PUBLIC_APP_URL: "https://ultra.example.test",
      NEXT_PUBLIC_API_URL: "https://api.example.test",
      NEXT_PUBLIC_API_MOCKING: "disabled",
    },
    exclude: [...configDefaults.exclude, "e2e/**"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/components/ui/**/*.tsx", "src/lib/api/client.ts"],
    },
  },
});

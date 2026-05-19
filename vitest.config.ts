import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Excluye los tests de Playwright (E2E) para que Vitest no los ejecute
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["hooks/**", "stores/**", "components/**", "lib/**"],
      exclude: ["**/*.d.ts", "**/__tests__/**"],
      thresholds: { lines: 70, functions: 70 },
    },
  },
});

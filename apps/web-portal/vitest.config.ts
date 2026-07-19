import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: [
      "app/**/*.test.ts",
      "app/**/*.test.tsx",
      "features/**/*.test.ts",
      "features/**/*.test.tsx"
    ]
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  }
});

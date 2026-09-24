import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom gives the tests a DOM to render into. It is not a browser: layout,
    // real focus rings and actual contrast are not testable here — that is what
    // Storybook and a real browser are for.
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test-setup.ts"],
  },
});

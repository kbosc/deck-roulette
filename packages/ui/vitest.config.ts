import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const configDir = fileURLToPath(new URL(".storybook", import.meta.url));

/**
 * Every story, rendered in Chromium in one theme and checked by axe (`a11y.test` in preview).
 * Textures off: axe cannot measure contrast over a background image (see textures-off.css).
 */
function storiesIn(theme: "light" | "dark") {
  return {
    extends: true,
    plugins: [
      tailwindcss(),
      storybookTest({ configDir, initialGlobals: { theme, textures: "off" } }),
    ],
    test: {
      name: `stories (${theme})`,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: "chromium" as const }],
      },
    },
  };
}

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          // jsdom gives the tests a DOM to render into. It is not a browser: layout,
          // real focus rings and actual contrast are checked by the stories projects.
          environment: "jsdom",
          setupFiles: ["./src/test-setup.ts"],
        },
      },
      // jsdom cannot compute rendered colors, so axe skips contrast there: hence a real browser.
      storiesIn("light"),
      storiesIn("dark"),
    ],
  },
});

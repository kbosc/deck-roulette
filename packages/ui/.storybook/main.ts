import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    // Runs axe on every story and reports violations in a panel. It catches the
    // mechanical half of accessibility — contrast, missing names, bad roles —
    // and none of the half that needs a keyboard and a human.
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  framework: "@storybook/react-vite",

  // Nothing about this design system needs to be reported to anyone.
  core: { disableTelemetry: true },
};

export default config;

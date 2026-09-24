import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    // Every story renders on the surface color rather than on Storybook's own
    // white, so a component is never judged against a background it will not
    // meet in the app.
    backgrounds: { disable: true },
    a11y: { test: "error" },
  },

  // The theme switcher: flipping it sets data-theme on the html element, which
  // is exactly what the generated stylesheet reacts to. No component knows.
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },

  decorators: [
    (Story, context) => {
      document.documentElement.dataset["theme"] = String(context.globals["theme"]);
      document.body.style.background = "var(--surface)";
      document.body.style.color = "var(--text)";
      return Story();
    },
  ],
};

export default preview;

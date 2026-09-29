import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import storybook from "eslint-plugin-storybook";
import betterTailwind from "eslint-plugin-better-tailwindcss";
import prettier from "eslint-config-prettier";
import globals from "globals";

/**
 * One flat config for the whole monorepo.
 *
 * Linting is fast enough that splitting it per package would buy nothing but
 * four copies of the same rules to keep in sync.
 */
export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/storybook-static/**", "**/node_modules/**", "**/.turbo/**"],
  },

  js.configs.recommended,

  // Type-aware linting: these rules read the actual types, which is what lets
  // them catch a forgotten await or a condition that is always true. It costs a
  // full typecheck per run, and is worth it.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // `allowDefaultProject` covers the handful of files no tsconfig owns —
        // this config itself. Everything else must belong to a real project, so
        // that type-aware rules actually see types.
        projectService: { allowDefaultProject: ["eslint.config.js"] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // The project bans `any`; the recommended set only warns about it.
      "@typescript-eslint/no-explicit-any": "error",
      // An unused variable is either a leftover or a mistake. `_` prefixed ones
      // are the documented way to say "required by the signature, unused here".
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // `import type` rather than a value import, so the import disappears from
      // the bundle. Required anyway by verbatimModuleSyntax.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "separate-type-imports" },
      ],
    },
  },

  {
    files: ["packages/ui/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat["recommended-latest"], jsxA11y.flatConfigs.recommended],
    languageOptions: { globals: globals.browser },
    settings: {
      // The plugin resolves Tailwind from `cwd`, and Tailwind is a dependency
      // of the ui package rather than of the root. Without it, every Tailwind
      // rule silently disables itself.
      "better-tailwindcss": { entryPoint: "src/styles.css", cwd: "packages/ui" },
    },
    plugins: { "better-tailwindcss": betterTailwind },
    rules: {
      // The last hole in the closed design system: an arbitrary value bypasses
      // the tokens entirely. `bg-[#ff0000]` is valid Tailwind and no amount of
      // theme configuration can stop it — only a lint rule can.
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            {
              pattern: ".*\\[.*\\].*",
              message:
                "Arbitrary values bypass the design tokens. Add a token in packages/tokens instead.",
            },
          ],
        },
      ],
      // A class Tailwind cannot resolve is a typo: `bg-surfce` silently renders
      // nothing at all.
      "better-tailwindcss/no-unknown-classes": "error",
      // Catches `bg-surface bg-action` on the same element, where the winner is
      // decided by the order of the rules in the stylesheet, not by the order
      // in the attribute.
      "better-tailwindcss/no-conflicting-classes": "error",
    },
  },

  {
    files: ["**/*.stories.tsx"],
    extends: [storybook.configs["flat/recommended"]],
  },

  {
    files: ["**/*.{test,spec}.{ts,tsx}"],
    rules: {
      // A test may assert on a deliberately wrong shape.
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },

  {
    files: ["packages/tokens/src/**/*.ts", "**/*.config.{ts,js}", "**/.storybook/**"],
    languageOptions: { globals: globals.node },
  },

  {
    // This config file itself: several ESLint plugins ship no types, so every
    // type-aware rule sees `any` and complains about code that is correct.
    // Linting it without types still catches the mistakes that matter here.
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Last: turns off every rule that would fight the formatter.
  prettier,
);

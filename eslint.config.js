import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import storybook from "eslint-plugin-storybook";
import betterTailwind from "eslint-plugin-better-tailwindcss";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/storybook-static/**", "**/node_modules/**", "**/.turbo/**"],
  },

  js.configs.recommended,

  // Type-aware: costs a typecheck per run, catches forgotten awaits and dead conditions.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Only for files no tsconfig owns (this one): everything else must see real types.
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
      // `_`-prefixed: required by the signature, unused here.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Required by verbatimModuleSyntax.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "separate-type-imports" },
      ],
    },
  },

  // The app too, not only the design system.
  {
    files: ["packages/ui/**/*.{ts,tsx}", "apps/*/src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat["recommended-latest"], jsxA11y.flatConfigs.recommended],
    languageOptions: { globals: globals.browser },
  },

  // One block per package: each has its own compiled stylesheet.
  ...[
    { files: ["packages/ui/**/*.{ts,tsx}"], cwd: "packages/ui" },
    { files: ["apps/web/**/*.{ts,tsx}"], cwd: "apps/web" },
  ].map(({ files, cwd }) => ({
    files,
    plugins: { "better-tailwindcss": betterTailwind },
    settings: {
      // Without it, every Tailwind rule silently disables itself.
      "better-tailwindcss": { entryPoint: "src/styles.css", cwd },
    },
    rules: {
      // `bg-[#ff0000]` bypasses the tokens, and only a lint rule can stop it.
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
      "better-tailwindcss/no-unknown-classes": "error",
      // With two conflicting classes, the stylesheet order decides, not the attribute's.
      "better-tailwindcss/no-conflicting-classes": "error",
    },
  })),

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
    // Several plugins ship no types: type-aware rules would flag correct code here.
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Last: turns off every rule that would fight the formatter.
  prettier,
);

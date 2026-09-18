/**
 * Turns the token JSON into CSS custom properties.
 *
 * Kept free of any file access so it can be tested on plain objects: the build
 * script below is the only part that touches the disk.
 */

/** Any node of a DTCG file: either a leaf carrying `$value`, or a nested group. */
type TokenNode = { readonly $value?: string | number } & {
  readonly [key: string]: unknown;
};

export type TokenTree = Readonly<Record<string, unknown>>;

/** `{color.violet.600}` -> `var(--color-violet-600)`. */
const ALIAS = /\{([\w.-]+)\}/g;

/** One CSS custom property, already named and resolved. */
export type CssVariable = { readonly name: string; readonly value: string };

function isLeaf(node: unknown): node is Required<Pick<TokenNode, "$value">> {
  return typeof node === "object" && node !== null && "$value" in node;
}

/**
 * Walks a token tree and flattens it into CSS variable names.
 *
 * The variable name is the path to the token: `font.size.base` becomes
 * `--font-size-base`. Keys starting with `$` are metadata, never tokens.
 */
export function flatten(tree: TokenTree, prefix: readonly string[] = []): readonly CssVariable[] {
  const variables: CssVariable[] = [];

  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith("$")) {
      continue;
    }

    const path = [...prefix, key];

    if (isLeaf(node)) {
      variables.push({ name: `--${path.join("-")}`, value: toCssValue(node.$value) });
      continue;
    }

    if (typeof node === "object" && node !== null) {
      variables.push(...flatten(node as TokenTree, path));
    }
  }

  return variables;
}

/**
 * Rewrites DTCG aliases as `var()` calls.
 *
 * The indirection is kept rather than resolved to a final color: the browser
 * inspector then shows `var(--color-violet-600)` instead of an anonymous hex,
 * which is the whole point of naming things in the first place.
 */
export function toCssValue(value: string | number): string {
  return String(value).replace(ALIAS, (_, path: string) => `var(--${path.replaceAll(".", "-")})`);
}

function declarations(variables: readonly CssVariable[], indent: string): string {
  return variables.map(({ name, value }) => `${indent}${name}: ${value};`).join("\n");
}

export type Themes = {
  readonly light: TokenTree;
  readonly dark: TokenTree;
};

/**
 * Assembles the stylesheet.
 *
 * The dark theme is declared twice on purpose:
 *
 * - under `prefers-color-scheme`, guarded by `:not([data-theme="light"])`, so
 *   the system preference applies unless the user explicitly picked light;
 * - under `[data-theme="dark"]`, so an explicit choice wins over the system.
 *
 * Declaring it only in the media query would make a light-mode toggle useless
 * for anyone whose system is dark.
 */
export function buildCss(primitives: readonly TokenTree[], themes: Themes): string {
  const primitiveVariables = primitives.flatMap((tree) => flatten(tree));
  const light = flatten(themes.light);
  const dark = flatten(themes.dark);

  return `/* Generated from the JSON in packages/tokens. Do not edit by hand. */

:root {
  color-scheme: light;

${declarations(primitiveVariables, "  ")}

${declarations(light, "  ")}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;

${declarations(dark, "    ")}
  }
}

:root[data-theme="dark"] {
  color-scheme: dark;

${declarations(dark, "  ")}
}
`;
}

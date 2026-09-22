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

/**
 * Our primitive names, mapped onto the namespaces Tailwind derives utilities
 * from. Longest prefix first: `--font-size-` must win over `--font-`.
 *
 * Anything absent from this table stays a plain custom property, usable in
 * hand-written CSS but producing no utility class. That is the case for the
 * mana colors and the animation durations: neither belongs in a `bg-*` or a
 * `p-*`.
 */
const NAMESPACES: ReadonlyArray<readonly [ours: string, tailwind: string]> = [
  ["--font-line-height-", "--leading-"],
  ["--font-family-", "--font-"],
  ["--font-weight-", "--font-weight-"],
  ["--font-size-", "--text-"],
  ["--space-", "--spacing-"],
  ["--radius-", "--radius-"],
  ["--shadow-", "--shadow-"],
  ["--easing-", "--ease-"],
];

/**
 * The namespaces we take over entirely.
 *
 * `--spacing` on its own is Tailwind's dynamic multiplier: leaving it in place
 * would keep `p-7` compiling out of a scale that deliberately has no 7.
 */
const CLEARED: readonly string[] = [
  "--color-*",
  "--spacing-*",
  "--spacing",
  "--radius-*",
  "--text-*",
  "--font-*",
  "--font-weight-*",
  "--leading-*",
  "--shadow-*",
  "--ease-*",
];

function toTailwindName(name: string): string | undefined {
  for (const [ours, tailwind] of NAMESPACES) {
    if (name.startsWith(ours)) {
      return `${tailwind}${name.slice(ours.length)}`;
    }
  }
  return undefined;
}

/**
 * Maps our semantic roles onto the names Tailwind expects.
 *
 * Tailwind 4 is configured in CSS: a variable declared in `@theme` under its
 * `--color-*` namespace produces the matching `bg-*`, `text-*` and `border-*`
 * utilities. Our own tokens deliberately avoid that prefix — `--surface` rather
 * than `--color-surface` — because a variable cannot be defined in terms of
 * itself.
 *
 * `@theme inline` is what makes the themes work: it inlines the reference, so a
 * utility resolves to `var(--surface)` at use time and follows whichever theme
 * is active. A plain `@theme` would freeze the light value into the utility.
 *
 * `--color-*: initial` first clears Tailwind's built-in palette: the design
 * system owns the colors, and a stray `bg-red-500` should not compile.
 */
export function buildTailwindTheme(
  primitives: readonly TokenTree[],
  roles: readonly string[],
): string {
  const cleared = CLEARED.map((namespace) => `  ${namespace}: initial;`).join("\n");

  const mapped = primitives
    .flatMap((tree) => flatten(tree))
    .flatMap(({ name, value }) => {
      const tailwind = toTailwindName(name);
      return tailwind === undefined ? [] : [`  ${tailwind}: ${value};`];
    })
    .join("\n");

  const themed = roles.map((role) => `  --color-${role}: var(--${role});`).join("\n");

  return `/* Generated from the JSON in packages/tokens. Do not edit by hand. */

@theme {
${cleared}

${mapped}
}

@theme inline {
${themed}
}
`;
}

/** The role names a theme declares, metadata aside. */
export function roleNames(theme: TokenTree): readonly string[] {
  return Object.keys(theme).filter((key) => !key.startsWith("$"));
}

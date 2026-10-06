/** No file access here, so that it can be tested on plain objects. */

type TokenNode = { readonly $value?: string | number } & {
  readonly [key: string]: unknown;
};

export type TokenTree = Readonly<Record<string, unknown>>;

/** `{color.violet.600}` -> `var(--color-violet-600)`. */
const ALIAS = /\{([\w.-]+)\}/g;

export type CssVariable = { readonly name: string; readonly value: string };

function isLeaf(node: unknown): node is Required<Pick<TokenNode, "$value">> {
  return typeof node === "object" && node !== null && "$value" in node;
}

/** `font.size.base` -> `--font-size-base`. Keys starting with `$` are metadata. */
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

/** Kept as `var()` rather than resolved, so the inspector shows names, not hexes. */
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
 * The dark theme is declared twice on purpose: in the media query (unless light
 * was picked) and under `[data-theme="dark"]`, so an explicit choice always wins.
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
 * Longest prefix first: `--font-size-` must win over `--font-`. Anything absent
 * (mana colors, durations) stays a plain custom property, with no utility class.
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

/** `--spacing` is Tailwind's multiplier: left in place, `p-7` would compile. */
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
 * Our roles avoid the `--color-` prefix: a variable cannot be defined in terms of itself.
 * `@theme inline` keeps `var(--surface)` live so utilities follow the active theme;
 * a plain `@theme` would freeze the light value. `--color-*: initial` drops
 * Tailwind's palette, so a stray `bg-red-500` does not compile.
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

export function roleNames(theme: TokenTree): readonly string[] {
  return Object.keys(theme).filter((key) => !key.startsWith("$"));
}

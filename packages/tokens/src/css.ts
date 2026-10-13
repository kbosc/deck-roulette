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
export function buildCss(
  primitives: readonly TokenTree[],
  themes: Themes,
  surfaces: Readonly<Record<string, TokenTree>> = {},
): string {
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
${Object.entries(surfaces)
  .map(([name, tree]) => surfaceBlock(name, tree))
  .join("")}`;
}

/**
 * Same declarations whatever the theme: a vellum page stays light on dark leather.
 * Inherited custom properties do the rest, but `color` is inherited already computed:
 * the element carrying the surface must set its own text color.
 */
function surfaceBlock(name: string, tree: TokenTree): string {
  const scheme = tree["$color-scheme"];
  const schemeLine = typeof scheme === "string" ? `  color-scheme: ${scheme};\n\n` : "";

  return `
[data-surface="${name}"] {
${schemeLine}${declarations(flatten(tree), "  ")}
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
 * Our roles avoid the `--color-` and `--shadow-` prefixes: a variable cannot be defined in
 * terms of itself.
 * `@theme inline` keeps `var(--surface)` live so utilities follow the active theme;
 * a plain `@theme` would freeze the light value. `--color-*: initial` drops
 * Tailwind's palette, so a stray `bg-red-500` does not compile.
 */
export function buildTailwindTheme(
  primitives: readonly TokenTree[],
  roles: readonly ThemedRole[],
): string {
  const cleared = CLEARED.map((namespace) => `  ${namespace}: initial;`).join("\n");

  const mapped = primitives
    .flatMap((tree) => flatten(tree))
    .flatMap(({ name, value }) => {
      const tailwind = toTailwindName(name);
      return tailwind === undefined ? [] : [`  ${tailwind}: ${value};`];
    })
    .join("\n");

  const themed = roles
    .flatMap(({ name, type }) => {
      const namespace = THEMED_NAMESPACES[type];
      return namespace === null ? [] : [`  ${namespace}${name}: var(--${name});`];
    })
    .join("\n");

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

/** `null`: the variable exists, but only stylesheets read it; Tailwind has no image scale. */
const THEMED_NAMESPACES = {
  color: "--color-",
  shadow: "--shadow-",
  image: null,
} as const;

type ThemedType = keyof typeof THEMED_NAMESPACES;

export type ThemedRole = { readonly name: string; readonly type: ThemedType };

function isThemedType(type: unknown): type is ThemedType {
  return typeof type === "string" && Object.hasOwn(THEMED_NAMESPACES, type);
}

export function themedRoles(theme: TokenTree): readonly ThemedRole[] {
  return Object.entries(theme)
    .filter(([key]) => !key.startsWith("$"))
    .map(([name, node]) => {
      const type =
        typeof node === "object" && node !== null && "$type" in node ? node.$type : undefined;
      if (!isThemedType(type)) {
        throw new Error(
          `Themed role "${name}" has type "${String(type)}", which maps to no utility`,
        );
      }
      const namespace = THEMED_NAMESPACES[type]?.slice(2);
      if (namespace !== undefined && name.startsWith(namespace)) {
        throw new Error(`Themed role "${name}" must not start with "${namespace}"`);
      }
      return { name, type };
    });
}

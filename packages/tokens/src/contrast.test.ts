import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { PrimitiveGroup, TokenGroup } from "./contrast";
import { contrastRatio, relativeLuminance, resolveColor } from "./contrast";

function readTokens(path: string): Record<string, unknown> {
  const url = new URL(`../${path}`, import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(url), "utf8")) as Record<string, unknown>;
}

const primitives = readTokens("primitives/colors.json")["color"] as PrimitiveGroup;

const themes = {
  light: readTokens("semantic/light.json") as TokenGroup,
  dark: readTokens("semantic/dark.json") as TokenGroup,
} as const;

const page = readTokens("semantic/page.json") as TokenGroup;

/** WCAG AA: 4.5 for body text, 3 for large text and non-text (borders, focus ring). */
const PAIRS: ReadonlyArray<readonly [fg: string, bg: string, min: number]> = [
  ["text", "surface", 4.5],
  ["text", "surface-raised", 4.5],
  ["text", "surface-sunken", 4.5],
  ["text-muted", "surface", 4.5],
  ["text-muted", "surface-raised", 4.5],
  ["text-action", "surface", 4.5],
  ["text-action", "surface-raised", 4.5],
  ["text-on-action", "action", 4.5],
  ["text-on-danger", "danger", 4.5],
  ["text-danger", "surface-danger", 4.5],
  ["text-danger", "surface-raised", 4.5],
  ["text-success", "surface-success", 4.5],
  ["text-success", "surface-raised", 4.5],
  ["text-warning", "surface-warning", 4.5],
  ["text-warning", "surface-raised", 4.5],
  ["border-strong", "surface", 3],
  ["focus-ring", "surface", 3],
  ["action", "surface", 3],
];

describe("relativeLuminance", () => {
  it("puts black at 0 and white at 1", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
  });

  it("rejects anything that is not a six-digit hex color", () => {
    expect(() => relativeLuminance("red")).toThrow(TypeError);
    expect(() => relativeLuminance("#fff")).toThrow(TypeError);
  });
});

describe("contrastRatio", () => {
  it("reaches the maximum of 21 between black and white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("gives 1 for a color against itself", () => {
    expect(contrastRatio("#7c4dff", "#7c4dff")).toBeCloseTo(1, 5);
  });

  it("does not depend on the order of its arguments", () => {
    expect(contrastRatio("#101017", "#f8f8fa")).toBeCloseTo(contrastRatio("#f8f8fa", "#101017"), 5);
  });
});

describe("resolveColor", () => {
  it("follows an alias down to its primitive", () => {
    expect(resolveColor("{color.seal.600}", primitives)).toBe("#9c2a22");
  });

  it("leaves a literal value alone", () => {
    expect(resolveColor("rgb(16 16 23 / 0.5)", primitives)).toBe("rgb(16 16 23 / 0.5)");
  });

  it("refuses an alias pointing at a primitive that does not exist", () => {
    expect(() => resolveColor("{color.seal.42}", primitives)).toThrow(ReferenceError);
  });
});

// A page is light in both themes: checked on its own, its roles cover every pair.
describe.each(Object.entries({ ...themes, "page surface": page }))("%s", (_name, tokens) => {
  it("declares every role the pairs under test rely on", () => {
    const roles = new Set(PAIRS.flatMap(([fg, bg]) => [fg, bg]));

    for (const role of roles) {
      expect(tokens[role], `missing role: ${role}`).toBeDefined();
    }
  });

  it.each(PAIRS)("keeps %s on %s at %s:1 or better", (fg, bg, min) => {
    const foreground = resolveColor((tokens[fg] as { $value: string }).$value, primitives);
    const background = resolveColor((tokens[bg] as { $value: string }).$value, primitives);

    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(min);
  });

  it("keeps the draw label readable on every color of the seal", () => {
    const label = resolveColor((tokens["text-on-action"] as { $value: string }).$value, primitives);
    const seal = (tokens["seal"] as { $value: string }).$value;
    const stops = seal.match(/\{[^}]+\}/g) ?? [];

    // A literal color would slip past the loop below.
    expect(seal).not.toMatch(/#|rgb|hsl|oklch/);
    expect(stops).not.toHaveLength(0);
    for (const stop of stops) {
      const color = resolveColor(stop, primitives);
      expect(contrastRatio(label, color), stop).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("the two themes", () => {
  it("declare exactly the same roles", () => {
    // A role present in one theme only is a component that breaks on the other.
    const roles = (theme: TokenGroup) =>
      Object.keys(theme)
        .filter((k) => !k.startsWith("$"))
        .toSorted();

    expect(roles(themes.dark)).toEqual(roles(themes.light));
  });

  it("know every role a page redefines", () => {
    // A typo in page.json would declare a variable no utility reads.
    const known = new Set(Object.keys(themes.light));

    for (const role of Object.keys(page).filter((k) => !k.startsWith("$"))) {
      expect(known.has(role), `unknown role in page.json: ${role}`).toBe(true);
    }
  });

  it("give each role the same type", () => {
    // The Tailwind namespace is picked from the light theme only.
    const types = (theme: TokenGroup) =>
      Object.fromEntries(
        Object.entries(theme)
          .filter(([role]) => !role.startsWith("$"))
          .map(([role, token]) => [role, "$type" in token ? token.$type : undefined]),
      );

    expect(types(themes.dark)).toEqual(types(themes.light));
  });
});

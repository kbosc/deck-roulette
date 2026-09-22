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

/**
 * Foreground, background, and the ratio WCAG AA demands.
 *
 * 4.5 is the threshold for body text; 3 covers large text and non-text parts of
 * the interface — borders, the focus ring — which also have to be perceivable.
 */
const PAIRS: ReadonlyArray<readonly [fg: string, bg: string, min: number]> = [
  ["text", "surface", 4.5],
  ["text", "surface-raised", 4.5],
  ["text", "surface-sunken", 4.5],
  ["text-muted", "surface", 4.5],
  ["text-muted", "surface-raised", 4.5],
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
    expect(contrastRatio("#101017", "#f8f8fa")).toBeCloseTo(
      contrastRatio("#f8f8fa", "#101017"),
      5,
    );
  });
});

describe("resolveColor", () => {
  it("follows an alias down to its primitive", () => {
    expect(resolveColor("{color.violet.600}", primitives)).toBe("#6631f5");
  });

  it("leaves a literal value alone", () => {
    expect(resolveColor("rgb(16 16 23 / 0.5)", primitives)).toBe("rgb(16 16 23 / 0.5)");
  });

  it("refuses an alias pointing at a primitive that does not exist", () => {
    expect(() => resolveColor("{color.violet.42}", primitives)).toThrow(ReferenceError);
  });
});

describe.each(Object.entries(themes))("%s theme", (_name, tokens) => {
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
});

describe("the two themes", () => {
  it("declare exactly the same roles", () => {
    // A role present in one theme only is a component that breaks on the other.
    const roles = (theme: TokenGroup) => Object.keys(theme).filter((k) => !k.startsWith("$")).toSorted();

    expect(roles(themes.dark)).toEqual(roles(themes.light));
  });
});

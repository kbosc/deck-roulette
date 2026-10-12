import { describe, expect, it } from "vitest";
import { buildCss, buildTailwindTheme, flatten, themedRoles, toCssValue } from "./css";

describe("flatten", () => {
  it("names a variable after its path in the tree", () => {
    const tree = { font: { size: { base: { $value: "1rem" } } } };

    expect(flatten(tree)).toEqual([{ name: "--font-size-base", value: "1rem" }]);
  });

  it("ignores metadata keys", () => {
    const tree = {
      $description: "not a token",
      color: { $description: "neither", red: { $value: "#f00" } },
    };

    expect(flatten(tree)).toEqual([{ name: "--color-red", value: "#f00" }]);
  });

  it("keeps a numeric value usable in CSS", () => {
    const tree = { font: { weight: { bold: { $value: 700 } } } };

    expect(flatten(tree)).toEqual([{ name: "--font-weight-bold", value: "700" }]);
  });

  it("walks every branch", () => {
    const tree = { a: { one: { $value: "1" } }, b: { two: { $value: "2" } } };

    expect(flatten(tree).map((v) => v.name)).toEqual(["--a-one", "--b-two"]);
  });
});

describe("toCssValue", () => {
  it("rewrites an alias as a var() call", () => {
    expect(toCssValue("{color.violet.600}")).toBe("var(--color-violet-600)");
  });

  it("leaves a literal value alone", () => {
    expect(toCssValue("rgb(16 16 23 / 0.5)")).toBe("rgb(16 16 23 / 0.5)");
  });

  it("rewrites every alias inside a composite value", () => {
    expect(toCssValue("0 1px 2px {color.neutral.950}, 0 0 0 1px {color.neutral.200}")).toBe(
      "0 1px 2px var(--color-neutral-950), 0 0 0 1px var(--color-neutral-200)",
    );
  });
});

describe("buildCss", () => {
  const primitives = [
    { color: { neutral: { "50": { $value: "#fff" }, "950": { $value: "#000" } } } },
  ];
  const themes = {
    light: { color: { surface: { $value: "{color.neutral.50}" } } },
    dark: { color: { surface: { $value: "{color.neutral.950}" } } },
  };
  const css = buildCss(primitives, themes);

  it("declares the primitives once, at the root", () => {
    expect(css.match(/--color-neutral-50:/g)).toHaveLength(1);
  });

  it("points a semantic variable at a primitive rather than at a raw value", () => {
    expect(css).toContain("--color-surface: var(--color-neutral-50);");
  });

  it("lets the system preference apply unless light was explicitly chosen", () => {
    expect(css).toContain(
      '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"])',
    );
  });

  it("lets an explicit dark choice win over a light system", () => {
    expect(css).toContain(':root[data-theme="dark"]');
  });

  it("declares the dark theme in both places", () => {
    // Once for the system preference, once for the explicit choice.
    expect(css.match(/--color-surface: var\(--color-neutral-950\);/g)).toHaveLength(2);
  });

  it("announces the color scheme so native controls follow the theme", () => {
    expect(css).toContain("color-scheme: light;");
    expect(css.match(/color-scheme: dark;/g)).toHaveLength(2);
  });
});

describe("themedRoles", () => {
  it("lists the roles a theme declares, with their type", () => {
    expect(
      themedRoles({
        $description: "x",
        surface: { $type: "color", $value: "a" },
        "elevation-rest": { $type: "shadow", $value: "b" },
      }),
    ).toEqual([
      { name: "surface", type: "color" },
      { name: "elevation-rest", type: "shadow" },
    ]);
  });

  it("refuses a role named like the namespace it is exposed in", () => {
    // `--shadow-sm` would overwrite the primitive of the same name.
    expect(() => themedRoles({ "shadow-sm": { $type: "shadow", $value: "a" } })).toThrow(
      /shadow-sm/,
    );
  });

  it("refuses a type no utility namespace is mapped to", () => {
    // Silently dropped, the role would exist in CSS with no class to use it.
    expect(() => themedRoles({ gap: { $type: "dimension", $value: "1rem" } })).toThrow(
      /gap.*dimension/,
    );
  });
});

describe("buildTailwindTheme", () => {
  const primitives = [
    { space: { "4": { $value: "1rem" } } },
    { radius: { md: { $value: "0.5rem" } } },
    { font: { size: { base: { $value: "1rem" } }, family: { sans: { $value: "system-ui" } } } },
    { mana: { white: { $value: "#fffbd5" } } },
  ];
  const css = buildTailwindTheme(primitives, [
    { name: "surface", type: "color" },
    { name: "text-muted", type: "color" },
    { name: "elevation-rest", type: "shadow" },
  ]);

  it("maps each themed color onto the name Tailwind expects", () => {
    // `--color-surface` is what produces bg-surface, text-surface, border-surface.
    expect(css).toContain("--color-surface: var(--surface);");
    expect(css).toContain("--color-text-muted: var(--text-muted);");
  });

  it("maps a themed shadow into the shadow namespace", () => {
    // `--shadow-elevation-rest` is what produces shadow-elevation-rest.
    expect(css).toContain("--shadow-elevation-rest: var(--elevation-rest);");
    expect(css).not.toContain("--color-elevation-rest");
  });

  it("uses @theme inline for themed roles so utilities follow the active theme", () => {
    // A plain @theme would freeze the light value into every utility.
    expect(css).toContain("@theme inline {");
  });

  it("renames a primitive into the namespace its utilities come from", () => {
    expect(css).toContain("--spacing-4: 1rem;");
    expect(css).toContain("--text-base: 1rem;");
    expect(css).toContain("--font-sans: system-ui;");
  });

  it("keeps a primitive whose name already matches", () => {
    expect(css).toContain("--radius-md: 0.5rem;");
  });

  it("leaves out primitives that no utility should expose", () => {
    // Mana colors belong to the game, not to a bg-* class.
    expect(css).not.toContain("mana");
  });

  it("takes over every namespace it declares values in", () => {
    for (const namespace of ["--color-*", "--spacing-*", "--radius-*", "--text-*", "--shadow-*"]) {
      expect(css).toContain(`${namespace}: initial;`);
    }
  });

  it("clears the dynamic spacing multiplier", () => {
    // Left in place, `p-7` would still compile out of a scale that has no 7.
    expect(css).toContain("--spacing: initial;");
  });
});

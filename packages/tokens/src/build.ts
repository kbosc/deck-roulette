/**
 * Reads the token JSON and writes dist/tokens.css.
 *
 * The only part of the package that touches the disk: everything it needs is
 * computed by pure functions in css.ts, which the tests exercise directly.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { TokenTree } from "./css.ts";
import { buildCss } from "./css.ts";

const packageRoot = new URL("../", import.meta.url);

function read(path: string): TokenTree {
  return JSON.parse(readFileSync(fileURLToPath(new URL(path, packageRoot)), "utf8")) as TokenTree;
}

const css = buildCss(
  [
    read("primitives/colors.json"),
    read("primitives/mana.json"),
    read("primitives/spacing.json"),
    read("primitives/typography.json"),
    read("primitives/radius.json"),
    read("primitives/shadow.json"),
    read("primitives/motion.json"),
  ],
  {
    light: read("semantic/light.json"),
    dark: read("semantic/dark.json"),
  },
);

const output = fileURLToPath(new URL("dist/tokens.css", packageRoot));
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, css, "utf8");

console.log(`wrote ${output}`);

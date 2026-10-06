import type { Color, ColorIdentity } from "./types";

/** The canonical order: "GUWB" reads wrong to any player. */
const WUBRG: readonly Color[] = ["W", "U", "B", "R", "G"];

/** `C` is the absence of colors, so it only shows up when nothing else does. */
export function mergeColorIdentities(...identities: readonly ColorIdentity[]): ColorIdentity {
  const colors = new Set(identities.flat());
  const merged = WUBRG.filter((color) => colors.has(color));

  return merged.length === 0 ? ["C"] : merged;
}

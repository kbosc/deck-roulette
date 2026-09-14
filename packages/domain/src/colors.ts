import type { Color, ColorIdentity } from "./types";

/**
 * The canonical Magic ordering, used on cards and by every deckbuilding site.
 * Showing "GUWB" instead of "WUBG" reads wrong to any player, so identities are
 * always sorted this way before display.
 */
const WUBRG: readonly Color[] = ["W", "U", "B", "R", "G"];

/**
 * Merges color identities into one, the way a deck inherits the identity of its
 * commander or commanders.
 *
 * It is a union, not a concatenation: a color shared by both commanders appears
 * once. `C` is not a sixth color but the absence of any, so it only shows up
 * when nothing else does.
 */
export function mergeColorIdentities(
  ...identities: readonly ColorIdentity[]
): ColorIdentity {
  const colors = new Set(identities.flat());
  const merged = WUBRG.filter((color) => colors.has(color));

  return merged.length === 0 ? ["C"] : merged;
}

/**
 * WCAG contrast maths, and just enough token resolution to feed it.
 *
 * This lives in the tokens package rather than in a script because an
 * accessibility rule that is not executed is not a rule, only an intention.
 */

/** A leaf token in the DTCG format used across this package. */
type Token = { readonly $value: string };

/** One theme file: role name -> token. */
export type TokenGroup = Readonly<Record<string, Token>>;

/** The primitive files: hue -> step -> token. */
export type PrimitiveGroup = Readonly<Record<string, TokenGroup>>;

/** Matches a DTCG alias such as `{color.violet.600}`. */
const ALIAS = /^\{color\.([\w-]+)\.([\w-]+)\}$/;

/**
 * Turns a semantic value into an actual color.
 *
 * A literal value is returned untouched: `overlay` is declared inline because
 * it needs an alpha channel, which no primitive carries.
 */
export function resolveColor(value: string, primitives: PrimitiveGroup): string {
  const alias = ALIAS.exec(value);

  if (alias === null) {
    return value;
  }

  const [, hue, step] = alias;
  const token = hue === undefined || step === undefined ? undefined : primitives[hue]?.[step];

  if (token === undefined) {
    throw new ReferenceError(`${value} points at a primitive that does not exist`);
  }

  return token.$value;
}

/**
 * Relative luminance, per the WCAG definition.
 *
 * The channels are weighted very unevenly on purpose: the eye is far more
 * sensitive to green than to blue, so a "bright" blue is much darker than a
 * green of the same numeric value.
 */
export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);

  if (match === null) {
    throw new TypeError(`${hex} is not a six-digit hex color`);
  }

  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset + 1, offset + 3), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colors, from 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

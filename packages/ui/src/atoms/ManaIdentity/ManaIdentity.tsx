import type { Color, ColorIdentity } from "@deck-roulette/domain";

export type ManaIdentitySize = "sm" | "md";

export type ManaIdentityProps = {
  readonly colors: ColorIdentity;
  readonly size?: ManaIdentitySize;
};

/**
 * The colors in the order Magic always prints them: WUBRG.
 *
 * Sorting here rather than trusting the data means two decks with the same
 * identity always look the same, whatever order they were entered in.
 */
const WUBRG: readonly Color[] = ["W", "U", "B", "R", "G", "C"];

const NAMES: Readonly<Record<Color, string>> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
};

/**
 * Mana colors are reached through their CSS variable, not through a utility
 * class, because they deliberately have none: they are values of the game, not
 * of the interface, and nothing should be able to paint a danger button red
 * with Magic's red. The cost is this one inline style; the benefit is that this
 * component is the only place in the codebase that can use them at all.
 */
const PIPS: Readonly<Record<Color, string>> = {
  W: "var(--mana-white)",
  U: "var(--mana-blue)",
  B: "var(--mana-black)",
  R: "var(--mana-red)",
  G: "var(--mana-green)",
  C: "var(--mana-colorless)",
};

const SIZES: Readonly<Record<ManaIdentitySize, string>> = {
  sm: "size-3",
  md: "size-5",
};

/**
 * A deck's color identity, as pips.
 *
 * Color alone never carries the information: the identity is also written out
 * for assistive technology, and remains readable by anyone who cannot tell the
 * pips apart. Around 8% of men have some form of color vision deficiency, and
 * Magic's own palette puts a pale beige next to a pale grey.
 */
export function ManaIdentity({ colors, size = "md" }: ManaIdentityProps) {
  const ordered = WUBRG.filter((color) => colors.includes(color));
  const label = ordered.length === 0 ? "No color identity" : ordered.map((c) => NAMES[c]).join(", ");

  return (
    <span className="inline-flex items-center gap-1">
      {ordered.map((color) => (
        <span
          key={color}
          // Decorative: the whole identity is announced once, below, rather
          // than pip by pip.
          aria-hidden="true"
          style={{ backgroundColor: PIPS[color] }}
          className={[SIZES[size], "rounded-full border border-border shrink-0"]
            .filter(Boolean)
            .join(" ")}
        />
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
}

import type { Color, ColorIdentity } from "@deck-roulette/domain";

export type ManaIdentitySize = "sm" | "md";

export type ManaIdentityProps = {
  readonly colors: ColorIdentity;
  readonly size?: ManaIdentitySize;
  /** Writes the names beside the pips, for wherever there is room to spell them out. */
  readonly showNames?: boolean;
};

/** Sorted here, not trusted from the data. */
const WUBRG: readonly Color[] = ["W", "U", "B", "R", "G", "C"];

const NAMES: Readonly<Record<Color, string>> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
};

/** Mana colors have no utility class on purpose: this is the only place that uses them. */
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

export function ManaIdentity({ colors, size = "md", showNames = false }: ManaIdentityProps) {
  const ordered = WUBRG.filter((color) => colors.includes(color));
  const label =
    ordered.length === 0 ? "No color identity" : ordered.map((c) => NAMES[c]).join(", ");

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {ordered.map((color) => (
        <span
          key={color}
          // Announced once below, not pip by pip.
          aria-hidden="true"
          style={{ backgroundColor: PIPS[color] }}
          // The strong border, held to 3:1 by the token tests: white and blue pips vanish on vellum.
          className={[SIZES[size], "rounded-full border border-border-strong shrink-0"]
            .filter(Boolean)
            .join(" ")}
        />
      ))}
      <span className={showNames ? "ms-1 text-sm text-text" : "sr-only"}>{label}</span>
    </span>
  );
}

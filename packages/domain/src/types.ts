import type { DeckId, PoolId } from "./ids";

/**
 * The five Magic colors, plus colorless.
 * W = White, U = Blue, B = Black, R = Red, G = Green, C = Colorless.
 */
export type Color = "W" | "U" | "B" | "R" | "G" | "C";

/** A deck's color identity: the combined colors of its commander(s). */
export type ColorIdentity = readonly Color[];

/**
 * The official Commander power-level scale.
 * 1 = ultra casual, 4 = optimized, 5 = cEDH.
 */
export type Bracket = 1 | 2 | 3 | 4 | 5;

/**
 * One or two commanders — never zero, never three.
 * The two-commander case is real (Partner, Partner With, Friends Forever,
 * Choose a Background, Doctor's companion).
 */
export type Commanders = readonly [string] | readonly [string, string];

export type Deck = {
  readonly id: DeckId;
  readonly name: string;
  readonly commanders?: Commanders;
  readonly colors?: ColorIdentity;
  readonly bracket?: Bracket;
  /** Moxfield / Archidekt link, purely informational. */
  readonly url?: string;
  /** ISO 8601 date. */
  readonly createdAt: string;
};

/**
 * A set of decks to draw from.
 *
 * Invariant: `drawnDeckIds` is always a subset of `deckIds`.
 * Deleting a deck must clean up both lists.
 */
export type Pool = {
  readonly id: PoolId;
  readonly name: string;
  readonly deckIds: readonly DeckId[];
  /** Decks already drawn during the current cycle. */
  readonly drawnDeckIds: readonly DeckId[];
  readonly createdAt: string;
};

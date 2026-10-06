import type { DeckId, PoolId } from "./ids";

/** W White, U Blue, B Black, R Red, G Green, C Colorless. */
export type Color = "W" | "U" | "B" | "R" | "G" | "C";

export type ColorIdentity = readonly Color[];

/** Official Commander scale: 1 ultra casual, 4 optimized, 5 cEDH. */
export type Bracket = 1 | 2 | 3 | 4 | 5;

/** Two is real: Partner, Friends Forever, Choose a Background… */
export type Commanders = readonly [string] | readonly [string, string];

export type Deck = {
  readonly id: DeckId;
  readonly name: string;
  readonly commanders?: Commanders;
  readonly colors?: ColorIdentity;
  readonly bracket?: Bracket;
  /** Informational only, never fetched. */
  readonly url?: string;
  readonly createdAt: string;
};

/** Invariant: `drawnDeckIds` ⊆ `deckIds`. */
export type Pool = {
  readonly id: PoolId;
  readonly name: string;
  readonly deckIds: readonly DeckId[];
  readonly drawnDeckIds: readonly DeckId[];
  readonly createdAt: string;
};

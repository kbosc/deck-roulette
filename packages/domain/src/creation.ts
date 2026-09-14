import { toDeckId, toPoolId } from "./ids";
import type { Bracket, ColorIdentity, Commanders, Deck, Pool } from "./types";

/** Produces a fresh unique identifier, typically `crypto.randomUUID`. */
export type IdFactory = () => string;

/** Returns the current time as an ISO 8601 string. */
export type Clock = () => string;

/**
 * The impure bits creating an entity needs.
 *
 * Injected rather than called directly, so that these functions stay pure and
 * testable, and so that the domain never touches a platform API: it must run in
 * a plain Node test as happily as in a browser.
 */
export type CreationDeps = {
  readonly newId: IdFactory;
  readonly now: Clock;
};

/** Everything the user provides when creating a deck. */
export type DeckInput = {
  readonly name: string;
  readonly commanders?: Commanders;
  readonly colors?: ColorIdentity;
  readonly bracket?: Bracket;
  readonly url?: string;
};

/**
 * Creates a deck, trimming its name and rejecting an empty one.
 *
 * A nameless deck is unusable in a draw list — better to fail here than to let
 * a blank row reach the screen.
 */
export function createDeck(input: DeckInput, deps: CreationDeps): Deck {
  const name = input.name.trim();

  if (name === "") {
    throw new TypeError("a deck name cannot be empty");
  }

  return {
    ...input,
    id: toDeckId(deps.newId()),
    name,
    createdAt: deps.now(),
  };
}

/** Creates an empty pool, under the same naming rule as decks. */
export function createPool(name: string, deps: CreationDeps): Pool {
  const trimmed = name.trim();

  if (trimmed === "") {
    throw new TypeError("a pool name cannot be empty");
  }

  return {
    id: toPoolId(deps.newId()),
    name: trimmed,
    deckIds: [],
    drawnDeckIds: [],
    createdAt: deps.now(),
  };
}

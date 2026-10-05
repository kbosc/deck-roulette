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
 * Why a name was refused.
 *
 * A code, not a sentence: the domain says *what* is wrong, the screen decides
 * how to say it. A union rather than a plain string, so that the day a second
 * problem appears (a maximum length, say), every screen mapping these codes to
 * messages stops compiling until it handles the new one.
 */
export type NameProblem = "empty";

/**
 * Checks a deck or pool name against the naming rule.
 *
 * Exported so that a form can tell the user before trying to create anything:
 * the rule lives here once, instead of being copied into every screen.
 */
export function validateName(name: string): NameProblem | null {
  return name.trim() === "" ? "empty" : null;
}

/**
 * Creates a deck, trimming its name and rejecting an empty one.
 *
 * A nameless deck is unusable in a draw list — better to fail here than to let
 * a blank row reach the screen.
 */
export function createDeck(input: DeckInput, deps: CreationDeps): Deck {
  // Still enforced here: a caller that skipped validateName must not be able
  // to create a nameless deck. The form checks to inform, this checks to protect.
  if (validateName(input.name) !== null) {
    throw new TypeError("a deck name cannot be empty");
  }

  const name = input.name.trim();

  return {
    ...input,
    id: toDeckId(deps.newId()),
    name,
    createdAt: deps.now(),
  };
}

/** Creates an empty pool, under the same naming rule as decks. */
export function createPool(name: string, deps: CreationDeps): Pool {
  if (validateName(name) !== null) {
    throw new TypeError("a pool name cannot be empty");
  }

  const trimmed = name.trim();

  return {
    id: toPoolId(deps.newId()),
    name: trimmed,
    deckIds: [],
    drawnDeckIds: [],
    createdAt: deps.now(),
  };
}

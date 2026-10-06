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
export type NameProblem = "empty" | "duplicate";

function isBlank(name: string): boolean {
  return name.trim() === "";
}

/**
 * Compares names the way a person would: "atraxa" and "Atraxa" are the same
 * deck, "Eowyn" and "Éowyn" are not.
 *
 * A collator rather than `toLowerCase()`: lowercasing gets some languages wrong
 * (the German ß, the Turkish dotted i), whereas the collator applies Unicode's
 * own rules. `sensitivity: "accent"` is what makes case irrelevant while
 * keeping accents significant. Built once, since it is used on every keystroke.
 */
const nameCollator = new Intl.Collator(undefined, { sensitivity: "accent" });

/** Whether two names designate the same thing, spaces around them aside. */
export function isSameName(a: string, b: string): boolean {
  return nameCollator.compare(a.trim(), b.trim()) === 0;
}

/**
 * Checks a deck or pool name against the naming rules.
 *
 * Exported so that a form can tell the user before trying to create anything:
 * the rules live here once, instead of being copied into every screen.
 *
 * `existingNames` is required, not optional: a caller who forgot it would get
 * every duplicate through without a word.
 */
export function validateName(name: string, existingNames: readonly string[]): NameProblem | null {
  if (isBlank(name)) return "empty";
  if (existingNames.some((existing) => isSameName(existing, name))) return "duplicate";
  return null;
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
  if (isBlank(input.name)) {
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
  if (isBlank(name)) {
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

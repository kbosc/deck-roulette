import { toDeckId, toPoolId } from "./ids";
import type { Bracket, ColorIdentity, Commanders, Deck, Pool } from "./types";

export type IdFactory = () => string;

/** Returns an ISO 8601 string. */
export type Clock = () => string;

/** Injected so that the domain never calls a platform API. */
export type CreationDeps = {
  readonly newId: IdFactory;
  readonly now: Clock;
};

export type DeckInput = {
  readonly name: string;
  readonly commanders?: Commanders;
  readonly colors?: ColorIdentity;
  readonly bracket?: Bracket;
  readonly url?: string;
};

/** A code, not a sentence: each screen words its own message. */
export type NameProblem = "empty" | "duplicate";

function isBlank(name: string): boolean {
  return name.trim() === "";
}

// Case ignored, accents kept: "atraxa" is "Atraxa", "Eowyn" is not "Éowyn".
// Not toLowerCase(), which gets ß and the Turkish i wrong.
const nameCollator = new Intl.Collator(undefined, { sensitivity: "accent" });

export function isSameName(a: string, b: string): boolean {
  return nameCollator.compare(a.trim(), b.trim()) === 0;
}

/** `existingNames` is required: forgetting it would let every duplicate through. */
export function validateName(name: string, existingNames: readonly string[]): NameProblem | null {
  if (isBlank(name)) return "empty";
  if (existingNames.some((existing) => isSameName(existing, name))) return "duplicate";
  return null;
}

export function createDeck(input: DeckInput, deps: CreationDeps): Deck {
  // Also checked here: the form informs, this protects.
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

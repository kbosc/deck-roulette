import { toDeckId, toPoolId } from "./ids";
import type { Deck, Pool } from "./types";

/**
 * Test overrides accept plain strings where the domain expects branded ids, and
 * convert them here. This file is a boundary, exactly like the app will be when
 * it turns a generated UUID or a URL parameter into a `DeckId` — so it is the
 * right place to call the conversion functions, and it keeps the tests readable.
 */
type PoolOverrides = Omit<Partial<Pool>, "id" | "deckIds" | "drawnDeckIds"> & {
  readonly id?: string;
  readonly deckIds?: readonly string[];
  readonly drawnDeckIds?: readonly string[];
};

/**
 * Builds a pool with sensible defaults, so each test only spells out what it
 * actually cares about. `= {}` is a default parameter value, which makes the
 * argument optional: `makePool()` returns the base pool untouched.
 *
 * Not exported from the package barrel: this is test scaffolding, not domain API.
 */
export function makePool({ id, deckIds, drawnDeckIds, ...rest }: PoolOverrides = {}): Pool {
  return {
    id: toPoolId(id ?? "pool-1"),
    name: "Thursday table",
    deckIds: (deckIds ?? []).map(toDeckId),
    drawnDeckIds: (drawnDeckIds ?? []).map(toDeckId),
    createdAt: "2026-09-05T00:00:00.000Z",
    ...rest,
  };
}

type DeckOverrides = Omit<Partial<Deck>, "id"> & { readonly id?: string };

/** Same idea as `makePool`, for decks. */
export function makeDeck({ id, ...rest }: DeckOverrides = {}): Deck {
  return {
    id: toDeckId(id ?? "deck-1"),
    name: "Atraxa, Praetors' Voice",
    createdAt: "2026-09-05T00:00:00.000Z",
    ...rest,
  };
}

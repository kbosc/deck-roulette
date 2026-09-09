import type { Deck, Pool } from "./types";

/**
 * Builds a pool with sensible defaults, so each test only spells out what it
 * actually cares about. `= {}` is a default parameter value, which makes the
 * argument optional: `makePool()` returns the base pool untouched.
 *
 * Not exported from the package barrel: this is test scaffolding, not domain API.
 */
export function makePool(overrides: Partial<Pool> = {}): Pool {
  return {
    id: "pool-1",
    name: "Thursday table",
    deckIds: [],
    drawnDeckIds: [],
    createdAt: "2026-09-05T00:00:00.000Z",
    ...overrides,
  };
}

/** Same idea as `makePool`, for decks. */
export function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1",
    name: "Atraxa, Praetors' Voice",
    createdAt: "2026-09-05T00:00:00.000Z",
    ...overrides,
  };
}

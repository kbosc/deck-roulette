import type { DeckId } from "./ids";
import type { Pool } from "./types";

/**
 * Adds a deck to a pool.
 *
 * Idempotent: adding a deck that is already there returns the pool untouched,
 * same reference included. No error, no duplicate — the UI is free to replay the
 * operation (double click, undo, re-import) without special-casing it.
 *
 * `deckIds` is an array rather than a Set because display order matters and a
 * Set does not survive JSON serialization, which persistence and export rely on.
 */
export function addDeckToPool(pool: Pool, deckId: DeckId): Pool {
  if (pool.deckIds.includes(deckId)) {
    return pool;
  }
  return { ...pool, deckIds: [...pool.deckIds, deckId] };
}

/**
 * Removes a deck from a pool.
 *
 * Clears **both** lists. Dropping the id from `deckIds` alone would break the
 * `drawnDeckIds ⊆ deckIds` invariant, and the damage would only surface later:
 * adding that deck back would bring it in already flagged as drawn.
 */
export function removeDeckFromPool(pool: Pool, deckId: DeckId): Pool {
  if (!pool.deckIds.includes(deckId)) {
    return pool;
  }
  return {
    ...pool,
    deckIds: pool.deckIds.filter((id) => id !== deckId),
    drawnDeckIds: pool.drawnDeckIds.filter((id) => id !== deckId),
  };
}

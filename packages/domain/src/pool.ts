import type { DeckId } from "./ids";
import type { Pool } from "./types";

/** Idempotent, same reference included: the UI can replay it (double click, undo). */
export function addDeckToPool(pool: Pool, deckId: DeckId): Pool {
  if (pool.deckIds.includes(deckId)) {
    return pool;
  }
  return { ...pool, deckIds: [...pool.deckIds, deckId] };
}

/** Clears both lists, or the deck would come back already flagged as drawn. */
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

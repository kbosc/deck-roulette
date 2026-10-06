import type { DeckId } from "./ids";
import type { Pool } from "./types";

/** Returns a number in [0, 1), like `Math.random`. Injected to keep `drawDeck` pure. */
export type Random = () => number;

export type PoolDrawState = "ready" | "empty" | "exhausted";

/** `empty` and `exhausted` stay apart: they call for different messages. */
export type DrawResult =
  | { readonly status: "drawn"; readonly deckId: DeckId; readonly pool: Pool }
  | { readonly status: "empty" }
  | { readonly status: "exhausted" };

/** The decks that have not been drawn yet during the current cycle. */
export function getRemainingDeckIds(pool: Pool): readonly DeckId[] {
  const drawn = new Set(pool.drawnDeckIds);
  return pool.deckIds.filter((id) => !drawn.has(id));
}

export function getPoolDrawState(pool: Pool): PoolDrawState {
  if (pool.deckIds.length === 0) {
    return "empty";
  }
  return getRemainingDeckIds(pool).length === 0 ? "exhausted" : "ready";
}

/**
 * Draws a deck not yet drawn in the current cycle.
 *
 * Still handles `empty` and `exhausted` although the UI checks first: the pool may
 * have changed between render and click.
 */
export function drawDeck(pool: Pool, random: Random): DrawResult {
  if (pool.deckIds.length === 0) {
    return { status: "empty" };
  }

  const remaining = getRemainingDeckIds(pool);

  if (remaining.length === 0) {
    return { status: "exhausted" };
  }

  const index = Math.floor(random() * remaining.length);
  const deckId = remaining[index];

  // Only reachable with a `random` returning 1 or more.
  if (deckId === undefined) {
    throw new RangeError("random() must return a number in [0, 1)");
  }

  return {
    status: "drawn",
    deckId,
    pool: { ...pool, drawnDeckIds: [...pool.drawnDeckIds, deckId] },
  };
}

/** Starts a new cycle. Returns the same reference when there is nothing to clear. */
export function resetPool(pool: Pool): Pool {
  if (pool.drawnDeckIds.length === 0) {
    return pool;
  }
  return { ...pool, drawnDeckIds: [] };
}

/** Cancels a draw: the deck becomes drawable again in the current cycle. */
export function returnDeckToPool(pool: Pool, deckId: DeckId): Pool {
  if (!pool.drawnDeckIds.includes(deckId)) {
    return pool;
  }
  return {
    ...pool,
    drawnDeckIds: pool.drawnDeckIds.filter((id) => id !== deckId),
  };
}

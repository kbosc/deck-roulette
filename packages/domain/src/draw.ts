import type { Pool } from "./types";

/**
 * A source of randomness: returns a number in [0, 1), like `Math.random`.
 *
 * It is passed in rather than calling `Math.random` directly so that `drawDeck`
 * stays pure: same inputs, same output. That is what makes it testable — a test
 * can pass `() => 0` and assert an exact result.
 */
export type Random = () => number;

/**
 * Whether a pool can currently be drawn from.
 *
 * The UI reads this to decide whether the draw button is enabled and which
 * message to show, so the user never has to click to find out.
 */
export type PoolDrawState = "ready" | "empty" | "exhausted";

/**
 * The outcome of a draw, as a union discriminated by `status`.
 *
 * `empty` and `exhausted` are kept apart on purpose: an empty pool and a fully
 * drawn one call for two different messages ("add some decks" vs "the cycle is
 * over, start a new one?").
 */
export type DrawResult =
  | { readonly status: "drawn"; readonly deckId: string; readonly pool: Pool }
  | { readonly status: "empty" }
  | { readonly status: "exhausted" };

/** The decks that have not been drawn yet during the current cycle. */
export function getRemainingDeckIds(pool: Pool): readonly string[] {
  // A Set is used for constant-time lookups: `filter` + `includes` would be
  // quadratic, since `includes` walks the array on every iteration.
  const drawn = new Set(pool.drawnDeckIds);
  return pool.deckIds.filter((id) => !drawn.has(id));
}

/**
 * Inspects a pool without drawing from it.
 *
 * This is the read-only counterpart of `drawDeck`: the UI calls it while
 * rendering, `drawDeck` only runs on user action.
 */
export function getPoolDrawState(pool: Pool): PoolDrawState {
  if (pool.deckIds.length === 0) {
    return "empty";
  }
  return getRemainingDeckIds(pool).length === 0 ? "exhausted" : "ready";
}

/**
 * Draws a random deck among those not yet drawn during the current cycle.
 *
 * Never mutates the given pool: on success it returns a **new** pool whose
 * `drawnDeckIds` includes the drawn deck.
 *
 * The `empty` and `exhausted` statuses are still returned even though the UI is
 * expected to call `getPoolDrawState` first: the domain does not trust its
 * caller, and the pool may have changed between render and click.
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

  // `noUncheckedIndexedAccess` forces this branch: TypeScript cannot know that
  // `index` is in range. It can only happen with an out-of-contract `random`
  // returning 1 or more.
  if (deckId === undefined) {
    throw new RangeError("random() must return a number in [0, 1)");
  }

  return {
    status: "drawn",
    deckId,
    pool: { ...pool, drawnDeckIds: [...pool.drawnDeckIds, deckId] },
  };
}

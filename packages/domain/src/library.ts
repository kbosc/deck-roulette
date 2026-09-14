import { removeDeckFromPool } from "./pool";
import type { DeckId, PoolId } from "./ids";
import type { Deck, Pool } from "./types";

/**
 * Everything the user owns: the decks themselves, and the pools that reference
 * them by id. This is the shape the client store will hold, described here so
 * that the domain never needs to know which state library is in use.
 */
export type Library = {
  readonly decks: readonly Deck[];
  readonly pools: readonly Pool[];
};

/**
 * Deletes a deck everywhere it appears.
 *
 * A deck can belong to several pools at once, so removing it from the deck list
 * alone would leave dangling ids behind: pools would keep drawing an id that no
 * longer matches any deck.
 *
 * Delegates to `removeDeckFromPool` rather than filtering the arrays again, so
 * the `drawnDeckIds ⊆ deckIds` invariant lives in exactly one place.
 *
 * Pools that did not hold the deck keep their identity, so their subscribers are
 * left alone even though the surrounding array is new.
 */
export function deleteDeck(library: Library, deckId: DeckId): Library {
  const decks = library.decks.filter((deck) => deck.id !== deckId);

  if (decks.length === library.decks.length) {
    return library;
  }

  return {
    decks,
    pools: library.pools.map((pool) => removeDeckFromPool(pool, deckId)),
  };
}

/**
 * Adds a deck to the library, without putting it in any pool.
 *
 * Creating a deck and deciding where to draw it from are two separate user
 * actions, so they are two separate functions.
 */
export function addDeck(library: Library, deck: Deck): Library {
  return { ...library, decks: [...library.decks, deck] };
}

/**
 * Deletes a pool, and only the pool.
 *
 * Deliberately **not** the mirror image of `deleteDeck`: a pool references decks,
 * it does not own them. The same deck usually sits in several pools, so wiping
 * them along with the pool would be irreversible data loss.
 */
export function deletePool(library: Library, poolId: PoolId): Library {
  const pools = library.pools.filter((pool) => pool.id !== poolId);

  if (pools.length === library.pools.length) {
    return library;
  }

  return { ...library, pools };
}

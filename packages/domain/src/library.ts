import { isSameName } from "./creation";
import { removeDeckFromPool } from "./pool";
import type { DeckId, PoolId } from "./ids";
import type { Deck, Pool } from "./types";

/** Pools reference decks by id: a deck can sit in several pools. */
export type Library = {
  readonly decks: readonly Deck[];
  readonly pools: readonly Pool[];
};

/** Removes the deck from every pool too, or pools would keep drawing a dangling id. */
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

/** Checks for duplicates here: `createDeck` does not see the library. */
export function addDeck(library: Library, deck: Deck): Library {
  if (library.decks.some((existing) => isSameName(existing.name, deck.name))) {
    throw new TypeError("a deck with this name already exists");
  }

  return { ...library, decks: [...library.decks, deck] };
}

/** Leaves the decks alone: a pool references them, it does not own them. */
export function deletePool(library: Library, poolId: PoolId): Library {
  const pools = library.pools.filter((pool) => pool.id !== poolId);

  if (pools.length === library.pools.length) {
    return library;
  }

  return { ...library, pools };
}

import { mergeColorIdentities } from "./colors";
import { isSameName } from "./creation";
import type { DeckInput } from "./creation";
import { removeDeckFromPool } from "./pool";
import type { DeckId, PoolId } from "./ids";
import type { Commanders, Deck, Pool } from "./types";

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

/** Pools have their own namespace: a pool may be named like a deck. */
export function addPool(library: Library, pool: Pool): Library {
  if (library.pools.some((existing) => isSameName(existing.name, pool.name))) {
    throw new TypeError("a pool with this name already exists");
  }

  return { ...library, pools: [...library.pools, pool] };
}

/** Leaves the decks alone: a pool references them, it does not own them. */
export function deletePool(library: Library, poolId: PoolId): Library {
  const pools = library.pools.filter((pool) => pool.id !== poolId);

  if (pools.length === library.pools.length) {
    return library;
  }

  return { ...library, pools };
}

/** What the deck form edits. Complete, not a patch: a detail left out is unset. */
export type DeckEdit = Omit<DeckInput, "url">;

function trimCommander(name: string): string {
  const trimmed = name.trim();
  if (trimmed === "") throw new TypeError("a commander name cannot be empty");
  return trimmed;
}

function trimCommanders([first, second]: Commanders): Commanders {
  return second === undefined
    ? [trimCommander(first)]
    : [trimCommander(first), trimCommander(second)];
}

export function updateDeck(library: Library, deckId: DeckId, edit: DeckEdit): Library {
  const deck = library.decks.find((d) => d.id === deckId);
  if (deck === undefined) throw new RangeError(`no deck with id ${deckId}`);

  const name = edit.name.trim();
  // Also checked here: the form informs, this protects.
  if (name === "") throw new TypeError("a deck name cannot be empty");
  // Itself excluded: changing only the case of its own name is fine.
  if (library.decks.some((d) => d.id !== deckId && isSameName(d.name, name))) {
    throw new TypeError("a deck with this name already exists");
  }

  // Rebuilt, not spread from `deck`: a complete edit unsets what it leaves out.
  // A detail added to Deck outside the form must be carried over here, like url.
  const updated: Deck = {
    id: deck.id,
    name,
    createdAt: deck.createdAt,
    ...(deck.url === undefined ? {} : { url: deck.url }),
    ...(edit.commanders === undefined ? {} : { commanders: trimCommanders(edit.commanders) }),
    // None ticked means unknown, not colorless: colorless is ["C"].
    ...(edit.colors === undefined || edit.colors.length === 0
      ? {}
      : { colors: mergeColorIdentities(edit.colors) }),
    ...(edit.bracket === undefined ? {} : { bracket: edit.bracket }),
  };

  return { ...library, decks: library.decks.map((d) => (d.id === deckId ? updated : d)) };
}

import type { DeckId, Library } from "@deck-roulette/domain";
import { addDeck as addDeckToLibrary, createDeck, deleteDeck } from "@deck-roulette/domain";
import { create } from "zustand";

type LibraryState = Library & {
  readonly addDeck: (name: string) => void;
  readonly removeDeck: (deckId: DeckId) => void;
};

/** Injected at the boundary; the domain never reaches for these itself. */
const deps = {
  newId: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
};

export const useLibrary = create<LibraryState>((set) => ({
  decks: [],
  pools: [],

  addDeck: (name) => {
    const deck = createDeck({ name }, deps);

    // `addDeckToLibrary` returns a new library rather than touching the one it
    // is given, so `set` always receives a reference Zustand can tell apart
    // from the previous one. Mutating here would leave the data correct and the
    // screen stale, which is far harder to diagnose than a crash.
    set((state) => addDeckToLibrary(state, deck));
  },

  // `deleteDeck` hands back the very same library when the deck was not there,
  // so a pointless removal costs no render at all.
  removeDeck: (deckId) => {
    set((state) => deleteDeck(state, deckId));
  },
}));

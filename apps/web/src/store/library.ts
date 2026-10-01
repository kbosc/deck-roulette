import type { DeckId, Library } from "@deck-roulette/domain";
import {
  CURRENT_SCHEMA_VERSION,
  addDeck as addDeckToLibrary,
  applyMigrations,
  createDeck,
  deleteDeck,
} from "@deck-roulette/domain";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type LibraryState = Library & {
  readonly addDeck: (name: string) => void;
  readonly removeDeck: (deckId: DeckId) => void;
};

/** Injected at the boundary; the domain never reaches for these itself. */
const deps = {
  newId: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
};

/** The localStorage key. Changing it orphans everyone's data. */
export const STORAGE_KEY = "deck-roulette";

/**
 * Brings stored data up to the shape this build expects.
 *
 * The chaining lives in the domain: someone who has not opened the app in a
 * year arrives several versions behind, and each step has to run in order.
 * Zustand calls this once and would otherwise leave that to us.
 */
function migrate(persisted: unknown, from: number): unknown {
  if (from > CURRENT_SCHEMA_VERSION) {
    // Written by a newer build — another tab, or a cached bundle. Reading it
    // with older code and writing it back would silently drop the fields this
    // build knows nothing about.
    throw new RangeError(
      `stored data is version ${from}, this build only understands ${CURRENT_SCHEMA_VERSION}`,
    );
  }

  return applyMigrations(persisted, from, CURRENT_SCHEMA_VERSION);
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set) => ({
      decks: [],
      pools: [],

      addDeck: (name) => {
        const deck = createDeck({ name }, deps);

        // `addDeckToLibrary` returns a new library rather than touching the one
        // it is given, so `set` always receives a reference Zustand can tell
        // apart from the previous one. Mutating here would leave the data
        // correct and the screen stale, which is far harder to diagnose than a
        // crash.
        set((state) => addDeckToLibrary(state, deck));
      },

      // `deleteDeck` hands back the very same library when the deck was not
      // there, so a pointless removal costs no render at all.
      removeDeck: (deckId) => {
        set((state) => deleteDeck(state, deckId));
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_SCHEMA_VERSION,
      migrate,
      // Only the data. Without this, Zustand would try to serialise the actions
      // too — JSON drops functions without a word, and the stored shape would
      // quietly stop matching what the code declares.
      partialize: ({ decks, pools }) => ({ decks, pools }),
    },
  ),
);

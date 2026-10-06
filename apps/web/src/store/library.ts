import type { DeckId, DrawResult, Library, Pool, PoolId } from "@deck-roulette/domain";
import {
  CURRENT_SCHEMA_VERSION,
  addDeck as addDeckToLibrary,
  addPool as addPoolToLibrary,
  applyMigrations,
  createDeck,
  createPool,
  deleteDeck,
  deletePool,
  drawDeck,
  resetPool,
} from "@deck-roulette/domain";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type LibraryState = Library & {
  readonly addDeck: (name: string) => void;
  readonly removeDeck: (deckId: DeckId) => void;
  readonly addPool: (name: string) => void;
  readonly removePool: (poolId: PoolId) => void;
  readonly drawFromPool: (poolId: PoolId) => DrawResult;
  readonly resetPool: (poolId: PoolId) => void;
};

const deps = {
  newId: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
};

function replacePool(library: Library, pool: Pool): Library {
  return { ...library, pools: library.pools.map((p) => (p.id === pool.id ? pool : p)) };
}

function findPool(library: Library, poolId: PoolId): Pool {
  const pool = library.pools.find((p) => p.id === poolId);
  if (pool === undefined) throw new RangeError(`no pool with id ${poolId}`);
  return pool;
}

/** Changing it orphans everyone's data. */
export const STORAGE_KEY = "deck-roulette";

/** Zustand calls this once; the domain runs every step in order. */
function migrate(persisted: unknown, from: number): unknown {
  if (from > CURRENT_SCHEMA_VERSION) {
    // Written by a newer build: writing it back would drop fields this build does not know.
    throw new RangeError(
      `stored data is version ${from}, this build only understands ${CURRENT_SCHEMA_VERSION}`,
    );
  }

  return applyMigrations(persisted, from, CURRENT_SCHEMA_VERSION);
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      decks: [],
      pools: [],

      addDeck: (name) => {
        const deck = createDeck({ name }, deps);

        // Never mutate: the data would be right and the screen stale.
        set((state) => addDeckToLibrary(state, deck));
      },

      removeDeck: (deckId) => {
        set((state) => deleteDeck(state, deckId));
      },

      addPool: (name) => {
        const pool = createPool(name, deps);
        set((state) => addPoolToLibrary(state, pool));
      },

      removePool: (poolId) => {
        set((state) => deletePool(state, poolId));
      },

      drawFromPool: (poolId) => {
        const result = drawDeck(findPool(get(), poolId), Math.random);
        if (result.status === "drawn") set((state) => replacePool(state, result.pool));
        return result;
      },

      resetPool: (poolId) => {
        set((state) => replacePool(state, resetPool(findPool(state, poolId))));
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_SCHEMA_VERSION,
      migrate,
      // Only the data: anything added to the store later is not stored by accident.
      partialize: ({ decks, pools }) => ({ decks, pools }),
    },
  ),
);

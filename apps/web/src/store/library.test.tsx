import { CURRENT_SCHEMA_VERSION, addDeckToPool, toDeckId } from "@deck-roulette/domain";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, useLibrary } from "./library";

/** Only the store can render it: on the real screen, other renders hide a stale store. */
function DeckCounter() {
  const decks = useLibrary((state) => state.decks);
  const addDeck = useLibrary((state) => state.addDeck);

  return (
    <>
      <p>on screen: {decks.length}</p>
      <button type="button" onClick={() => addDeck("Atraxa")}>
        Add
      </button>
    </>
  );
}

/** A pool holding one deck, until the store can put decks in pools itself. */
function poolWithOneDeck() {
  useLibrary.getState().addDeck("Atraxa");
  useLibrary.getState().addPool("Thursday table");
  const { decks, pools } = useLibrary.getState();
  const [deck] = decks;
  const [pool] = pools;

  if (deck === undefined || pool === undefined) throw new Error("setup failed");

  useLibrary.setState({ pools: [addDeckToPool(pool, deck.id)] });
  return { deckId: deck.id, poolId: pool.id };
}

function stored(): { state: Record<string, unknown>; version: number } {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) throw new Error("nothing was stored");

  return JSON.parse(raw) as { state: Record<string, unknown>; version: number };
}

describe("useLibrary", () => {
  // The store is a module singleton: without this, tests depend on their order.
  beforeEach(() => {
    localStorage.clear();
    useLibrary.setState({ decks: [], pools: [] });
  });

  describe("adding a deck", () => {
    it("re-renders the components reading the library", async () => {
      const user = userEvent.setup();
      render(<DeckCounter />);

      await user.click(screen.getByRole("button", { name: "Add" }));

      // The second assertion is the one that catches a mutation.
      expect(useLibrary.getState().decks).toHaveLength(1);
      expect(screen.getByText("on screen: 1")).toBeDefined();
    });
  });

  describe("removing a deck", () => {
    it("takes the deck out of the library", () => {
      useLibrary.getState().addDeck("Atraxa");
      const [deck] = useLibrary.getState().decks;

      if (deck === undefined) throw new Error("the deck was not added");

      useLibrary.getState().removeDeck(deck.id);

      expect(useLibrary.getState().decks).toHaveLength(0);
    });

    it("leaves the library untouched when the deck is not there", () => {
      useLibrary.getState().addDeck("Atraxa");
      const before = useLibrary.getState().decks;

      useLibrary.getState().removeDeck(toDeckId("nope"));

      expect(useLibrary.getState().decks).toBe(before);
    });
  });

  describe("adding a pool", () => {
    it("adds an empty pool to the library", () => {
      useLibrary.getState().addPool("Thursday table");

      expect(useLibrary.getState().pools).toMatchObject([
        { name: "Thursday table", deckIds: [], drawnDeckIds: [] },
      ]);
    });
  });

  describe("removing a pool", () => {
    it("takes the pool out and keeps its decks in the library", () => {
      useLibrary.getState().addDeck("Atraxa");
      useLibrary.getState().addPool("Thursday table");
      const [pool] = useLibrary.getState().pools;

      if (pool === undefined) throw new Error("the pool was not added");

      useLibrary.getState().removePool(pool.id);

      expect(useLibrary.getState().pools).toHaveLength(0);
      expect(useLibrary.getState().decks).toHaveLength(1);
    });
  });

  describe("drawing from a pool", () => {
    it("returns the drawn deck and marks it as drawn", () => {
      const { deckId, poolId } = poolWithOneDeck();

      const result = useLibrary.getState().drawFromPool(poolId);

      expect(result).toMatchObject({ status: "drawn", deckId });
      expect(useLibrary.getState().pools[0]?.drawnDeckIds).toEqual([deckId]);
    });

    it("reports an empty pool without changing it", () => {
      useLibrary.getState().addPool("Thursday table");
      const before = useLibrary.getState().pools;
      const [pool] = before;

      if (pool === undefined) throw new Error("setup failed");

      expect(useLibrary.getState().drawFromPool(pool.id)).toEqual({ status: "empty" });
      expect(useLibrary.getState().pools).toBe(before);
    });

    it("reports an exhausted pool without changing it", () => {
      const { poolId } = poolWithOneDeck();
      useLibrary.getState().drawFromPool(poolId);
      const before = useLibrary.getState().pools;

      expect(useLibrary.getState().drawFromPool(poolId)).toEqual({ status: "exhausted" });
      expect(useLibrary.getState().pools).toBe(before);
    });
  });

  describe("starting a new cycle", () => {
    it("makes every deck drawable again", () => {
      const { poolId } = poolWithOneDeck();
      useLibrary.getState().drawFromPool(poolId);

      useLibrary.getState().resetPool(poolId);

      expect(useLibrary.getState().pools[0]?.drawnDeckIds).toEqual([]);
    });
  });

  describe("persistence", () => {
    it("writes the library to storage as soon as it changes", () => {
      useLibrary.getState().addDeck("Atraxa");

      expect(stored().state["decks"]).toHaveLength(1);
    });

    it("stamps what it writes with the schema version", () => {
      useLibrary.getState().addDeck("Atraxa");

      expect(stored().version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it("stores the data and not the actions", () => {
      useLibrary.getState().addDeck("Atraxa");

      expect(Object.keys(stored().state).toSorted()).toEqual(["decks", "pools"]);
    });

    it("reads back what it wrote", async () => {
      useLibrary.getState().addDeck("Atraxa");

      // Kept aside first: `persist` saves on every `set`, emptying would overwrite it.
      const written = localStorage.getItem(STORAGE_KEY);
      useLibrary.setState({ decks: [] });
      if (written !== null) localStorage.setItem(STORAGE_KEY, written);

      await useLibrary.persist.rehydrate();

      expect(useLibrary.getState().decks).toHaveLength(1);
      expect(useLibrary.getState().decks[0]?.name).toBe("Atraxa");
    });

    it("starts empty when storage holds nothing", async () => {
      await useLibrary.persist.rehydrate();

      expect(useLibrary.getState().decks).toEqual([]);
    });

    it("refuses data written by a newer build rather than guessing", async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          state: { decks: [{ id: toDeckId("d1"), name: "From the future" }], pools: [] },
          version: CURRENT_SCHEMA_VERSION + 1,
        }),
      );

      await useLibrary.persist.rehydrate();

      expect(useLibrary.getState().decks).toEqual([]);
    });
  });
});

import { CURRENT_SCHEMA_VERSION, toDeckId } from "@deck-roulette/domain";
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

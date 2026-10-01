import { CURRENT_SCHEMA_VERSION, toDeckId } from "@deck-roulette/domain";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, useLibrary } from "./library";

/**
 * No local state, nothing else able to trigger a render. Only the store.
 *
 * That isolation is the point: on the real screen, clearing the text field
 * re-renders for an unrelated reason and hides a stale store behind it. This
 * component has nothing to hide behind.
 */
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
  // A store is a module-level singleton: it is created once, on the first
  // import, and survives every component that reads it. Without this reset,
  // each test inherits whatever the previous one left behind, and failures
  // start depending on the order tests happen to run in.
  beforeEach(() => {
    localStorage.clear();
    useLibrary.setState({ decks: [], pools: [] });
  });

  describe("adding a deck", () => {
    it("re-renders the components reading the library", async () => {
      const user = userEvent.setup();
      render(<DeckCounter />);

      await user.click(screen.getByRole("button", { name: "Add" }));

      // Both assertions matter, and the second is the one that catches a
      // mutation: a store updated in place holds the right data while the
      // screen still shows the old count.
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

      // The very same array, not merely an equal one: an unnecessary new
      // reference would re-render every subscriber for nothing.
      expect(useLibrary.getState().decks).toBe(before);
    });
  });

  describe("persistence", () => {
    it("writes the library to storage as soon as it changes", () => {
      useLibrary.getState().addDeck("Atraxa");

      expect(stored().state["decks"]).toHaveLength(1);
    });

    it("stamps what it writes with the schema version", () => {
      useLibrary.getState().addDeck("Atraxa");

      // Without the stamp, the next shape change would have nothing to migrate
      // from: the data would be of unknown age.
      expect(stored().version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it("stores the data and not the actions", () => {
      useLibrary.getState().addDeck("Atraxa");

      // JSON drops functions in silence. What matters is not today's actions,
      // which would vanish anyway, but tomorrow's interface state — a search
      // term, a selected pool — which would be stored without anyone deciding
      // so, and come back on the next visit.
      expect(Object.keys(stored().state).toSorted()).toEqual(["decks", "pools"]);
    });

    it("reads back what it wrote", async () => {
      useLibrary.getState().addDeck("Atraxa");

      // The written payload has to be kept aside before the store is emptied:
      // `persist` saves on every `set`, so clearing the state in the test would
      // overwrite storage with the emptiness we are about to read back.
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

      // Reading it with older code and writing it back would drop whatever
      // fields this build knows nothing about. An empty screen is recoverable;
      // someone's decks are not.
      expect(useLibrary.getState().decks).toEqual([]);
    });
  });
});

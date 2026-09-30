import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { toDeckId } from "@deck-roulette/domain";
import { useLibrary } from "./library";

/**
 * No local state, nothing else able to trigger a render. Only the store.
 *
 * That isolation is the point: in the real screen, clearing the text field
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

describe("useLibrary", () => {
  // A store is a module-level singleton: without this, each test inherits
  // whatever the previous one left behind.
  beforeEach(() => {
    useLibrary.setState({ decks: [], pools: [] });
  });

  it("re-renders when a deck is added", async () => {
    const user = userEvent.setup();
    render(<DeckCounter />);

    await user.click(screen.getByRole("button", { name: "Add" }));

    // Both assertions matter, and the second is the one that catches a
    // mutation: a store updated in place holds the right data while the screen
    // still shows the old count.
    expect(useLibrary.getState().decks).toHaveLength(1);
    expect(screen.getByText("on screen: 1")).toBeDefined();
  });
});

describe("removing a deck", () => {
  beforeEach(() => {
    useLibrary.setState({ decks: [], pools: [] });
  });

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

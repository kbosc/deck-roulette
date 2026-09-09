import { describe, expect, it } from "vitest";
import { deleteDeck } from "./library";
import type { Library } from "./library";
import { makeDeck, makePool } from "./test-utils";

function makeLibrary(): Library {
  return {
    decks: [makeDeck({ id: "a" }), makeDeck({ id: "b" }), makeDeck({ id: "c" })],
    pools: [
      makePool({ id: "chill", deckIds: ["a", "b"], drawnDeckIds: ["a"] }),
      makePool({ id: "thursday", deckIds: ["a", "c"] }),
      makePool({ id: "cedh", deckIds: ["c"] }),
    ],
  };
}

describe("deleteDeck", () => {
  it("drops the deck from the deck list", () => {
    const library = deleteDeck(makeLibrary(), "a");

    expect(library.decks.map((deck) => deck.id)).toEqual(["b", "c"]);
  });

  it("drops the deck from every pool holding it", () => {
    const library = deleteDeck(makeLibrary(), "a");

    expect(library.pools.map((pool) => pool.deckIds)).toEqual([["b"], ["c"], ["c"]]);
  });

  it("drops the deck from the decks already drawn too", () => {
    const library = deleteDeck(makeLibrary(), "a");

    expect(library.pools[0]?.drawnDeckIds).toEqual([]);
  });

  it("leaves untouched pools with their identity, so they do not re-render", () => {
    const before = makeLibrary();

    const after = deleteDeck(before, "a");

    // "cedh" never held deck "a".
    expect(after.pools[2]).toBe(before.pools[2]);
    expect(after.pools[0]).not.toBe(before.pools[0]);
  });

  it("returns the same reference when the deck does not exist", () => {
    const library = makeLibrary();

    expect(deleteDeck(library, "zzz")).toBe(library);
  });

  it("does not mutate the given library", () => {
    const library = makeLibrary();

    deleteDeck(library, "a");

    expect(library).toEqual(makeLibrary());
  });

  it("empties a pool whose only deck is deleted", () => {
    const library = deleteDeck(makeLibrary(), "c");

    expect(library.pools[2]?.deckIds).toEqual([]);
  });
});

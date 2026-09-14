import { describe, expect, it } from "vitest";
import { addDeck, deleteDeck, deletePool } from "./library";
import type { Library } from "./library";
import { toDeckId, toPoolId } from "./ids";
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
    const library = deleteDeck(makeLibrary(), toDeckId("a"));

    expect(library.decks.map((deck) => deck.id)).toEqual(["b", "c"]);
  });

  it("drops the deck from every pool holding it", () => {
    const library = deleteDeck(makeLibrary(), toDeckId("a"));

    expect(library.pools.map((pool) => pool.deckIds)).toEqual([["b"], ["c"], ["c"]]);
  });

  it("drops the deck from the decks already drawn too", () => {
    const library = deleteDeck(makeLibrary(), toDeckId("a"));

    expect(library.pools[0]?.drawnDeckIds).toEqual([]);
  });

  it("leaves untouched pools with their identity, so they do not re-render", () => {
    const before = makeLibrary();

    const after = deleteDeck(before, toDeckId("a"));

    // "cedh" never held deck "a".
    expect(after.pools[2]).toBe(before.pools[2]);
    expect(after.pools[0]).not.toBe(before.pools[0]);
  });

  it("returns the same reference when the deck does not exist", () => {
    const library = makeLibrary();

    expect(deleteDeck(library, toDeckId("zzz"))).toBe(library);
  });

  it("does not mutate the given library", () => {
    const library = makeLibrary();

    deleteDeck(library, toDeckId("a"));

    expect(library).toEqual(makeLibrary());
  });

  it("empties a pool whose only deck is deleted", () => {
    const library = deleteDeck(makeLibrary(), toDeckId("c"));

    expect(library.pools[2]?.deckIds).toEqual([]);
  });
});

describe("addDeck", () => {
  it("appends the deck to the library", () => {
    const library = addDeck(makeLibrary(), makeDeck({ id: "d" }));

    expect(library.decks.map((deck) => deck.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("puts the deck in no pool at all", () => {
    const before = makeLibrary();

    const after = addDeck(before, makeDeck({ id: "d" }));

    expect(after.pools).toEqual(before.pools);
  });

  it("does not mutate the given library", () => {
    const library = makeLibrary();

    addDeck(library, makeDeck({ id: "d" }));

    expect(library.decks).toHaveLength(3);
  });
});

describe("deletePool", () => {
  it("drops the pool", () => {
    const library = deletePool(makeLibrary(), toPoolId("chill"));

    expect(library.pools.map((pool) => pool.id)).toEqual(["thursday", "cedh"]);
  });

  it("keeps every deck the pool referenced", () => {
    const before = makeLibrary();

    const after = deletePool(before, toPoolId("chill"));

    // A pool references decks, it does not own them: "a" and "b" live on.
    expect(after.decks).toBe(before.decks);
  });

  it("leaves the surviving pools with their identity", () => {
    const before = makeLibrary();

    const after = deletePool(before, toPoolId("chill"));

    expect(after.pools[0]).toBe(before.pools[1]);
  });

  it("returns the same reference when the pool does not exist", () => {
    const library = makeLibrary();

    expect(deletePool(library, toPoolId("zzz"))).toBe(library);
  });

  it("does not mutate the given library", () => {
    const library = makeLibrary();

    deletePool(library, toPoolId("chill"));

    expect(library).toEqual(makeLibrary());
  });
});

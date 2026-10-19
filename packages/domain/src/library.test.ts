import { describe, expect, it } from "vitest";
import { addDeck, addPool, deleteDeck, deletePool, updateDeck } from "./library";
import type { DeckEdit, Library } from "./library";
import { toDeckId, toPoolId } from "./ids";
import { makeDeck, makePool } from "./test-utils";

function makeLibrary(): Library {
  return {
    decks: [
      makeDeck({ id: "a", name: "Atraxa" }),
      makeDeck({ id: "b", name: "Krenko" }),
      makeDeck({ id: "c", name: "Edgar" }),
    ],
    pools: [
      makePool({ id: "chill", name: "Chill night", deckIds: ["a", "b"], drawnDeckIds: ["a"] }),
      makePool({ id: "thursday", name: "Thursday table", deckIds: ["a", "c"] }),
      makePool({ id: "cedh", name: "cEDH", deckIds: ["c"] }),
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
  it("refuses a deck whose name is already taken, whatever its case", () => {
    expect(() => addDeck(makeLibrary(), makeDeck({ id: "d", name: "kRENKO" }))).toThrow(
      "a deck with this name already exists",
    );
  });

  it("appends the deck to the library", () => {
    const library = addDeck(makeLibrary(), makeDeck({ id: "d", name: "Tymna" }));

    expect(library.decks.map((deck) => deck.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("puts the deck in no pool at all", () => {
    const before = makeLibrary();

    const after = addDeck(before, makeDeck({ id: "d", name: "Tymna" }));

    expect(after.pools).toEqual(before.pools);
  });

  it("does not mutate the given library", () => {
    const library = makeLibrary();

    addDeck(library, makeDeck({ id: "d" }));

    expect(library.decks).toHaveLength(3);
  });
});

describe("addPool", () => {
  it("appends the pool to the library", () => {
    const library = addPool(makeLibrary(), makePool({ id: "new", name: "Sunday brunch" }));

    expect(library.pools.map((pool) => pool.id)).toEqual(["chill", "thursday", "cedh", "new"]);
  });

  it("refuses a pool whose name is already taken, whatever its case", () => {
    expect(() => addPool(makeLibrary(), makePool({ id: "new", name: "thursday TABLE" }))).toThrow(
      "a pool with this name already exists",
    );
  });

  it("accepts a pool named like a deck: the two never meet in a list", () => {
    const library = addPool(makeLibrary(), makePool({ id: "new", name: "Krenko" }));

    expect(library.pools).toHaveLength(4);
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

/** Atraxa with every detail set, to see what an edit keeps and what it unsets. */
function makeEditableLibrary(): Library {
  return {
    decks: [
      makeDeck({
        id: "a",
        name: "Atraxa",
        commanders: ["Atraxa, Praetors' Voice"],
        colors: ["W", "U", "B", "G"],
        bracket: 3,
        url: "https://archidekt.com/decks/1",
      }),
      makeDeck({ id: "b", name: "Krenko" }),
    ],
    pools: [makePool({ id: "chill", deckIds: ["a", "b"], drawnDeckIds: ["a"] })],
  };
}

const A = toDeckId("a");

function deckA(library: Library) {
  return library.decks.find((deck) => deck.id === A);
}

describe("updateDeck", () => {
  it("replaces what the form edits", () => {
    const library = updateDeck(makeEditableLibrary(), A, {
      name: "Tana and Tymna",
      commanders: ["Tana, the Bloodsower", "Tymna the Weaver"],
      colors: ["W", "B", "R", "G"],
      bracket: 2,
    });

    expect(deckA(library)).toMatchObject({
      name: "Tana and Tymna",
      commanders: ["Tana, the Bloodsower", "Tymna the Weaver"],
      colors: ["W", "B", "R", "G"],
      bracket: 2,
    });
  });

  it("keeps what the form does not edit: id, creation date, link", () => {
    const before = deckA(makeEditableLibrary());

    const after = deckA(updateDeck(makeEditableLibrary(), A, { name: "Atraxa" }));

    expect(after?.id).toBe(before?.id);
    expect(after?.createdAt).toBe(before?.createdAt);
    expect(after?.url).toBe(before?.url);
  });

  it("unsets a detail left out of the edit", () => {
    const deck = deckA(updateDeck(makeEditableLibrary(), A, { name: "Atraxa" }));

    expect(deck).not.toHaveProperty("commanders");
    expect(deck).not.toHaveProperty("colors");
    expect(deck).not.toHaveProperty("bracket");
  });

  it("trims the name and the commanders", () => {
    const deck = deckA(
      updateDeck(makeEditableLibrary(), A, { name: " Atraxa ", commanders: [" Atraxa "] }),
    );

    expect(deck?.name).toBe("Atraxa");
    expect(deck?.commanders).toEqual(["Atraxa"]);
  });

  it("refuses an empty name", () => {
    expect(() => updateDeck(makeEditableLibrary(), A, { name: "  " })).toThrow(TypeError);
  });

  it("refuses the name of another deck, whatever its case", () => {
    expect(() => updateDeck(makeEditableLibrary(), A, { name: "krenko" })).toThrow(TypeError);
  });

  it("lets a deck keep its own name, or change only its case", () => {
    expect(deckA(updateDeck(makeEditableLibrary(), A, { name: "ATRAXA" }))?.name).toBe("ATRAXA");
  });

  it("refuses a blank commander", () => {
    expect(() =>
      updateDeck(makeEditableLibrary(), A, { name: "Atraxa", commanders: [" "] }),
    ).toThrow(TypeError);
  });

  it("trims and checks the second commander too", () => {
    const edit: DeckEdit = { name: "Tana and Tymna", commanders: ["Tana", " Tymna "] };
    expect(deckA(updateDeck(makeEditableLibrary(), A, edit))?.commanders).toEqual([
      "Tana",
      "Tymna",
    ]);

    expect(() =>
      updateDeck(makeEditableLibrary(), A, { name: "Tana and Tymna", commanders: ["Tana", "  "] }),
    ).toThrow(TypeError);
  });

  it("reads no color at all as not set, not as colorless", () => {
    const deck = deckA(updateDeck(makeEditableLibrary(), A, { name: "Atraxa", colors: [] }));

    expect(deck).not.toHaveProperty("colors");
  });

  it("orders the colors as players read them, without colorless next to a color", () => {
    const deck = deckA(
      updateDeck(makeEditableLibrary(), A, { name: "Atraxa", colors: ["G", "C", "W"] }),
    );

    expect(deck?.colors).toEqual(["W", "G"]);
  });

  it("refuses a deck that does not exist", () => {
    expect(() => updateDeck(makeEditableLibrary(), toDeckId("zzz"), { name: "Ghost" })).toThrow(
      RangeError,
    );
  });

  it("leaves the other decks and the pools as they were, by reference", () => {
    const before = makeEditableLibrary();

    const after = updateDeck(before, A, { name: "Atraxa" });

    expect(after.decks[1]).toBe(before.decks[1]);
    expect(after.pools).toBe(before.pools);
  });

  it("does not mutate the given library", () => {
    const library = makeEditableLibrary();

    updateDeck(library, A, { name: "Renamed", bracket: 5 });

    expect(library).toEqual(makeEditableLibrary());
  });
});

import { describe, expect, it } from "vitest";
import { addDeckToPool, removeDeckFromPool } from "./pool";
import { getPoolDrawState, getRemainingDeckIds } from "./draw";
import { makePool } from "./test-utils";

describe("addDeckToPool", () => {
  it("appends the deck at the end of the list", () => {
    const pool = makePool({ deckIds: ["a", "b"] });

    expect(addDeckToPool(pool, "c").deckIds).toEqual(["a", "b", "c"]);
  });

  it("makes the added deck drawable right away", () => {
    const pool = makePool({ deckIds: ["a"], drawnDeckIds: ["a"] });

    expect(getPoolDrawState(addDeckToPool(pool, "b"))).toBe("ready");
  });

  it("returns the same reference when the deck is already there", () => {
    const pool = makePool({ deckIds: ["a", "b"] });

    expect(addDeckToPool(pool, "a")).toBe(pool);
  });

  it("does not mutate the given pool", () => {
    const pool = makePool({ deckIds: ["a"] });

    addDeckToPool(pool, "b");

    expect(pool.deckIds).toEqual(["a"]);
  });
});

describe("removeDeckFromPool", () => {
  it("drops the deck from the list", () => {
    const pool = makePool({ deckIds: ["a", "b", "c"] });

    expect(removeDeckFromPool(pool, "b").deckIds).toEqual(["a", "c"]);
  });

  it("also drops it from the decks already drawn", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a", "b"] });

    expect(removeDeckFromPool(pool, "a")).toMatchObject({
      deckIds: ["b"],
      drawnDeckIds: ["b"],
    });
  });

  it("leaves no trace behind when the deck is added back", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a"] });

    const restored = addDeckToPool(removeDeckFromPool(pool, "a"), "a");

    // Would fail if `drawnDeckIds` still held "a": the deck would come back
    // already flagged as drawn.
    expect(getRemainingDeckIds(restored)).toEqual(["b", "a"]);
  });

  it("keeps the other decks drawn during this cycle", () => {
    const pool = makePool({ deckIds: ["a", "b", "c"], drawnDeckIds: ["a", "b"] });

    expect(removeDeckFromPool(pool, "a").drawnDeckIds).toEqual(["b"]);
  });

  it("returns the same reference when the deck is not in the pool", () => {
    const pool = makePool({ deckIds: ["a"] });

    expect(removeDeckFromPool(pool, "zzz")).toBe(pool);
  });

  it("does not mutate the given pool", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a"] });

    removeDeckFromPool(pool, "a");

    expect(pool).toEqual(
      makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a"] }),
    );
  });

  it("empties the pool when its last deck is removed", () => {
    const pool = makePool({ deckIds: ["a"], drawnDeckIds: ["a"] });

    expect(getPoolDrawState(removeDeckFromPool(pool, "a"))).toBe("empty");
  });
});

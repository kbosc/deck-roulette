import { describe, expect, it } from "vitest";
import {
  drawDeck,
  getPoolDrawState,
  getRemainingDeckIds,
  resetPool,
  returnDeckToPool,
} from "./draw";
import { toDeckId } from "./ids";
import { makePool } from "./test-utils";

describe("getRemainingDeckIds", () => {
  it("returns the decks that have not been drawn yet", () => {
    const pool = makePool({ deckIds: ["a", "b", "c"], drawnDeckIds: ["b"] });

    expect(getRemainingDeckIds(pool)).toEqual(["a", "c"]);
  });
});

describe("getPoolDrawState", () => {
  it("reports an empty pool", () => {
    expect(getPoolDrawState(makePool())).toBe("empty");
  });

  it("reports an exhausted pool", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a", "b"] });

    expect(getPoolDrawState(pool)).toBe("exhausted");
  });

  it("reports a pool that can still be drawn from", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a"] });

    expect(getPoolDrawState(pool)).toBe("ready");
  });
});

describe("drawDeck", () => {
  it("returns the empty status when the pool holds no deck", () => {
    expect(drawDeck(makePool(), () => 0)).toEqual({ status: "empty" });
  });

  it("returns the exhausted status when every deck has been drawn", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a", "b"] });

    expect(drawDeck(pool, () => 0)).toEqual({ status: "exhausted" });
  });

  it("draws the first remaining deck when random() returns 0", () => {
    const pool = makePool({ deckIds: ["a", "b", "c"], drawnDeckIds: ["a"] });

    const result = drawDeck(pool, () => 0);

    expect(result).toEqual({
      status: "drawn",
      deckId: "b",
      pool: { ...pool, drawnDeckIds: ["a", "b"] },
    });
  });

  it("draws the last remaining deck when random() approaches 1", () => {
    const pool = makePool({ deckIds: ["a", "b", "c"] });

    const result = drawDeck(pool, () => 0.999);

    expect(result).toMatchObject({ status: "drawn", deckId: "c" });
  });

  it("does not mutate the given pool", () => {
    const pool = makePool({ deckIds: ["a"] });

    drawDeck(pool, () => 0);

    expect(pool.drawnDeckIds).toEqual([]);
  });

  it("eventually draws every deck exactly once", () => {
    let current = makePool({ deckIds: ["a", "b", "c"] });
    const drawn: string[] = [];

    for (let i = 0; i < 3; i++) {
      const result = drawDeck(current, Math.random);
      if (result.status !== "drawn") throw new Error(`draw ${i}: ${result.status}`);
      drawn.push(result.deckId);
      current = result.pool;
    }

    expect(drawn.toSorted()).toEqual(["a", "b", "c"]);
    expect(drawDeck(current, Math.random)).toEqual({ status: "exhausted" });
  });

  it("maps the whole [0, 1) range onto the remaining decks", () => {
    const pool = makePool({ deckIds: ["a", "b", "c", "d"] });
    // Four decks means each one owns exactly a quarter of the range. Both edges
    // of every quarter are checked, which is where off-by-one bugs live.
    const cases: ReadonlyArray<readonly [number, string]> = [
      [0, "a"],
      [0.249, "a"],
      [0.25, "b"],
      [0.499, "b"],
      [0.5, "c"],
      [0.749, "c"],
      [0.75, "d"],
      [0.999, "d"],
    ];

    for (const [value, expected] of cases) {
      expect(drawDeck(pool, () => value)).toMatchObject({
        status: "drawn",
        deckId: expected,
      });
    }
  });

  it("rejects an out-of-contract source of randomness", () => {
    const pool = makePool({ deckIds: ["a"] });

    expect(() => drawDeck(pool, () => 1)).toThrow(RangeError);
  });
});

describe("resetPool", () => {
  it("clears the decks drawn during the cycle", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a", "b"] });

    expect(resetPool(pool)).toEqual({ ...pool, drawnDeckIds: [] });
  });

  it("resets a pool that is not exhausted yet", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a"] });

    expect(resetPool(pool).drawnDeckIds).toEqual([]);
  });

  it("makes every deck drawable again", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a", "b"] });

    expect(getPoolDrawState(resetPool(pool))).toBe("ready");
  });

  it("does not mutate the given pool", () => {
    const pool = makePool({ deckIds: ["a"], drawnDeckIds: ["a"] });

    resetPool(pool);

    expect(pool.drawnDeckIds).toEqual(["a"]);
  });

  it("returns a new reference when it actually clears something", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a"] });

    expect(resetPool(pool)).not.toBe(pool);
  });

  it("returns the same reference when there is nothing to clear", () => {
    const pool = makePool({ deckIds: ["a", "b"] });

    // `toBe` is reference equality, unlike `toEqual` which compares content.
    // A new object here would re-render every subscriber for no reason.
    expect(resetPool(pool)).toBe(pool);
  });

  it("leaves an empty pool empty", () => {
    expect(getPoolDrawState(resetPool(makePool()))).toBe("empty");
  });
});

describe("returnDeckToPool", () => {
  it("makes the deck drawable again", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a"] });

    expect(getRemainingDeckIds(returnDeckToPool(pool, toDeckId("a")))).toEqual(["a", "b"]);
  });

  it("leaves the pool membership alone", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a"] });

    expect(returnDeckToPool(pool, toDeckId("a")).deckIds).toEqual(["a", "b"]);
  });

  it("keeps the other draws of the cycle", () => {
    const pool = makePool({ deckIds: ["a", "b", "c"], drawnDeckIds: ["a", "b"] });

    expect(returnDeckToPool(pool, toDeckId("a")).drawnDeckIds).toEqual(["b"]);
  });

  it("brings an exhausted pool back to ready", () => {
    const pool = makePool({ deckIds: ["a"], drawnDeckIds: ["a"] });

    expect(getPoolDrawState(returnDeckToPool(pool, toDeckId("a")))).toBe("ready");
  });

  it("returns the same reference when the deck was not drawn", () => {
    const pool = makePool({ deckIds: ["a", "b"], drawnDeckIds: ["a"] });

    expect(returnDeckToPool(pool, toDeckId("b"))).toBe(pool);
  });

  it("does not mutate the given pool", () => {
    const pool = makePool({ deckIds: ["a"], drawnDeckIds: ["a"] });

    returnDeckToPool(pool, toDeckId("a"));

    expect(pool.drawnDeckIds).toEqual(["a"]);
  });

  it("cancels an actual draw", () => {
    const pool = makePool({ deckIds: ["a", "b"] });

    const result = drawDeck(pool, () => 0);
    if (result.status !== "drawn") throw new Error(result.status);

    expect(returnDeckToPool(result.pool, result.deckId)).toEqual(pool);
  });
});

import { describe, expect, it } from "vitest";
import { createDeck, createPool } from "./creation";
import type { CreationDeps } from "./creation";
import { getPoolDrawState } from "./draw";

/**
 * Deterministic dependencies: ids are handed out in order, the clock is frozen.
 * This is exactly why they are injected — real `crypto.randomUUID` and `Date`
 * would make the expected values impossible to write down.
 */
function makeDeps(): CreationDeps {
  let count = 0;
  return {
    newId: () => `id-${++count}`,
    now: () => "2026-09-10T12:00:00.000Z",
  };
}

describe("createDeck", () => {
  it("fills in the identifier and the creation date", () => {
    const deck = createDeck({ name: "Atraxa" }, makeDeps());

    expect(deck).toEqual({
      id: "id-1",
      name: "Atraxa",
      createdAt: "2026-09-10T12:00:00.000Z",
    });
  });

  it("keeps the optional fields it is given", () => {
    const deck = createDeck(
      { name: "Thrasios & Tymna", commanders: ["Thrasios", "Tymna"], bracket: 5 },
      makeDeps(),
    );

    expect(deck).toMatchObject({ commanders: ["Thrasios", "Tymna"], bracket: 5 });
  });

  it("trims the name", () => {
    expect(createDeck({ name: "  Krenko  " }, makeDeps()).name).toBe("Krenko");
  });

  it("rejects a name made of spaces only", () => {
    expect(() => createDeck({ name: "   " }, makeDeps())).toThrow(TypeError);
  });

  it("hands out a different id to every deck", () => {
    const deps = makeDeps();

    const first = createDeck({ name: "Atraxa" }, deps);
    const second = createDeck({ name: "Krenko" }, deps);

    expect(first.id).not.toBe(second.id);
  });
});

describe("createPool", () => {
  it("creates an empty pool", () => {
    const pool = createPool("Thursday table", makeDeps());

    expect(pool).toEqual({
      id: "id-1",
      name: "Thursday table",
      deckIds: [],
      drawnDeckIds: [],
      createdAt: "2026-09-10T12:00:00.000Z",
    });
  });

  it("reports the fresh pool as empty rather than ready", () => {
    expect(getPoolDrawState(createPool("Thursday table", makeDeps()))).toBe("empty");
  });

  it("trims the name", () => {
    expect(createPool("  cEDH  ", makeDeps()).name).toBe("cEDH");
  });

  it("rejects a name made of spaces only", () => {
    expect(() => createPool("   ", makeDeps())).toThrow(TypeError);
  });
});

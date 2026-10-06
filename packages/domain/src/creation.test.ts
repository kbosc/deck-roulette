import { describe, expect, it } from "vitest";
import { createDeck, createPool, validateName } from "./creation";
import type { CreationDeps } from "./creation";
import { getPoolDrawState } from "./draw";

/** Ids handed out in order, clock frozen. */
function makeDeps(): CreationDeps {
  let count = 0;
  return {
    newId: () => `id-${++count}`,
    now: () => "2026-09-10T12:00:00.000Z",
  };
}

describe("validateName", () => {
  const existing = ["Atraxa", "Krenko"];

  it("accepts a new name", () => {
    expect(validateName("Edgar", existing)).toBeNull();
  });

  it("accepts a name surrounded by spaces, since creating it trims them", () => {
    expect(validateName("  Edgar  ", existing)).toBeNull();
  });

  it("reports an empty name", () => {
    expect(validateName("", existing)).toBe("empty");
  });

  it("reports a name made of spaces only as empty", () => {
    expect(validateName("   ", existing)).toBe("empty");
  });

  it("reports a name already taken", () => {
    expect(validateName("Atraxa", existing)).toBe("duplicate");
  });

  it("ignores case: atraxa and Atraxa are the same deck", () => {
    expect(validateName("aTRAXA", existing)).toBe("duplicate");
  });

  it("ignores the spaces around a taken name", () => {
    expect(validateName("  Krenko ", existing)).toBe("duplicate");
  });

  it("keeps accents meaningful: Éowyn is not Eowyn", () => {
    expect(validateName("Eowyn", ["Éowyn"])).toBeNull();
  });
});

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

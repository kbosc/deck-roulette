import { describe, expect, it } from "vitest";
import type { Migration } from "./persistence";
import {
  CURRENT_SCHEMA_VERSION,
  applyMigrations,
  readPersisted,
  toPersisted,
} from "./persistence";
import { makeDeck, makePool } from "./test-utils";

function makeStored(overrides: Record<string, unknown> = {}): unknown {
  return {
    version: CURRENT_SCHEMA_VERSION,
    decks: [makeDeck({ id: "a" })],
    pools: [makePool({ id: "chill", deckIds: ["a"] })],
    ...overrides,
  };
}

describe("toPersisted", () => {
  it("stamps the library with the current version", () => {
    const library = { decks: [], pools: [] };

    expect(toPersisted(library).version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("keeps the library untouched", () => {
    const library = { decks: [makeDeck()], pools: [] };

    expect(toPersisted(library)).toMatchObject(library);
  });
});

describe("applyMigrations", () => {
  // Fake steps: the chaining is what is under test, not any real migration.
  const steps: Readonly<Record<number, Migration>> = {
    1: (data) => `${String(data)} > 2`,
    2: (data) => `${String(data)} > 3`,
    3: (data) => `${String(data)} > 4`,
  };

  it("runs the steps in order", () => {
    expect(applyMigrations("v1", 1, 4, steps)).toBe("v1 > 2 > 3 > 4");
  });

  it("runs nothing when the data is already current", () => {
    expect(applyMigrations("v4", 4, 4, steps)).toBe("v4");
  });

  it("stops at the requested version", () => {
    expect(applyMigrations("v1", 1, 2, steps)).toBe("v1 > 2");
  });

  it("refuses to skip a missing step rather than guessing", () => {
    expect(() => applyMigrations("v1", 1, 3, { 1: steps[1] as Migration })).toThrow(
      RangeError,
    );
  });
});

describe("readPersisted", () => {
  it("reads back what toPersisted wrote", () => {
    const library = { decks: [makeDeck({ id: "a" })], pools: [makePool({ id: "chill" })] };

    expect(readPersisted(toPersisted(library))).toEqual(library);
  });

  it("drops the version stamp from the result", () => {
    expect(readPersisted(makeStored())).not.toHaveProperty("version");
  });

  it("rejects data that is not an object", () => {
    expect(() => readPersisted("[]")).toThrow(TypeError);
    expect(() => readPersisted(null)).toThrow(TypeError);
    expect(() => readPersisted([])).toThrow(TypeError);
  });

  it("rejects data with no version stamp", () => {
    expect(() => readPersisted({ decks: [], pools: [] })).toThrow(TypeError);
  });

  it("rejects a version that is not a positive integer", () => {
    expect(() => readPersisted(makeStored({ version: "1" }))).toThrow(TypeError);
    expect(() => readPersisted(makeStored({ version: 1.5 }))).toThrow(TypeError);
    expect(() => readPersisted(makeStored({ version: 0 }))).toThrow(TypeError);
  });

  it("refuses data written by a newer build instead of guessing", () => {
    const fromTheFuture = makeStored({ version: CURRENT_SCHEMA_VERSION + 1 });

    expect(() => readPersisted(fromTheFuture)).toThrow(RangeError);
  });

  it("rejects data missing its decks or its pools", () => {
    expect(() => readPersisted(makeStored({ decks: undefined }))).toThrow(TypeError);
    expect(() => readPersisted(makeStored({ pools: "nope" }))).toThrow(TypeError);
  });
});

import { describe, expect, it } from "vitest";
import { toDeckId, toPoolId } from "./ids";

describe("toDeckId", () => {
  it("hands the value back untouched", () => {
    // A brand exists at compile time only: nothing is added to the string.
    expect(toDeckId("a3f9")).toBe("a3f9");
  });

  it("rejects an empty id", () => {
    expect(() => toDeckId("")).toThrow(TypeError);
  });
});

describe("toPoolId", () => {
  it("hands the value back untouched", () => {
    expect(toPoolId("chill")).toBe("chill");
  });

  it("rejects an empty id", () => {
    expect(() => toPoolId("")).toThrow(TypeError);
  });
});

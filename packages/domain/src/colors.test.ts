import { describe, expect, it } from "vitest";
import { mergeColorIdentities } from "./colors";
import type { ColorIdentity } from "./types";

describe("mergeColorIdentities", () => {
  it("sorts a single identity in WUBRG order", () => {
    expect(mergeColorIdentities(["G", "W", "U"])).toEqual(["W", "U", "G"]);
  });

  it("unions the identities of two commanders", () => {
    // Thrasios (UG) partnered with Tymna (WB).
    expect(mergeColorIdentities(["U", "G"], ["W", "B"])).toEqual(["W", "U", "B", "G"]);
  });

  it("counts a shared color only once", () => {
    expect(mergeColorIdentities(["W", "U"], ["U", "B"])).toEqual(["W", "U", "B"]);
  });

  it("reports colorless when nothing is given", () => {
    expect(mergeColorIdentities()).toEqual(["C"]);
  });

  it("reports colorless for commanders with no color", () => {
    expect(mergeColorIdentities(["C"], ["C"])).toEqual(["C"]);
  });

  it("drops colorless as soon as an actual color is present", () => {
    // A deck is never "white and colorless": C means the absence of color.
    expect(mergeColorIdentities(["C"], ["W"])).toEqual(["W"]);
  });

  it("handles the five-color case", () => {
    expect(mergeColorIdentities(["G", "R", "B", "U", "W"])).toEqual([
      "W",
      "U",
      "B",
      "R",
      "G",
    ]);
  });

  it("does not mutate the given identities", () => {
    const identity: ColorIdentity = ["G", "W"];

    mergeColorIdentities(identity);

    expect(identity).toEqual(["G", "W"]);
  });
});

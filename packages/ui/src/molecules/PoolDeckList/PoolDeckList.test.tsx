import type { Deck, Pool } from "@deck-roulette/domain";
import { toDeckId, toPoolId } from "@deck-roulette/domain";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PoolDeckList } from "./PoolDeckList";

function makePool(overrides: Partial<Pool> = {}): Pool {
  return {
    id: toPoolId("p1"),
    name: "Thursday table",
    deckIds: [toDeckId("a"), toDeckId("b"), toDeckId("c")],
    drawnDeckIds: [],
    createdAt: "2026-09-28T00:00:00.000Z",
    ...overrides,
  };
}

function makeDeck(id: string, name: string): Deck {
  return { id: toDeckId(id), name, createdAt: "2026-09-28T00:00:00.000Z" };
}

/** The whole library: "z" belongs to no pool under test. */
const DECKS = [
  makeDeck("z", "Krenko"),
  makeDeck("c", "Meren"),
  makeDeck("a", "Atraxa"),
  makeDeck("b", "Kenrith"),
];

/** What a screen reader gets: the text, minus what is hidden from it. */
function spokenText(element: HTMLElement): string {
  const copy = element.cloneNode(true);
  if (!(copy instanceof HTMLElement)) throw new TypeError("expected an element");
  copy.querySelectorAll("[aria-hidden='true']").forEach((hidden) => hidden.remove());
  return copy.textContent ?? "";
}

describe("PoolDeckList", () => {
  it("lists the pool's decks in its own order, and only those", () => {
    render(<PoolDeckList decks={DECKS} pool={makePool()} />);

    const list = screen.getByRole("list", { name: "Decks in Thursday table" });

    expect(within(list).getAllByRole("listitem").map(spokenText)).toEqual([
      "Atraxa",
      "Kenrith",
      "Meren",
    ]);
  });

  it("tells which decks have come out, and which one came out last", () => {
    // Struck through on screen; the line itself is never read aloud.
    render(
      <PoolDeckList
        decks={DECKS}
        pool={makePool({ drawnDeckIds: [toDeckId("c"), toDeckId("a")] })}
      />,
    );

    const list = screen.getByRole("list", { name: "Decks in Thursday table" });

    expect(within(list).getAllByRole("listitem").map(spokenText)).toEqual([
      "Atraxa, drawn last",
      "Kenrith",
      "Meren, drawn",
    ]);
  });

  it("shows no deck list for an empty pool", () => {
    render(<PoolDeckList decks={DECKS} pool={makePool({ deckIds: [] })} />);

    expect(screen.queryByRole("list")).toBeNull();
  });
});

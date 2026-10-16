import type { Deck, Pool } from "@deck-roulette/domain";
import { toDeckId, toPoolId } from "@deck-roulette/domain";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeckDetails } from "./DeckDetails";

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: toDeckId("d1"),
    name: "Tana & Tymna",
    createdAt: "2026-09-25T00:00:00.000Z",
    ...overrides,
  };
}

function makePool(id: string, name: string): Pool {
  return {
    id: toPoolId(id),
    name,
    deckIds: [toDeckId("d1")],
    drawnDeckIds: [],
    createdAt: "2026-09-25T00:00:00.000Z",
  };
}

/** The value a term is paired with, as a description list pairs them. */
function valueOf(term: string): string | null | undefined {
  const dt = screen.getAllByRole("term").find((element) => element.textContent === term);
  return dt?.nextElementSibling?.textContent;
}

describe("DeckDetails", () => {
  it("pairs every detail with its name, as a description list", () => {
    render(<DeckDetails deck={makeDeck({ bracket: 3 })} pools={[]} />);

    expect(valueOf("Bracket")).toBe("Bracket 3");
  });

  it("lists both commanders of a partner deck", () => {
    render(
      <DeckDetails
        deck={makeDeck({ commanders: ["Tana, the Bloodsower", "Tymna the Weaver"] })}
        pools={[]}
      />,
    );

    expect(valueOf("Commanders")).toBe("Tana, the Bloodsower // Tymna the Weaver");
  });

  it("names a single commander in the singular", () => {
    render(<DeckDetails deck={makeDeck({ commanders: ["Atraxa, Praetors' Voice"] })} pools={[]} />);

    expect(valueOf("Commander")).toBe("Atraxa, Praetors' Voice");
  });

  it("spells the color identity out in words", () => {
    render(<DeckDetails deck={makeDeck({ colors: ["W", "U", "B", "R"] })} pools={[]} />);

    expect(valueOf("Color identity")).toBe("White, Blue, Black, Red");
  });

  it("says what is not set yet, rather than leaving a gap", () => {
    render(<DeckDetails deck={makeDeck()} pools={[]} />);

    expect(valueOf("Commander")).toBe("Not set");
    expect(valueOf("Color identity")).toBe("Not set");
    expect(valueOf("Bracket")).toBe("Not set");
    expect(valueOf("Pools")).toBe("In no pool yet");
  });

  it("lists the pools holding the deck, each one as the caller renders it", () => {
    render(
      <DeckDetails
        deck={makeDeck()}
        pools={[makePool("p1", "Thursday table"), makePool("p2", "Sunday")]}
        renderPoolName={(pool) => <a href={`/pools/${pool.id}`}>{pool.name}</a>}
      />,
    );

    expect(screen.getByRole("list", { name: "Pools" }).childElementCount).toBe(2);
    expect(screen.getByRole("link", { name: "Sunday" }).getAttribute("href")).toBe("/pools/p2");
  });
});

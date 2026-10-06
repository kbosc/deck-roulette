import type { Deck } from "@deck-roulette/domain";
import { toDeckId } from "@deck-roulette/domain";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../../atoms/Button";
import { DeckCard } from "./DeckCard";

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: toDeckId("d1"),
    name: "Atraxa, Praetors' Voice",
    createdAt: "2026-09-25T00:00:00.000Z",
    ...overrides,
  };
}

describe("DeckCard", () => {
  it("gives the deck name a heading, so a list can be navigated by headings", () => {
    render(<DeckCard deck={makeDeck()} />);

    expect(screen.getByRole("heading", { name: "Atraxa, Praetors' Voice" })).toBeDefined();
  });

  it("joins two commanders rather than printing an array", () => {
    render(
      <DeckCard deck={makeDeck({ commanders: ["Tana, the Bloodsower", "Tymna the Weaver"] })} />,
    );

    expect(screen.getByText("Tana, the Bloodsower // Tymna the Weaver")).toBeDefined();
  });

  it("shows a single commander on its own", () => {
    render(<DeckCard deck={makeDeck({ commanders: ["Atraxa, Praetors' Voice"] })} />);

    expect(screen.getByText("Atraxa, Praetors' Voice", { selector: "p" })).toBeDefined();
  });

  it("spells the bracket out instead of showing a bare number", () => {
    render(<DeckCard deck={makeDeck({ bracket: 3 })} />);

    expect(screen.getByText("Bracket 3")).toBeDefined();
  });

  it("says in words that a deck has just been drawn", () => {
    render(<DeckCard deck={makeDeck()} highlighted />);

    expect(screen.getByText("Just drawn")).toBeDefined();
  });

  it("leaves out what the deck does not carry", () => {
    render(<DeckCard deck={makeDeck()} />);

    expect(screen.queryByText(/Bracket/)).toBeNull();
    expect(screen.queryByText("Just drawn")).toBeNull();
  });

  it("hosts the controls it is given without knowing what they are", () => {
    render(<DeckCard deck={makeDeck()} actions={<Button variant="ghost">Delete</Button>} />);

    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined();
  });

  it("is not itself a control", () => {
    render(<DeckCard deck={makeDeck()} actions={<Button variant="ghost">Delete</Button>} />);

    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});

import type { Deck } from "@deck-roulette/domain";
import { toDeckId } from "@deck-roulette/domain";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../../atoms/Button";
import { DeckList } from "./DeckList";

function makeDeck(id: string, name: string): Deck {
  return { id: toDeckId(id), name, createdAt: "2026-09-28T00:00:00.000Z" };
}

const decks = [makeDeck("d1", "Atraxa"), makeDeck("d2", "Krenko"), makeDeck("d3", "Yuriko")];

const empty = { title: "No deck yet", description: "Add your first deck." };

describe("DeckList", () => {
  it("announces itself as a list with as many items as there are decks", () => {
    render(<DeckList decks={decks} empty={empty} label="Decks in Thursday table" />);

    // A grid of divs looks identical and offers none of this.
    expect(screen.getByRole("list", { name: "Decks in Thursday table" })).toBeDefined();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("carries a name, so two lists on a screen can be told apart", () => {
    render(<DeckList decks={decks} empty={empty} label="Decks in Thursday table" />);

    expect(screen.getByRole("list").getAttribute("aria-label")).toBe("Decks in Thursday table");
  });

  it("shows the empty state instead of an empty list", () => {
    render(<DeckList decks={[]} empty={empty} label="Decks" />);

    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByRole("heading", { name: "No deck yet" })).toBeDefined();
  });

  it("marks only the deck that was drawn", () => {
    render(
      <DeckList decks={decks} empty={empty} label="Decks" highlightedDeckId={toDeckId("d2")} />,
    );

    expect(screen.getAllByText("Just drawn")).toHaveLength(1);
    const drawn = screen.getByText("Just drawn").closest("li");

    expect(drawn?.textContent).toContain("Krenko");
  });

  it("gives every deck its own controls", () => {
    render(
      <DeckList
        decks={decks}
        empty={empty}
        label="Decks"
        renderActions={(deck) => <Button size="sm">Delete {deck.name}</Button>}
      />,
    );

    // Named per deck rather than three identical "Delete" buttons: heard out of
    // context, "Delete" does not say what is about to go.
    expect(screen.getByRole("button", { name: "Delete Krenko" })).toBeDefined();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("renders no controls when none are given", () => {
    render(<DeckList decks={decks} empty={empty} label="Decks" />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});

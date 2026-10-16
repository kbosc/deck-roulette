import { addDeckToPool } from "@deck-roulette/domain";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { routes } from "../../app/routes";
import { useLibrary } from "../../store/library";

function renderDeck(deckName: string) {
  const deck = useLibrary.getState().decks.find((d) => d.name === deckName);
  const router = createMemoryRouter(routes, {
    initialEntries: [`/decks/${deck?.id ?? "unknown"}`],
  });
  return render(<RouterProvider router={router} />);
}

/** Until a pool's decks can be chosen from the deck's page. */
function putInPool(deckName: string, poolName: string) {
  useLibrary.getState().addPool(poolName);
  const { decks, pools } = useLibrary.getState();
  const deck = decks.find((d) => d.name === deckName);
  if (deck === undefined) throw new Error("seeding failed");

  useLibrary.setState({
    pools: pools.map((p) => (p.name === poolName ? addDeckToPool(p, deck.id) : p)),
  });
}

describe("DeckRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    useLibrary.setState({ decks: [], pools: [] });
  });

  it("titles the page, and the browser tab, with the deck's name", () => {
    useLibrary.getState().addDeck("Atraxa");
    renderDeck("Atraxa");

    expect(screen.getByRole("heading", { level: 1, name: "Atraxa" })).toBeDefined();
    expect(document.title).toBe("Atraxa · Deck Roulette");
  });

  it("says which details are not set yet", () => {
    useLibrary.getState().addDeck("Atraxa");
    renderDeck("Atraxa");

    expect(screen.getAllByText("Not set")).toHaveLength(3);
    expect(screen.getByText("In no pool yet")).toBeDefined();
  });

  it("links to every pool holding the deck, and to none other", () => {
    useLibrary.getState().addDeck("Atraxa");
    putInPool("Atraxa", "Thursday table");
    useLibrary.getState().addPool("Sunday");
    renderDeck("Atraxa");

    const pool = useLibrary.getState().pools.find((p) => p.name === "Thursday table");
    expect(screen.getByRole("link", { name: "Thursday table" }).getAttribute("href")).toBe(
      `/pools/${pool?.id ?? ""}`,
    );
    expect(screen.queryByRole("link", { name: "Sunday" })).toBeNull();
  });

  it("leads back to the whole library", async () => {
    useLibrary.getState().addDeck("Atraxa");
    const user = userEvent.setup();
    renderDeck("Atraxa");

    await user.click(screen.getByRole("link", { name: "All decks" }));

    expect(screen.getByRole("heading", { level: 1, name: "Library" })).toBeDefined();
  });

  it("says so when the deck does not exist, with a way back", () => {
    renderDeck("Ghost");

    expect(screen.getByRole("heading", { name: "This deck does not exist" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Back to the library" }).getAttribute("href")).toBe(
      "/",
    );
    expect(document.title).toBe("Deck not found · Deck Roulette");
  });
});

import { addDeckToPool } from "@deck-roulette/domain";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { routes } from "../../app/routes";
import { useLibrary } from "../../store/library";

function renderPool(poolName: string) {
  const pool = useLibrary.getState().pools.find((p) => p.name === poolName);
  const router = createMemoryRouter(routes, {
    initialEntries: [`/pools/${pool?.id ?? "unknown"}`],
  });
  return render(<RouterProvider router={router} />);
}

function seedPool(poolName: string, deckNames: readonly string[]) {
  deckNames.forEach((name) => useLibrary.getState().addDeck(name));
  useLibrary.getState().addPool(poolName);
  const { decks, pools } = useLibrary.getState();
  useLibrary.setState({
    pools: pools.map((p) =>
      p.name === poolName ? decks.reduce((acc, deck) => addDeckToPool(acc, deck.id), p) : p,
    ),
  });
}

function poolId() {
  return useLibrary.getState().pools[0]?.id ?? "";
}

describe("PoolRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    useLibrary.setState({ decks: [], pools: [] });
  });

  it("titles the page with the pool's name", () => {
    seedPool("Thursday table", ["Atraxa"]);
    renderPool("Thursday table");

    expect(screen.getByRole("heading", { level: 1, name: "Thursday table" })).toBeDefined();
  });

  it("draws from the page, names the deck and crosses it off the list", async () => {
    seedPool("Thursday table", ["Atraxa"]);
    const user = userEvent.setup();
    renderPool("Thursday table");

    await user.click(screen.getByRole("button", { name: "Draw a deck" }));

    expect(screen.getByRole("status").textContent).toBe("Atraxa, from Thursday table.");
    const list = screen.getByRole("list", { name: "Decks in Thursday table" });
    expect(within(list).getByRole("listitem").textContent).toContain("Atraxa, drawn last");
  });

  it("starts a new cycle once every deck has come out", async () => {
    seedPool("Thursday table", ["Atraxa"]);
    const user = userEvent.setup();
    renderPool("Thursday table");

    await user.click(screen.getByRole("button", { name: "Draw a deck" }));
    await user.click(screen.getByRole("button", { name: "Start a new cycle" }));

    expect(screen.getByRole("button", { name: "Draw a deck" })).toBeDefined();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("leads to choosing the pool's decks", () => {
    seedPool("Thursday table", ["Atraxa"]);
    renderPool("Thursday table");

    expect(screen.getByRole("link", { name: "Choose decks" }).getAttribute("href")).toBe(
      `/pools/${poolId()}/decks`,
    );
  });

  it("offers a single way to choose the decks of an empty pool", () => {
    seedPool("Thursday table", []);
    renderPool("Thursday table");

    expect(screen.getAllByRole("link", { name: "Choose decks" })).toHaveLength(1);
  });

  it("leads back to the list of pools", () => {
    seedPool("Thursday table", []);
    renderPool("Thursday table");

    expect(screen.getByRole("link", { name: "All pools" }).getAttribute("href")).toBe("/pools");
  });

  it("explains a pool that does not exist, rather than showing a blank page", () => {
    renderPool("Nowhere");

    expect(screen.getByRole("heading", { name: "This pool does not exist" })).toBeDefined();
  });
});

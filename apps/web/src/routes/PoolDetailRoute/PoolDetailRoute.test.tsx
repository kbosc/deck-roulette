import { render, screen } from "@testing-library/react";
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

function poolDeckNames() {
  const { decks, pools } = useLibrary.getState();
  return (pools[0]?.deckIds ?? []).map((id) => decks.find((d) => d.id === id)?.name);
}

describe("PoolDetailRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    useLibrary.setState({ decks: [], pools: [] });
  });

  it("titles the page with the pool's name", () => {
    useLibrary.getState().addPool("Thursday table");
    renderPool("Thursday table");

    expect(screen.getByRole("heading", { level: 1, name: "Thursday table" })).toBeDefined();
  });

  it("groups the decks under a legend naming the pool", () => {
    useLibrary.getState().addDeck("Atraxa");
    useLibrary.getState().addPool("Thursday table");
    renderPool("Thursday table");

    expect(screen.getByRole("group", { name: "Decks in Thursday table" })).toBeDefined();
  });

  it("puts a deck in the pool when it is ticked, and takes it out when unticked", async () => {
    useLibrary.getState().addDeck("Atraxa");
    useLibrary.getState().addDeck("Krenko");
    useLibrary.getState().addPool("Thursday table");
    const user = userEvent.setup();
    renderPool("Thursday table");

    await user.click(screen.getByRole("checkbox", { name: "Atraxa" }));
    expect(poolDeckNames()).toEqual(["Atraxa"]);
    expect(screen.getByRole("checkbox", { name: "Atraxa" })).toHaveProperty("checked", true);

    await user.click(screen.getByRole("checkbox", { name: "Atraxa" }));
    expect(poolDeckNames()).toEqual([]);
  });

  it("sends to the library when there is no deck to choose from", () => {
    useLibrary.getState().addPool("Thursday table");
    renderPool("Thursday table");

    expect(screen.getByRole("link", { name: "Go to the library" }).getAttribute("href")).toBe("/");
  });

  it("explains a pool that does not exist, rather than showing a blank page", () => {
    renderPool("Nowhere");

    expect(screen.getByRole("heading", { name: "This pool does not exist" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Back to the pools" }).getAttribute("href")).toBe(
      "/pools",
    );
  });

  it("leads back to the list of pools", () => {
    useLibrary.getState().addPool("Thursday table");
    renderPool("Thursday table");

    expect(screen.getByRole("link", { name: "All pools" }).getAttribute("href")).toBe("/pools");
  });
});

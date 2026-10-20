import { addDeckToPool } from "@deck-roulette/domain";
import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useLibrary } from "../../store/library";
import { routes } from "../../app/routes";

function renderPools() {
  const router = createMemoryRouter(routes, { initialEntries: ["/pools"] });
  return render(<RouterProvider router={router} />);
}

function nameField() {
  return screen.getByRole("textbox", { name: "Pool name (required)" });
}

async function addPool(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.type(nameField(), name);
  await user.click(screen.getByRole("button", { name: "Add" }));
}

/** Until a pool's decks can be chosen on screen. */
function seedPoolWithDeck(poolName: string, deckName: string) {
  useLibrary.getState().addDeck(deckName);
  useLibrary.getState().addPool(poolName);
  const { decks, pools } = useLibrary.getState();
  const deck = decks.find((d) => d.name === deckName);
  const pool = pools.find((p) => p.name === poolName);

  if (deck === undefined || pool === undefined) throw new Error("seeding failed");

  useLibrary.setState({ pools: pools.map((p) => (p === pool ? addDeckToPool(p, deck.id) : p)) });
}

describe("PoolsRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    useLibrary.setState({ decks: [], pools: [] });
  });

  it("says there is no pool yet, rather than showing a blank area", () => {
    renderPools();

    expect(screen.getByRole("heading", { name: "No pool yet" })).toBeDefined();
  });

  it("shows a pool once it has been added", async () => {
    const user = userEvent.setup();
    renderPools();

    await addPool(user, "Thursday table");

    const list = screen.getByRole("list", { name: "Your pools" });
    expect(within(list).getByRole("heading", { name: "Thursday table" })).toBeDefined();
  });

  it("links every pool's name to its page, empty or not", () => {
    useLibrary.getState().addPool("Thursday table");
    renderPools();

    const pool = useLibrary.getState().pools[0];
    expect(screen.getByRole("link", { name: "Thursday table" }).getAttribute("href")).toBe(
      `/pools/${pool?.id ?? ""}`,
    );
  });

  it("offers to choose the decks of an empty pool", async () => {
    const user = userEvent.setup();
    renderPools();

    await addPool(user, "Thursday table");

    const pool = useLibrary.getState().pools[0];
    expect(screen.getByRole("link", { name: "Choose decks" }).getAttribute("href")).toBe(
      `/pools/${pool?.id ?? ""}/decks`,
    );
  });

  it("introduces the pools with a level 2 heading, so no level is skipped", async () => {
    const user = userEvent.setup();
    renderPools();

    await addPool(user, "Thursday table");

    expect(screen.getByRole("heading", { level: 2, name: "Your pools" })).toBeDefined();
  });

  it("refuses a pool name already taken, whatever its case", async () => {
    const user = userEvent.setup();
    renderPools();

    await addPool(user, "Thursday table");
    await addPool(user, "thursday TABLE");

    expect(screen.getByRole("alert").textContent).toBe("A pool with this name already exists.");
    expect(useLibrary.getState().pools).toHaveLength(1);
  });

  it("leaves renaming and deleting to the pool's own page", () => {
    seedPoolWithDeck("Thursday table", "Atraxa");
    renderPools();

    expect(screen.queryByRole("button", { name: /delete|rename/i })).toBeNull();
  });

  it("names the deck that was drawn", async () => {
    seedPoolWithDeck("Thursday table", "Atraxa");
    const user = userEvent.setup();
    renderPools();

    await user.click(screen.getByRole("button", { name: "Draw a deck" }));

    expect(within(screen.getByRole("main")).getByRole("status").textContent).toBe(
      "Atraxa, from Thursday table.",
    );
  });

  it("stays a table of contents: a pool's decks are listed on its own page", () => {
    seedPoolWithDeck("Thursday table", "Atraxa");
    renderPools();

    expect(screen.queryByRole("list", { name: "Decks in Thursday table" })).toBeNull();
  });

  it("offers a new cycle once every deck has come out, and makes them drawable again", async () => {
    seedPoolWithDeck("Thursday table", "Atraxa");
    const user = userEvent.setup();
    renderPools();

    await user.click(screen.getByRole("button", { name: "Draw a deck" }));
    await user.click(screen.getByRole("button", { name: "Start a new cycle" }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Draw a deck" }));
  });
});

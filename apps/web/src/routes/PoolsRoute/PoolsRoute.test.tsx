import { addDeckToPool } from "@deck-roulette/domain";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useLibrary } from "../../store/library";
import { PoolsRoute } from "./PoolsRoute";

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
    render(<PoolsRoute />);

    expect(screen.getByRole("heading", { name: "No pool yet" })).toBeDefined();
  });

  it("shows a pool once it has been added", async () => {
    const user = userEvent.setup();
    render(<PoolsRoute />);

    await addPool(user, "Thursday table");

    const list = screen.getByRole("list", { name: "Your pools" });
    expect(within(list).getByRole("heading", { name: "Thursday table" })).toBeDefined();
  });

  it("introduces the pools with a level 2 heading, so no level is skipped", async () => {
    const user = userEvent.setup();
    render(<PoolsRoute />);

    await addPool(user, "Thursday table");

    expect(screen.getByRole("heading", { level: 2, name: "Your pools" })).toBeDefined();
  });

  it("refuses a pool name already taken, whatever its case", async () => {
    const user = userEvent.setup();
    render(<PoolsRoute />);

    await addPool(user, "Thursday table");
    await addPool(user, "thursday TABLE");

    expect(screen.getByRole("alert").textContent).toBe("A pool with this name already exists.");
    expect(useLibrary.getState().pools).toHaveLength(1);
  });

  it("deletes a pool once confirmed, and keeps its decks in the library", async () => {
    seedPoolWithDeck("Thursday table", "Atraxa");
    const user = userEvent.setup();
    render(<PoolsRoute />);

    await user.click(screen.getByRole("button", { name: "Delete Thursday table" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(useLibrary.getState().pools).toHaveLength(0);
    expect(useLibrary.getState().decks).toHaveLength(1);
    expect(screen.getByRole("status").textContent).toBe("Thursday table deleted.");
  });

  it("says the decks survive, before asking to delete", async () => {
    seedPoolWithDeck("Thursday table", "Atraxa");
    const user = userEvent.setup();
    render(<PoolsRoute />);

    await user.click(screen.getByRole("button", { name: "Delete Thursday table" }));

    expect(screen.getByRole("dialog", { name: "Delete Thursday table?" }).textContent).toContain(
      "Its decks stay in your library.",
    );
  });

  it("keeps the pool and returns to its delete button when cancelled", async () => {
    seedPoolWithDeck("Thursday table", "Atraxa");
    const user = userEvent.setup();
    render(<PoolsRoute />);

    await user.click(screen.getByRole("button", { name: "Delete Thursday table" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(useLibrary.getState().pools).toHaveLength(1);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Delete Thursday table" }),
    );
  });

  it("puts focus on the page heading after a deletion", async () => {
    seedPoolWithDeck("Thursday table", "Atraxa");
    const user = userEvent.setup();
    render(<PoolsRoute />);

    await user.click(screen.getByRole("button", { name: "Delete Thursday table" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1 }));
  });

  it("names the deck that was drawn", async () => {
    seedPoolWithDeck("Thursday table", "Atraxa");
    const user = userEvent.setup();
    render(<PoolsRoute />);

    await user.click(screen.getByRole("button", { name: "Draw a deck" }));

    expect(screen.getByRole("status").textContent).toBe("Atraxa, from Thursday table.");
  });

  it("offers a new cycle once every deck has come out, and makes them drawable again", async () => {
    seedPoolWithDeck("Thursday table", "Atraxa");
    const user = userEvent.setup();
    render(<PoolsRoute />);

    await user.click(screen.getByRole("button", { name: "Draw a deck" }));
    await user.click(screen.getByRole("button", { name: "Start a new cycle" }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Draw a deck" }));
  });
});

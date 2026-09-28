import type { Pool } from "@deck-roulette/domain";
import { toDeckId, toPoolId } from "@deck-roulette/domain";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PoolCard } from "./PoolCard";

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

describe("PoolCard", () => {
  it("offers a draw while decks remain", async () => {
    const onDraw = vi.fn();
    const user = userEvent.setup();
    render(<PoolCard pool={makePool()} onDraw={onDraw} onReset={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Draw a deck" }));

    expect(onDraw).toHaveBeenCalledOnce();
  });

  it("says how far through the cycle the pool is", () => {
    render(
      <PoolCard
        pool={makePool({ drawnDeckIds: [toDeckId("a")] })}
        onDraw={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    // Words rather than "1/3": read aloud, a slash is noise.
    expect(screen.getByText("1 of 3 drawn, 2 left")).toBeDefined();
  });

  it("offers a new cycle instead of a draw once every deck has come out", async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    const exhausted = makePool({ drawnDeckIds: [toDeckId("a"), toDeckId("b"), toDeckId("c")] });
    render(<PoolCard pool={exhausted} onDraw={vi.fn()} onReset={onReset} />);

    // No dead button: the control on screen is the one that actually applies.
    expect(screen.queryByRole("button", { name: "Draw a deck" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Start a new cycle" }));

    expect(onReset).toHaveBeenCalledOnce();
  });

  it("never resets a cycle in silence", () => {
    const exhausted = makePool({ drawnDeckIds: [toDeckId("a"), toDeckId("b"), toDeckId("c")] });
    render(<PoolCard pool={exhausted} onDraw={vi.fn()} onReset={vi.fn()} />);

    // Finishing a full round is information the user is owed.
    expect(screen.getByText("Cycle over")).toBeDefined();
    expect(screen.getByText(/Every deck in this pool has come out/)).toBeDefined();
  });

  it("explains an empty pool rather than offering a draw", () => {
    render(<PoolCard pool={makePool({ deckIds: [] })} onDraw={vi.fn()} onReset={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Draw a deck" })).toBeNull();
    expect(screen.getByText("No deck in this pool")).toBeDefined();
    expect(screen.getByText(/Add decks from your library/)).toBeDefined();
  });

  it("does not confuse an empty pool with an exhausted one", () => {
    render(<PoolCard pool={makePool({ deckIds: [] })} onDraw={vi.fn()} onReset={vi.fn()} />);

    // "Start a new cycle" on a pool with no deck would do nothing at all.
    expect(screen.queryByRole("button", { name: "Start a new cycle" })).toBeNull();
    expect(screen.queryByText("Cycle over")).toBeNull();
  });

  it("names the pool as a heading", () => {
    render(<PoolCard pool={makePool()} onDraw={vi.fn()} onReset={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Thursday table" })).toBeDefined();
  });
});

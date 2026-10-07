import type { Pool } from "@deck-roulette/domain";
import { toDeckId, toPoolId } from "@deck-roulette/domain";
import { drawDeck, resetPool } from "@deck-roulette/domain";
import { render, screen } from "@testing-library/react";
import { useState } from "react";
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

/** Plays the draws for real, so the card swaps its control as on screen. */
function LivePoolCard({ initial }: { readonly initial: Pool }) {
  const [pool, setPool] = useState(initial);

  return (
    <PoolCard
      pool={pool}
      onDraw={() => {
        const result = drawDeck(pool, () => 0);
        if (result.status === "drawn") setPool(result.pool);
      }}
      onReset={() => setPool(resetPool(pool))}
    />
  );
}

describe("PoolCard", () => {
  it("keeps focus on the card's control when drawing the last deck swaps it", async () => {
    const user = userEvent.setup();
    render(<LivePoolCard initial={makePool({ drawnDeckIds: [toDeckId("a"), toDeckId("b")] })} />);

    await user.click(screen.getByRole("button", { name: "Draw a deck" }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Start a new cycle" }));
  });

  it("keeps focus on the card's control when a new cycle swaps it back", async () => {
    const user = userEvent.setup();
    render(
      <LivePoolCard
        initial={makePool({ drawnDeckIds: [toDeckId("a"), toDeckId("b"), toDeckId("c")] })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Start a new cycle" }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Draw a deck" }));
  });

  it("leaves focus alone when the pool changes for another reason", () => {
    const pool = makePool();
    const { rerender } = render(<PoolCard pool={pool} onDraw={vi.fn()} onReset={vi.fn()} />);

    rerender(
      <PoolCard
        pool={{ ...pool, drawnDeckIds: [...pool.deckIds] }}
        onDraw={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(document.activeElement).toBe(document.body);
  });

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

    expect(screen.queryByRole("button", { name: "Draw a deck" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Start a new cycle" }));

    expect(onReset).toHaveBeenCalledOnce();
  });

  it("never resets a cycle in silence", () => {
    const exhausted = makePool({ drawnDeckIds: [toDeckId("a"), toDeckId("b"), toDeckId("c")] });
    render(<PoolCard pool={exhausted} onDraw={vi.fn()} onReset={vi.fn()} />);

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

  it("lets the app turn the name into a link, still inside the heading", () => {
    render(
      <PoolCard
        pool={makePool()}
        onDraw={vi.fn()}
        onReset={vi.fn()}
        renderTitle={(name) => <a href="/pools/p1">{name}</a>}
      />,
    );

    const heading = screen.getByRole("heading", { name: "Thursday table" });
    expect(heading.querySelector("a")?.getAttribute("href")).toBe("/pools/p1");
  });

  it("offers the empty pool's way out", () => {
    render(
      <PoolCard
        pool={makePool({ deckIds: [] })}
        onDraw={vi.fn()}
        onReset={vi.fn()}
        emptyAction={<a href="/pools/p1">Choose decks</a>}
      />,
    );

    expect(screen.getByRole("link", { name: "Choose decks" })).toBeDefined();
  });

  it("keeps the empty pool's way out for empty pools only", () => {
    render(
      <PoolCard
        pool={makePool()}
        onDraw={vi.fn()}
        onReset={vi.fn()}
        emptyAction={<a href="/pools/p1">Choose decks</a>}
      />,
    );

    expect(screen.queryByRole("link", { name: "Choose decks" })).toBeNull();
  });

  it("names the pool as a heading", () => {
    render(<PoolCard pool={makePool()} onDraw={vi.fn()} onReset={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Thursday table" })).toBeDefined();
  });
});

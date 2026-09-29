import type { Pool } from "@deck-roulette/domain";
import { toDeckId, toPoolId } from "@deck-roulette/domain";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Button } from "../../atoms/Button";
import { PoolCard } from "./PoolCard";

const deckIds = ["a", "b", "c", "d", "e", "f", "g", "h"].map(toDeckId);

const pool: Pool = {
  id: toPoolId("p1"),
  name: "Thursday table",
  deckIds,
  drawnDeckIds: [],
  createdAt: "2026-09-28T00:00:00.000Z",
};

const meta = {
  title: "Organisms/PoolCard",
  component: PoolCard,
  args: { pool, onDraw: fn(), onReset: fn() },
  parameters: { layout: "padded" },
} satisfies Meta<typeof PoolCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A fresh cycle: everything is drawable. */
export const Ready: Story = {};

export const PartwayThrough: Story = {
  args: { pool: { ...pool, drawnDeckIds: deckIds.slice(0, 5) } },
};

/**
 * The cycle is over. No disabled draw button: the control on screen is the one
 * that applies, and the end of a round is stated rather than passed over.
 */
export const Exhausted: Story = {
  args: { pool: { ...pool, drawnDeckIds: deckIds } },
};

/** A pool with no deck — a different situation from an exhausted one. */
export const Empty: Story = {
  args: { pool: { ...pool, deckIds: [], drawnDeckIds: [] } },
};

export const WithActions: Story = {
  args: {
    actions: (
      <>
        <Button size="sm" variant="ghost">
          Rename
        </Button>
        <Button size="sm" variant="danger">
          Delete
        </Button>
      </>
    ),
  },
};

/** One deck left: the wording has to hold at the edges of the scale. */
export const OneLeft: Story = {
  args: { pool: { ...pool, drawnDeckIds: deckIds.slice(0, 7) } },
};

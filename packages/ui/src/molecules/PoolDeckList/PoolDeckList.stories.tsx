import type { Deck, Pool } from "@deck-roulette/domain";
import { toDeckId, toPoolId } from "@deck-roulette/domain";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PoolDeckList } from "./PoolDeckList";

const deckIds = ["a", "b", "c", "d", "e", "f", "g", "h"].map(toDeckId);

const names = [
  "Atraxa, Praetors' Voice",
  "Meren of Clan Nel Toth",
  "Kenrith, the Returned King",
  "Krenko, Mob Boss",
  "Edgar Markov",
  "The Ur-Dragon",
  "Yuriko, the Tiger's Shadow",
  "Lathril, Blade of the Elves",
];

const decks: Deck[] = deckIds.map((id, i) => ({
  id,
  name: names[i] ?? "Unnamed",
  createdAt: "2026-09-28T00:00:00.000Z",
}));

const pool: Pool = {
  id: toPoolId("p1"),
  name: "Thursday table",
  deckIds,
  drawnDeckIds: [],
  createdAt: "2026-09-28T00:00:00.000Z",
};

const meta = {
  title: "Molecules/PoolDeckList",
  component: PoolDeckList,
  args: { pool, decks },
  // Its home is a vellum page: the red ink is chosen for it.
  decorators: [
    (Story) => (
      <div data-surface="page" className="bg-surface-raised p-4 text-text">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "padded" },
} satisfies Meta<typeof PoolDeckList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NothingDrawn: Story = {};

/** The last of the three drawn is marked, the others crossed out. */
export const PartwayThrough: Story = {
  args: { pool: { ...pool, drawnDeckIds: deckIds.slice(0, 3) } },
};

export const LongName: Story = {
  args: {
    decks: decks.map((deck, i) =>
      i === 0
        ? { ...deck, name: "Esika, God of the Tree // The Prismatic Bridge, five-color legends" }
        : deck,
    ),
  },
};

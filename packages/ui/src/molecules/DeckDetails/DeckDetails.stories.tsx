import type { Pool } from "@deck-roulette/domain";
import { toDeckId, toPoolId } from "@deck-roulette/domain";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DeckDetails } from "./DeckDetails";

function makePool(id: string, name: string): Pool {
  return {
    id: toPoolId(id),
    name,
    deckIds: [toDeckId("d1")],
    drawnDeckIds: [],
    createdAt: "2026-09-25T00:00:00.000Z",
  };
}

const meta = {
  title: "Molecules/DeckDetails",
  component: DeckDetails,
  args: {
    deck: {
      id: toDeckId("d1"),
      name: "Tana & Tymna",
      commanders: ["Tana, the Bloodsower", "Tymna the Weaver"],
      colors: ["W", "B", "R", "G"],
      bracket: 3,
      createdAt: "2026-09-25T00:00:00.000Z",
    },
    pools: [makePool("p1", "Thursday table"), makePool("p2", "Sunday afternoons")],
    renderPoolName: (pool) => (
      <a href={`#${pool.id}`} className="text-text-action underline underline-offset-4">
        {pool.name}
      </a>
    ),
  },
} satisfies Meta<typeof DeckDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A deck just added to the library: only its name is known. */
export const NothingSetYet: Story = {
  args: {
    deck: { id: toDeckId("d2"), name: "Untitled brew", createdAt: "2026-09-25T00:00:00.000Z" },
    pools: [],
  },
};

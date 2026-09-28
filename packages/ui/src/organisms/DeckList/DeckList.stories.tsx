import type { Deck } from "@deck-roulette/domain";
import { toDeckId } from "@deck-roulette/domain";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { DeckList } from "./DeckList";

const createdAt = "2026-09-28T00:00:00.000Z";

const decks: readonly Deck[] = [
  {
    id: toDeckId("d1"),
    name: "Atraxa, Praetors' Voice",
    commanders: ["Atraxa, Praetors' Voice"],
    colors: ["W", "U", "B", "G"],
    bracket: 3,
    createdAt,
  },
  {
    id: toDeckId("d2"),
    name: "Krenko, Mob Boss",
    commanders: ["Krenko, Mob Boss"],
    colors: ["R"],
    bracket: 2,
    createdAt,
  },
  {
    id: toDeckId("d3"),
    name: "Tana & Tymna",
    commanders: ["Tana, the Bloodsower", "Tymna the Weaver"],
    colors: ["W", "B", "R", "G"],
    bracket: 4,
    createdAt,
  },
  { id: toDeckId("d4"), name: "Untitled brew", createdAt },
];

const meta = {
  title: "Organisms/DeckList",
  component: DeckList,
  args: {
    decks,
    label: "Decks in Thursday table",
    empty: {
      title: "No deck yet",
      description: "Add your first deck and it will start showing up in your draws.",
    },
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof DeckList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    renderActions: (deck) => (
      <Button size="sm" variant="danger">
        Delete {deck.name}
      </Button>
    ),
  },
};

export const AfterADraw: Story = {
  args: { highlightedDeckId: toDeckId("d2") },
};

export const Empty: Story = {
  args: {
    decks: [],
    empty: {
      title: "No deck yet",
      description: "Add your first deck and it will start showing up in your draws.",
      action: <Button>Add a deck</Button>,
    },
  },
};

/** Nothing matched a filter — not the same message as having no deck at all. */
export const NothingMatched: Story = {
  args: {
    decks: [],
    empty: {
      title: "No deck matches this filter",
      description: "Try a different bracket, or clear the filter to see all 4 decks.",
      action: <Button variant="secondary">Clear the filter</Button>,
    },
  },
};

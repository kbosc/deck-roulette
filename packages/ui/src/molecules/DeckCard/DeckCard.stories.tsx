import type { Deck } from "@deck-roulette/domain";
import { toDeckId } from "@deck-roulette/domain";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { DeckCard } from "./DeckCard";

const atraxa: Deck = {
  id: toDeckId("d1"),
  name: "Atraxa, Praetors' Voice",
  commanders: ["Atraxa, Praetors' Voice"],
  colors: ["W", "U", "B", "G"],
  bracket: 3,
  createdAt: "2026-09-25T00:00:00.000Z",
};

const meta = {
  title: "Molecules/DeckCard",
  component: DeckCard,
  args: { deck: atraxa },
  parameters: { layout: "padded" },
} satisfies Meta<typeof DeckCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoCommanders: Story = {
  args: {
    deck: {
      ...atraxa,
      id: toDeckId("d2"),
      name: "Tana & Tymna",
      commanders: ["Tana, the Bloodsower", "Tymna the Weaver"],
      colors: ["W", "B", "R", "G"],
      bracket: 4,
    },
  },
};

/** A deck entered in a hurry: a name and nothing else. */
export const NameOnly: Story = {
  args: { deck: { id: toDeckId("d3"), name: "Untitled brew", createdAt: atraxa.createdAt } },
};

export const JustDrawn: Story = {
  args: { highlighted: true },
};

export const WithActions: Story = {
  args: {
    actions: (
      <>
        <Button size="sm" variant="ghost">Edit</Button>
        <Button size="sm" variant="danger">Delete</Button>
      </>
    ),
  },
};

/**
 * A name long enough to overflow, which is what real Magic names do. The card
 * must truncate rather than push the controls off the card.
 */
export const LongName: Story = {
  args: {
    deck: {
      ...atraxa,
      name: "Kotori, Pilot Prodigy and the very long list of vehicles she crews",
    },
    actions: <Button size="sm" variant="danger">Delete</Button>,
  },
};

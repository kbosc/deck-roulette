import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "Molecules/EmptyState",
  component: EmptyState,
  args: {
    title: "No deck yet",
    description: "Add your first deck and it will start showing up in your draws.",
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First use: nothing exists yet, and the way forward is to create something. */
export const NothingCreatedYet: Story = {
  args: { action: <Button>Add a deck</Button> },
};

/**
 * Nothing matched a filter — a different situation entirely.
 *
 * Telling someone to "add a deck" when they own forty and mistyped a search is
 * worse than saying nothing: it suggests their decks are gone.
 */
export const NothingMatched: Story = {
  args: {
    title: "No deck matches this filter",
    description: "Try a different bracket, or clear the filter to see all 42 decks.",
    action: <Button variant="secondary">Clear the filter</Button>,
  },
};

/** The draw cycle is over — the one empty state this app will show most. */
export const CycleFinished: Story = {
  args: {
    title: "Every deck has been drawn",
    description:
      "The 8 decks in Thursday table have all come out. Start a new cycle to make them drawable again.",
    action: <Button>Start a new cycle</Button>,
  },
};

/** A pool with no deck in it: the action belongs to the deck library. */
export const NoAction: Story = {
  args: {
    title: "This pool is empty",
    description: "Add decks to it from your library, then come back here to draw.",
  },
};

export const WithIllustration: Story = {
  args: {
    action: <Button>Add a deck</Button>,
    illustration: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="12" height="16" rx="2" />
        <path d="M9 5V3h12v16h-2" />
      </svg>
    ),
  },
};

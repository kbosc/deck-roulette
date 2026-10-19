import { toDeckId } from "@deck-roulette/domain";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { DeckForm } from "./DeckForm";

const meta = {
  title: "Organisms/DeckForm",
  component: DeckForm,
  args: {
    deck: {
      id: toDeckId("d1"),
      name: "Tana & Tymna",
      commanders: ["Tana, the Bloodsower", "Tymna the Weaver"],
      colors: ["W", "B", "R", "G"],
      bracket: 3,
      createdAt: "2026-10-19T00:00:00.000Z",
    },
    checkName: (name) => (name.trim() === "" ? "Give the deck a name." : undefined),
    onSave: fn(),
  },
} satisfies Meta<typeof DeckForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A deck just added to the library: only its name is known. */
export const NothingSetYet: Story = {
  args: {
    deck: { id: toDeckId("d2"), name: "Untitled brew", createdAt: "2026-10-19T00:00:00.000Z" },
  },
};

/** The save bar, and a refused name: both only show up after some typing. */
export const WithAnError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.clear(canvas.getByRole("textbox", { name: "Name" }));
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(canvas.getByRole("alert")).toBeVisible();
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { ConfirmDialog } from "./ConfirmDialog";

const meta = {
  title: "Molecules/ConfirmDialog",
  component: ConfirmDialog,
  args: {
    title: "Delete this deck?",
    description: "Atraxa will be removed from every pool it belongs to. This cannot be undone.",
    confirmLabel: "Delete",
    onConfirm: fn(),
    onOpenChange: fn(),
    open: false,
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Controlled: the story needs a host that owns `open`. */
function Controlled(args: React.ComponentProps<typeof ConfirmDialog>) {
  const [open, setOpen] = useState(false);

  return (
    <ConfirmDialog
      {...args}
      open={open}
      onOpenChange={setOpen}
      trigger={<Button variant="danger">Delete deck</Button>}
    />
  );
}

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
};

/** Opened on load, so the accessibility check runs against the dialog itself. */
export const Open: Story = {
  args: { open: true },
};

/** A description long enough to wrap. */
export const LongDescription: Story = {
  args: {
    title: "Delete this pool?",
    description:
      "Thursday table holds 14 decks. Deleting the pool leaves every deck in your library untouched, but the current draw cycle and the list of decks already drawn will be lost. This cannot be undone.",
    confirmLabel: "Delete pool",
    open: true,
  },
};

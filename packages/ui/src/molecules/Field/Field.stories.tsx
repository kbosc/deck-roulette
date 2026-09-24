import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../../atoms/Input";
import { Field } from "./Field";

const meta = {
  title: "Molecules/Field",
  component: Field,
  args: {
    label: "Deck name",
    children: (props) => <Input {...props} placeholder="Atraxa, Praetors' Voice" />,
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHint: Story = {
  args: { hint: "Shown on the draw screen." },
};

export const Required: Story = {
  args: { required: true },
};

/** The state that matters: invalid, described, and announced. */
export const WithError: Story = {
  args: {
    error: "A deck with this name already exists.",
    required: true,
  },
};

/** Both messages at once — the error is read first, the hint after. */
export const WithHintAndError: Story = {
  args: {
    hint: "Shown on the draw screen.",
    error: "A deck with this name already exists.",
  },
};

/**
 * A placeholder is not a label: it vanishes as soon as someone types, and most
 * screen readers do not announce it as a name. It may only ever be an example.
 */
export const PlaceholderIsNotALabel: Story = {
  args: {
    label: "Archidekt URL",
    hint: "Optional. Only used to reopen the list, never fetched.",
    children: (props) => <Input {...props} type="url" placeholder="https://archidekt.com/decks/…" />,
  },
};

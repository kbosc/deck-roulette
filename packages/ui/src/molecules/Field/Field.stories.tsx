import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
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

export const WithError: Story = {
  args: {
    error: "A deck with this name already exists.",
    required: true,
  },
};

/** The error is read first, the hint after. */
export const WithHintAndError: Story = {
  args: {
    hint: "Shown on the draw screen.",
    error: "A deck with this name already exists.",
  },
};

/** `subgrid`: the button stays level with the input when the error appears. */
export const InAFormRow: Story = {
  args: {
    layout: "subgrid",
    required: true,
    error: "Give the deck a name.",
  },
  render: (args) => (
    <form className="grid grid-cols-1 gap-x-3 gap-y-2">
      <Field {...args} />
      <Button type="button" className="col-start-2 row-start-2">
        Add
      </Button>
    </form>
  ),
};

/** A placeholder is only ever an example, never the label. */
export const PlaceholderIsNotALabel: Story = {
  args: {
    label: "Archidekt URL",
    hint: "Optional. Only used to reopen the list, never fetched.",
    children: (props) => (
      <Input {...props} type="url" placeholder="https://archidekt.com/decks/…" />
    ),
  },
};

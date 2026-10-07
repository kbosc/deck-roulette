import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "Atoms/Checkbox",
  component: Checkbox,
  args: { label: "Atraxa, Praetors' Voice", onChange: fn() },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = { args: { checked: false } };

export const Checked: Story = { args: { checked: true } };

export const Disabled: Story = { args: { checked: false, disabled: true } };

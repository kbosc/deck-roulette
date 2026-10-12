import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SegmentedControl } from "./SegmentedControl";

const OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

type Theme = (typeof OPTIONS)[number]["value"];

function Controlled({ initial }: { readonly initial: Theme }) {
  const [value, setValue] = useState<Theme>(initial);
  return <SegmentedControl legend="Theme" options={OPTIONS} value={value} onChange={setValue} />;
}

const meta = {
  title: "Molecules/SegmentedControl",
  component: Controlled,
  args: { initial: "system" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Controlled>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstSelected: Story = {};

export const LastSelected: Story = { args: { initial: "dark" } };

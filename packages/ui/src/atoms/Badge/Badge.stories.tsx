import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
  title: "Atoms/Badge",
  component: Badge,
  args: { children: "Bracket 3" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every tone, to catch a theme regression in one look. */
export const AllTones: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Badge {...args} tone="neutral">Neutral</Badge>
      <Badge {...args} tone="info">Bracket 3</Badge>
      <Badge {...args} tone="success">Just drawn</Badge>
      <Badge {...args} tone="warning">Never played</Badge>
      <Badge {...args} tone="danger">Missing cards</Badge>
    </div>
  ),
};

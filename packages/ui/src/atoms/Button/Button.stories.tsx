import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
  title: "Atoms/Button",
  component: Button,
  args: { children: "Draw a deck" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The playground: every prop is reachable from the controls panel. A story per
 * variant would add nothing, since `AllVariants` below already renders them all
 * and is what the accessibility check actually runs against.
 */
export const Default: Story = {};

/** Kept as its own story because the opacity and the blocked pointer are easy
 * to regress, and neither shows up in the variant grid. */
export const Disabled: Story = { args: { disabled: true } };

/** Every size side by side, to check they line up on a shared baseline. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Button {...args} size="sm" />
      <Button {...args} size="md" />
      <Button {...args} size="lg" />
    </div>
  ),
};

/**
 * A link that looks like a button. `asChild` keeps the anchor, so the browser
 * still offers "open in a new tab" and screen readers still announce a link.
 */
export const AsLink: Story = {
  args: { asChild: true },
  render: (args) => (
    <Button {...args}>
      <a href="https://scryfall.com">Open Scryfall</a>
    </Button>
  ),
};

/** The whole palette at once, which is how a theme regression gets noticed. */
export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-4">
      <Button {...args} variant="primary" />
      <Button {...args} variant="secondary" />
      <Button {...args} variant="ghost" />
      <Button {...args} variant="danger" />
    </div>
  ),
};

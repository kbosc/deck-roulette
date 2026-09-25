import type { ColorIdentity } from "@deck-roulette/domain";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ManaIdentity } from "./ManaIdentity";

const meta = {
  title: "Atoms/ManaIdentity",
  component: ManaIdentity,
  args: { colors: ["W", "U", "B"] },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ManaIdentity>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Entered out of order, printed in WUBRG order. */
export const AlwaysInWubrgOrder: Story = {
  args: { colors: ["G", "B", "W"] },
};

export const Small: Story = {
  args: { size: "sm" },
};

/**
 * The identities that actually turn up at a table, including the two pale ones
 * Magic puts next to each other — white and colorless.
 */
const IDENTITIES: readonly ColorIdentity[] = [
  ["W"],
  ["U"],
  ["B"],
  ["R"],
  ["G"],
  ["C"],
  ["W", "U"],
  ["B", "R", "G"],
  ["W", "U", "B", "R", "G"],
  [],
];

export const EveryIdentity: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {IDENTITIES.map((colors) => (
        <ManaIdentity key={colors.join("") || "none"} {...args} colors={colors} />
      ))}
    </div>
  ),
};

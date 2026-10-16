import type { ColorIdentity } from "@deck-roulette/domain";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ManaIdentity } from "./ManaIdentity";

const meta = {
  title: "Atoms/ManaIdentity",
  component: ManaIdentity,
  args: { colors: ["W", "U", "B"] },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ManaIdentity>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Read the rendered width: jsdom ignores CSS, so only a browser can tell sr-only from shown. */
function labelWidth(canvasElement: HTMLElement, label: string): number {
  // The innermost span: the wrapper holds the same text.
  const element = [...canvasElement.querySelectorAll("span")].find(
    (span) => span.childElementCount === 0 && span.textContent === label,
  );
  return element?.getBoundingClientRect().width ?? 0;
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(labelWidth(canvasElement, "White, Blue, Black")).toBeLessThanOrEqual(1);
  },
};

/** Entered out of order, printed in WUBRG order. */
export const AlwaysInWubrgOrder: Story = {
  args: { colors: ["G", "B", "W"] },
};

export const Small: Story = {
  args: { size: "sm" },
};

/** On a deck's page, where there is room: the pips alone rely on hue. */
export const WithNames: Story = {
  args: { colors: ["W", "U"], showNames: true },
  play: async ({ canvasElement }) => {
    await expect(labelWidth(canvasElement, "White, Blue")).toBeGreaterThan(1);
  },
};

/** Includes the two pale ones side by side: white and colorless. */
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

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
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

/** "400ms" or "0.4s", in milliseconds. */
function toMs(duration: string): number {
  const value = Number.parseFloat(duration);
  return duration.trim().endsWith("ms") ? value : value * 1000;
}

/** The indicator follows the selection: only a browser lays it out. */
export const IndicatorFollows: Story = {
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group", { name: "Theme" });
    const indicator = group.querySelector('[aria-hidden="true"]');
    const dark = within(group).getByRole("radio", { name: "Dark" });
    const label = dark.closest("label");
    if (indicator === null || label === null) throw new Error("indicator or label missing");

    await userEvent.click(dark);

    // A duration class with no CSS behind it falls back to Tailwind's default, silently.
    // Waited for: the transition is only switched on a frame after the first placement.
    const token = getComputedStyle(document.documentElement).getPropertyValue("--duration-slow");
    await waitFor(() =>
      expect(toMs(getComputedStyle(indicator).transitionDuration)).toBe(toMs(token)),
    );

    await waitFor(async () => {
      const [from, to] = [indicator.getBoundingClientRect(), label.getBoundingClientRect()];
      await expect(Math.abs(from.left - to.left)).toBeLessThanOrEqual(1);
      await expect(Math.abs(from.width - to.width)).toBeLessThanOrEqual(1);
    });
  },
};

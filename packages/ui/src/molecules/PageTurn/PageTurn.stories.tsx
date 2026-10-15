import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageTurn } from "./PageTurn";

const meta = {
  title: "Molecules/PageTurn",
  component: PageTurn,
  args: {
    page: 1,
    pageCount: 3,
    next: "Sunday",
    renderLink: (direction, { children, ...props }) => (
      <a href={`#${direction}`} {...props}>
        {children}
      </a>
    ),
  },
  // Its corners pin to a positioned vellum page.
  decorators: [
    (Story) => (
      <div
        data-surface="page"
        className="relative bg-surface-raised p-4 pt-16 text-text border border-border rounded-sm"
      >
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageTurn>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First page: no previous link, no left corner. */
export const FirstPage: Story = {};

export const BetweenTwoPages: Story = { args: { page: 2, previous: "Friday night" } };

export const LongNames: Story = {
  args: {
    previous: "Thursday table with the cEDH crowd",
    next: "Sunday afternoon, bracket 2 only",
  },
};

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PageTurnProps } from "./PageTurn";
import { PageTurn } from "./PageTurn";

const renderLink: PageTurnProps["renderLink"] = (direction, { children, ...props }) => (
  <a href={`#${direction}`} {...props}>
    {children}
  </a>
);

describe("PageTurn", () => {
  it("names both neighbours, not just their direction", () => {
    render(
      <PageTurn page={2} pageCount={3} previous="Friday" next="Sunday" renderLink={renderLink} />,
    );

    const nav = screen.getByRole("navigation", { name: "Turn the page" });

    expect(within(nav).getByRole("link", { name: "Previous page: Friday" })).toBeDefined();
    expect(within(nav).getByRole("link", { name: "Next page: Sunday" })).toBeDefined();
  });

  it("says where the page sits in the book", () => {
    render(<PageTurn page={2} pageCount={3} renderLink={renderLink} />);

    expect(screen.getByText("Page 2 of 3")).toBeDefined();
  });

  it("offers no link towards a page that does not exist", () => {
    render(<PageTurn page={1} pageCount={1} renderLink={renderLink} />);

    expect(screen.queryByRole("link")).toBeNull();
  });

  it("tells assistive tech which arrow key turns each way", () => {
    render(
      <PageTurn page={2} pageCount={3} previous="Friday" next="Sunday" renderLink={renderLink} />,
    );

    const previous = screen.getByRole("link", { name: "Previous page: Friday" });
    const next = screen.getByRole("link", { name: "Next page: Sunday" });

    expect([previous.getAttribute("aria-keyshortcuts"), previous.getAttribute("rel")]).toEqual([
      "ArrowLeft",
      "prev",
    ]);
    expect([next.getAttribute("aria-keyshortcuts"), next.getAttribute("rel")]).toEqual([
      "ArrowRight",
      "next",
    ]);
  });
});

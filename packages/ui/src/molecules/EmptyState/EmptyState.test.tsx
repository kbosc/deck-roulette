import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../../atoms/Button";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("states what is missing as a heading", () => {
    render(<EmptyState title="No deck yet" description="Add your first deck to start drawing." />);

    expect(screen.getByRole("heading", { name: "No deck yet" })).toBeDefined();
  });

  it("uses a level 2 heading by default", () => {
    render(<EmptyState title="No deck yet" description="Add your first deck." />);

    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });

  it("can sit under an existing section without skipping a level", () => {
    render(<EmptyState title="No deck yet" description="Add your first deck." headingLevel={3} />);

    expect(screen.getByRole("heading", { level: 3 })).toBeDefined();
  });

  it("offers the way out it is given", () => {
    render(
      <EmptyState
        title="No deck yet"
        description="Add your first deck to start drawing."
        action={<Button>Add a deck</Button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Add a deck" })).toBeDefined();
  });

  it("hides the illustration from assistive technology", () => {
    const { container } = render(
      <EmptyState
        title="No deck yet"
        description="Add your first deck."
        illustration={<svg data-testid="art" />}
      />,
    );

    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });

  it("renders without an action, for screens whose way out lives elsewhere", () => {
    render(<EmptyState title="No match" description="No deck matches this filter." />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});

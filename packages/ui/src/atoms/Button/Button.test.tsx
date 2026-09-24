import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("is reachable by its accessible name", () => {
    render(<Button>Draw a deck</Button>);

    // getByRole is how assistive technology sees the page. Querying by class or
    // by test id would pass on a div that no screen reader can announce.
    expect(screen.getByRole("button", { name: "Draw a deck" })).toBeDefined();
  });

  it("does not submit the surrounding form unless asked to", () => {
    render(<Button>Draw</Button>);

    expect(screen.getByRole("button")).toHaveProperty("type", "button");
  });

  it("still submits when it is meant to", () => {
    render(<Button type="submit">Save</Button>);

    expect(screen.getByRole("button")).toHaveProperty("type", "submit");
  });

  it("can be operated with the keyboard alone", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Draw</Button>);

    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button")).toBe(document.activeElement);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("ignores clicks when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        Draw
      </Button>,
    );

    await user.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps the anchor when asChild is used", async () => {
    render(
      <Button asChild>
        <a href="https://scryfall.com">Open Scryfall</a>
      </Button>,
    );

    // A link must stay a link: the browser offers "open in a new tab", and a
    // screen reader announces navigation rather than an action.
    const link = screen.getByRole("link", { name: "Open Scryfall" });

    expect(link).toHaveProperty("tagName", "A");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("carries the styles over to the slotted child", () => {
    render(
      <Button asChild variant="danger">
        <a href="/delete">Delete</a>
      </Button>,
    );

    expect(screen.getByRole("link").className).toContain("bg-danger");
  });

  it("appends a caller's className instead of replacing its own", () => {
    render(<Button className="w-full">Draw</Button>);

    const { className } = screen.getByRole("button");

    expect(className).toContain("w-full");
    expect(className).toContain("bg-action");
  });
});

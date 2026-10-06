import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ManaIdentity } from "./ManaIdentity";

describe("ManaIdentity", () => {
  it("names every color it shows", () => {
    render(<ManaIdentity colors={["W", "U"]} />);

    expect(screen.getByText("White, Blue")).toBeDefined();
  });

  it("always reads the colors in WUBRG order", () => {
    render(<ManaIdentity colors={["G", "B", "W"]} />);

    expect(screen.getByText("White, Black, Green")).toBeDefined();
  });

  it("says so when a deck has no color identity", () => {
    render(<ManaIdentity colors={[]} />);

    expect(screen.getByText("No color identity")).toBeDefined();
  });

  it("hides the pips from assistive technology", () => {
    const { container } = render(<ManaIdentity colors={["R", "G"]} />);

    const pips = container.querySelectorAll("[aria-hidden='true']");

    expect(pips).toHaveLength(2);
  });

  it("never conveys the identity through color alone", () => {
    const { container } = render(<ManaIdentity colors={["W"]} />);

    expect(container.textContent).toContain("White");
  });
});

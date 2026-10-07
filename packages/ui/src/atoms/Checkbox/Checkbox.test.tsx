import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("is named by its label", () => {
    render(<Checkbox label="Atraxa" />);

    expect(screen.getByRole("checkbox", { name: "Atraxa" })).toBeDefined();
  });

  it("toggles when its label is clicked, not only the box", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Atraxa" checked={false} onChange={onChange} />);

    await user.click(screen.getByText("Atraxa"));

    expect(onChange).toHaveBeenCalledOnce();
  });

  it("toggles with the space bar", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Atraxa" checked={false} onChange={onChange} />);

    await user.tab();
    await user.keyboard(" ");

    expect(onChange).toHaveBeenCalledOnce();
  });
});

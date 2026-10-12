import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

const OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

describe("SegmentedControl", () => {
  it("is a group of radios named by its legend", () => {
    render(<SegmentedControl legend="Theme" options={OPTIONS} value="system" onChange={vi.fn()} />);

    const group = screen.getByRole("group", { name: "Theme" });
    expect(group).toBeDefined();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("checks the option matching the value", () => {
    render(<SegmentedControl legend="Theme" options={OPTIONS} value="dark" onChange={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "Dark" })).toHaveProperty("checked", true);
    expect(screen.getByRole("radio", { name: "Light" })).toHaveProperty("checked", false);
  });

  it("reports the value of the option clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SegmentedControl legend="Theme" options={OPTIONS} value="system" onChange={onChange} />,
    );

    await user.click(screen.getByText("Light"));

    expect(onChange).toHaveBeenCalledWith("light");
  });

  it("moves between options with the arrow keys", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SegmentedControl legend="Theme" options={OPTIONS} value="system" onChange={onChange} />,
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("light");
  });
});

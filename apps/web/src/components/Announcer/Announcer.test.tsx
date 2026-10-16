import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Announcer, useAnnounce } from "./Announcer";

function Speaker() {
  const announce = useAnnounce();
  return <button onClick={() => announce("Atraxa deleted.")}>Speak</button>;
}

describe("Announcer", () => {
  it("is present and silent before anything is said", () => {
    render(
      <Announcer>
        <Speaker />
      </Announcer>,
    );

    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("says what it is given", async () => {
    const user = userEvent.setup();
    render(
      <Announcer>
        <Speaker />
      </Announcer>,
    );

    await user.click(screen.getByRole("button", { name: "Speak" }));

    expect(await within(screen.getByRole("status")).findByText("Atraxa deleted.")).toBeDefined();
  });

  it("says the same thing again, rather than leaving the region unchanged", async () => {
    const user = userEvent.setup();
    render(
      <Announcer>
        <Speaker />
      </Announcer>,
    );
    const region = screen.getByRole("status");

    await user.click(screen.getByRole("button", { name: "Speak" }));
    await within(region).findByText("Atraxa deleted.");
    await user.click(screen.getByRole("button", { name: "Speak" }));

    // Emptied first: an unchanged region is not read again.
    expect(region.textContent).toBe("");
    expect(await within(region).findByText("Atraxa deleted.")).toBeDefined();
  });

  it("refuses to be used without its region, rather than speaking to no one", () => {
    // React logs the thrown error on top of throwing it: the throw is what is checked.
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Speaker />)).toThrow(/Announcer/);
    log.mockRestore();
  });
});

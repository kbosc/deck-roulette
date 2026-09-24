import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { ConfirmDialog } from "./ConfirmDialog";

/** A host that owns the open state, the way a real screen would. */
function Harness({ onConfirm = vi.fn() }: { readonly onConfirm?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Delete this deck?"
      description="Atraxa will be removed from every pool it belongs to. This cannot be undone."
      confirmLabel="Delete"
      onConfirm={onConfirm}
      trigger={<Button variant="danger">Delete deck</Button>}
    />
  );
}

describe("ConfirmDialog", () => {
  it("stays closed until the trigger is used", () => {
    render(<Harness />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is announced with its title and its description", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Delete deck" }));

    // Radix wires aria-labelledby and aria-describedby from Dialog.Title and
    // Dialog.Description. Querying by accessible name proves the wiring, not
    // just that the text is on screen somewhere.
    const dialog = screen.getByRole("dialog", { name: "Delete this deck?" });
    const describedBy = dialog.getAttribute("aria-describedby");

    expect(describedBy).not.toBeNull();
    expect(describedBy === null ? null : document.getElementById(describedBy)?.textContent).toContain(
      "removed from every pool",
    );
  });

  it("puts focus on the harmless button, not on the destructive one", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Delete deck" }));

    // Someone who confirms a dialog reflexively with Enter must not delete
    // anything. This is ours to get right: Radix would focus the first
    // focusable element, which is the close button.
    expect(screen.getByRole("button", { name: "Cancel" })).toBe(document.activeElement);
  });

  it("closes on Escape without confirming", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Delete deck" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("gives focus back to the trigger once closed", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Delete deck" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    // Without this, a keyboard user is dropped back at the top of the document
    // and has to tab all the way down to where they were.
    expect(trigger).toBe(document.activeElement);
  });

  it("confirms and closes when the destructive button is used", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Delete deck" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancels without confirming", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Delete deck" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the focus inside while it is open", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Delete deck" }));

    const dialog = screen.getByRole("dialog");

    // Tabbing past the last control must wrap back inside, never reach the page
    // behind. This is the part that costs hundreds of lines to write by hand.
    await user.tab();
    await user.tab();
    await user.tab();

    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});

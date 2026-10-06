import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { ConfirmDialog } from "./ConfirmDialog";

function Harness({
  onConfirm = vi.fn(),
  onConfirmedFocus,
}: {
  readonly onConfirm?: () => void;
  readonly onConfirmedFocus?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      {...(onConfirmedFocus === undefined ? {} : { onConfirmedFocus })}
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

    const dialog = screen.getByRole("dialog", { name: "Delete this deck?" });
    const describedBy = dialog.getAttribute("aria-describedby");

    expect(describedBy).not.toBeNull();
    expect(
      describedBy === null ? null : document.getElementById(describedBy)?.textContent,
    ).toContain("removed from every pool");
  });

  it("puts focus on the harmless button, not on the destructive one", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Delete deck" }));

    // Radix would focus the first focusable element otherwise.
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

    await user.tab();
    await user.tab();
    await user.tab();

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("sends focus where it is told once the action is confirmed", async () => {
    const onConfirmedFocus = vi.fn();
    const user = userEvent.setup();
    render(<Harness onConfirmedFocus={onConfirmedFocus} />);

    await user.click(screen.getByRole("button", { name: "Delete deck" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirmedFocus).toHaveBeenCalledOnce();
  });

  it("returns focus to the trigger when the question is cancelled", async () => {
    const onConfirmedFocus = vi.fn();
    const user = userEvent.setup();
    render(<Harness onConfirmedFocus={onConfirmedFocus} />);

    const trigger = screen.getByRole("button", { name: "Delete deck" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirmedFocus).not.toHaveBeenCalled();
    expect(trigger).toBe(document.activeElement);
  });

  it("restores focus even when the dialog has no Dialog.Trigger", async () => {
    function WithoutTrigger() {
      const [open, setOpen] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Delete deck
          </button>
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Delete this deck?"
            description="Gone for good."
            confirmLabel="Delete"
            onConfirm={vi.fn()}
          />
        </>
      );
    }

    const user = userEvent.setup();
    render(<WithoutTrigger />);

    const opener = screen.getByRole("button", { name: "Delete deck" });
    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // No Dialog.Trigger here: Radix alone would drop focus on the body.
    expect(document.activeElement).toBe(opener);
  });
});

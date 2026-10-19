import type { Deck, DeckEdit } from "@deck-roulette/domain";
import { toDeckId } from "@deck-roulette/domain";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DeckForm } from "./DeckForm";

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: toDeckId("d1"),
    name: "Atraxa",
    createdAt: "2026-10-19T00:00:00.000Z",
    ...overrides,
  };
}

const acceptAnyName = () => undefined;

/** Saves into its own state, as the store would: the form then sees the saved deck. */
function SavingForm({ initial, onSave }: { initial: Deck; onSave: (edit: DeckEdit) => void }) {
  const [deck, setDeck] = useState(initial);
  return (
    <DeckForm
      deck={deck}
      checkName={(name) => (name.trim() === "" ? "Give the deck a name." : undefined)}
      onSave={(edit) => {
        onSave(edit);
        setDeck({ id: deck.id, createdAt: deck.createdAt, ...edit });
      }}
    />
  );
}

function saveButton() {
  return screen.queryByRole("button", { name: "Save changes" });
}

describe("DeckForm", () => {
  it("shows every detail of the deck in a named field", () => {
    render(
      <DeckForm
        deck={makeDeck({ commanders: ["Atraxa, Praetors' Voice"], colors: ["W", "G"], bracket: 3 })}
        checkName={acceptAnyName}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveProperty("value", "Atraxa");
    expect(screen.getByRole("textbox", { name: "Commander" })).toHaveProperty(
      "value",
      "Atraxa, Praetors' Voice",
    );
    const colors = within(screen.getByRole("group", { name: "Color identity" }));
    expect(colors.getByRole("checkbox", { name: "White" })).toHaveProperty("checked", true);
    expect(colors.getByRole("checkbox", { name: "Blue" })).toHaveProperty("checked", false);
    const bracket = within(screen.getByRole("group", { name: "Bracket" }));
    expect(bracket.getByRole("radio", { name: "3" })).toHaveProperty("checked", true);
  });

  it("says what is not set yet", () => {
    render(<DeckForm deck={makeDeck()} checkName={acceptAnyName} onSave={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "Commander" })).toHaveProperty(
      "placeholder",
      "Not set",
    );
    expect(screen.getByRole("radio", { name: "Not set" })).toHaveProperty("checked", true);
  });

  it("offers to save only once something has changed, and no longer once undone", async () => {
    const user = userEvent.setup();
    render(<DeckForm deck={makeDeck()} checkName={acceptAnyName} onSave={vi.fn()} />);

    expect(saveButton()).toBeNull();

    await user.click(screen.getByRole("radio", { name: "2" }));
    expect(saveButton()).not.toBeNull();

    await user.click(screen.getByRole("radio", { name: "Not set" }));
    expect(saveButton()).toBeNull();
  });

  it("saves every detail at once, trimmed, in the order players read colors", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<DeckForm deck={makeDeck()} checkName={acceptAnyName} onSave={onSave} />);

    await user.type(screen.getByRole("textbox", { name: "Commander" }), " Tana ");
    await user.click(screen.getByRole("button", { name: "Add a second commander" }));
    await user.type(screen.getByRole("textbox", { name: "Second commander" }), "Tymna");
    await user.click(screen.getByRole("checkbox", { name: "Green" }));
    await user.click(screen.getByRole("checkbox", { name: "White" }));
    await user.click(screen.getByRole("radio", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSave).toHaveBeenCalledWith({
      name: "Atraxa",
      commanders: ["Tana", "Tymna"],
      colors: ["W", "G"],
      bracket: 4,
    });
  });

  it("keeps colorless apart from the colors, and says so", async () => {
    const user = userEvent.setup();
    render(
      <DeckForm
        deck={makeDeck({ colors: ["W", "U"] })}
        checkName={acceptAnyName}
        onSave={vi.fn()}
      />,
    );
    const colors = screen.getByRole("group", { name: "Color identity" });

    await user.click(screen.getByRole("checkbox", { name: "Colorless" }));
    expect(
      within(colors)
        .getAllByRole("checkbox")
        .filter((box) => box instanceof HTMLInputElement && box.checked),
    ).toEqual([screen.getByRole("checkbox", { name: "Colorless" })]);

    await user.click(screen.getByRole("checkbox", { name: "Green" }));
    expect(screen.getByRole("checkbox", { name: "Colorless" })).toHaveProperty("checked", false);
    expect(screen.getByRole("checkbox", { name: "Green" })).toHaveProperty("checked", true);

    expect(
      document.getElementById(colors.getAttribute("aria-describedby") ?? "")?.textContent,
    ).toMatch(/Colorless cannot go with a color/);
  });

  it("saves an emptied field as not set", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <DeckForm
        deck={makeDeck({ commanders: ["Atraxa"], colors: ["W"] })}
        checkName={acceptAnyName}
        onSave={onSave}
      />,
    );

    await user.clear(screen.getByRole("textbox", { name: "Commander" }));
    await user.click(screen.getByRole("checkbox", { name: "White" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSave).toHaveBeenCalledWith({ name: "Atraxa" });
  });

  it("saves with Enter, like any form", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<DeckForm deck={makeDeck()} checkName={acceptAnyName} onSave={onSave} />);

    await user.type(screen.getByRole("textbox", { name: "Commander" }), "Atraxa{Enter}");

    expect(onSave).toHaveBeenCalledOnce();
  });

  it("leaves focus in the field when saved with Enter: it is still there", async () => {
    const user = userEvent.setup();
    render(<SavingForm initial={makeDeck()} onSave={vi.fn()} />);

    const commander = screen.getByRole("textbox", { name: "Commander" });
    await user.type(commander, "Atraxa{Enter}");

    expect(document.activeElement).toBe(commander);
  });

  it("moves focus into the second commander field it adds, and back when it is removed", async () => {
    const user = userEvent.setup();
    render(<DeckForm deck={makeDeck()} checkName={acceptAnyName} onSave={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Add a second commander" }));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Second commander" }));

    await user.click(screen.getByRole("button", { name: "Remove second commander" }));
    expect(screen.queryByRole("textbox", { name: "Second commander" })).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Add a second commander" }),
    );
  });

  it("refuses a bad name, says why next to the field, and puts focus there", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<SavingForm initial={makeDeck()} onSave={onSave} />);

    const name = screen.getByRole("textbox", { name: "Name" });
    await user.clear(name);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Give the deck a name.");
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(name.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
    expect(document.activeElement).toBe(name);
  });

  it("says nothing about the name before a save is tried", async () => {
    const user = userEvent.setup();
    render(<SavingForm initial={makeDeck()} onSave={vi.fn()} />);

    await user.clear(screen.getByRole("textbox", { name: "Name" }));

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("puts the deck back as it was when the changes are discarded", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<SavingForm initial={makeDeck({ bracket: 2 })} onSave={onSave} />);

    await user.click(screen.getByRole("radio", { name: "5" }));
    await user.click(screen.getByRole("button", { name: "Discard" }));

    expect(screen.getByRole("radio", { name: "2" })).toHaveProperty("checked", true);
    expect(saveButton()).toBeNull();
    expect(onSave).not.toHaveBeenCalled();
    // The button that had focus is gone: focus lands on the form, not on the page.
    expect(document.activeElement).toBe(screen.getByRole("form", { name: "Deck details" }));
  });

  it("hides the save bar once saved, keeping focus on the form", async () => {
    const user = userEvent.setup();
    render(<SavingForm initial={makeDeck()} onSave={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(saveButton()).toBeNull();
    expect(screen.getByRole("radio", { name: "1" })).toHaveProperty("checked", true);
    expect(document.activeElement).toBe(screen.getByRole("form", { name: "Deck details" }));
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LibraryRoute } from "./LibraryRoute";
import { useLibrary } from "../../store/library";

/**
 * The name field, found by what a screen reader announces: the label plus the
 * hidden "(required)". The asterisk is aria-hidden, so it is not part of it.
 */
function nameField() {
  return screen.getByRole("textbox", { name: "Deck name (required)" });
}

async function addDeck(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.type(nameField(), name);
  await user.click(screen.getByRole("button", { name: "Add" }));
}

describe("LibraryRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    useLibrary.setState({ decks: [], pools: [] });
  });

  it("shows a deck on screen once it has been added", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");

    expect(screen.getByRole("heading", { name: "Atraxa" })).toBeDefined();
  });

  it("empties the field after adding, ready for the next one", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");

    expect(nameField()).toHaveProperty("value", "");
  });

  it("says nothing about the name before anything has been submitted", () => {
    render(<LibraryRoute />);

    expect(screen.queryByRole("alert")).toBeNull();
    expect(nameField().getAttribute("aria-invalid")).toBeNull();
  });

  it("explains why an empty name is refused, instead of doing nothing", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("alert").textContent).toBe("Give the deck a name.");
    expect(useLibrary.getState().decks).toHaveLength(0);
  });

  it("refuses a name made of spaces only, like an empty one", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "   ");

    expect(screen.getByRole("alert").textContent).toBe("Give the deck a name.");
  });

  it("marks the field invalid and ties the message to it", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await user.click(screen.getByRole("button", { name: "Add" }));

    const field = nameField();
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(field.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
  });

  it("refuses a name already in the library, whatever its case", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");
    await addDeck(user, "atraxa");

    expect(screen.getByRole("alert").textContent).toBe(
      "A deck with this name is already in your library.",
    );
    expect(useLibrary.getState().decks).toHaveLength(1);
  });

  it("keeps the refused name in the field, so it can be corrected", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");
    await addDeck(user, "atraxa");

    expect(nameField()).toHaveProperty("value", "atraxa");
  });

  it("puts focus back in the field, ready to type the name", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(document.activeElement).toBe(nameField());
  });

  it("clears the message as soon as the name becomes valid", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(nameField(), "A");

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the message while the name is still only spaces", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(nameField(), "  ");

    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("names the delete button after the deck it would delete", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");

    // Heard out of context, three identical "Delete" buttons say nothing.
    expect(screen.getByRole("button", { name: "Delete Atraxa" })).toBeDefined();
  });

  it("asks before deleting, saying what will be lost", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");
    await user.click(screen.getByRole("button", { name: "Delete Atraxa" }));

    expect(screen.getByRole("dialog", { name: "Delete Atraxa?" })).toBeDefined();
    expect(screen.getByText(/removed from every pool/)).toBeDefined();
    // The deck is still there while the question is being asked.
    expect(useLibrary.getState().decks).toHaveLength(1);
  });

  it("keeps the deck when the question is cancelled", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");
    await user.click(screen.getByRole("button", { name: "Delete Atraxa" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(useLibrary.getState().decks).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Atraxa" })).toBeDefined();
  });

  it("deletes the deck once confirmed", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");
    await user.click(screen.getByRole("button", { name: "Delete Atraxa" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(useLibrary.getState().decks).toHaveLength(0);
    expect(screen.getByRole("heading", { name: "No deck yet" })).toBeDefined();
  });

  it("deletes only the deck that was asked about", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");
    await addDeck(user, "Krenko");
    await user.click(screen.getByRole("button", { name: "Delete Krenko" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(useLibrary.getState().decks.map((deck) => deck.name)).toEqual(["Atraxa"]);
  });

  it("puts focus somewhere stable after a deletion", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");
    await user.click(screen.getByRole("button", { name: "Delete Atraxa" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    // The button the dialog came from no longer exists, so focus would fall to
    // the document body and strand a keyboard user at the top of the page.
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1 }));
  });

  it("returns focus to the delete button when the question is cancelled", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");
    const trigger = screen.getByRole("button", { name: "Delete Atraxa" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Nothing was destroyed: landing back on the button is what someone who
    // changed their mind expects.
    expect(document.activeElement).toBe(trigger);
  });

  it("announces the deletion without moving focus to the message", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");
    await user.click(screen.getByRole("button", { name: "Delete Atraxa" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByRole("status").textContent).toBe("Atraxa deleted.");
  });

  it("mounts a single dialog, not one per deck", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await addDeck(user, "Atraxa");
    await addDeck(user, "Krenko");

    expect(screen.queryAllByRole("dialog")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Delete Krenko" }));

    expect(screen.queryAllByRole("dialog")).toHaveLength(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { LibraryRoute } from "./LibraryRoute";
import { useLibrary } from "../../store/library";

/** Deck names are links: they need a router around them. */
function renderLibrary() {
  return render(
    <MemoryRouter>
      <LibraryRoute />
    </MemoryRouter>,
  );
}

/** The asterisk is aria-hidden: the accessible name carries "(required)" instead. */
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
    renderLibrary();

    await addDeck(user, "Atraxa");

    expect(screen.getByRole("heading", { name: "Atraxa" })).toBeDefined();
  });

  it("introduces the decks with a level 2 heading, so no level is skipped", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await addDeck(user, "Atraxa");

    expect(screen.getByRole("heading", { level: 2, name: "Your decks" })).toBeDefined();
  });

  it("empties the field after adding, ready for the next one", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await addDeck(user, "Atraxa");

    expect(nameField()).toHaveProperty("value", "");
  });

  it("says nothing about the name before anything has been submitted", () => {
    renderLibrary();

    expect(screen.queryByRole("alert")).toBeNull();
    expect(nameField().getAttribute("aria-invalid")).toBeNull();
  });

  it("explains why an empty name is refused, instead of doing nothing", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("alert").textContent).toBe("Give the deck a name.");
    expect(useLibrary.getState().decks).toHaveLength(0);
  });

  it("refuses a name made of spaces only, like an empty one", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await addDeck(user, "   ");

    expect(screen.getByRole("alert").textContent).toBe("Give the deck a name.");
  });

  it("marks the field invalid and ties the message to it", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: "Add" }));

    const field = nameField();
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(field.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
  });

  it("refuses a name already in the library, whatever its case", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await addDeck(user, "Atraxa");
    await addDeck(user, "atraxa");

    expect(screen.getByRole("alert").textContent).toBe(
      "A deck with this name is already in your library.",
    );
    expect(useLibrary.getState().decks).toHaveLength(1);
  });

  it("keeps the refused name in the field, so it can be corrected", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await addDeck(user, "Atraxa");
    await addDeck(user, "atraxa");

    expect(nameField()).toHaveProperty("value", "atraxa");
  });

  it("puts focus back in the field, ready to type the name", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(document.activeElement).toBe(nameField());
  });

  it("clears the message as soon as the name becomes valid", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(nameField(), "A");

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the message while the name is still only spaces", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(nameField(), "  ");

    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("links every deck's name to its page", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await addDeck(user, "Atraxa");

    const deck = useLibrary.getState().decks[0];
    expect(screen.getByRole("link", { name: "Atraxa" }).getAttribute("href")).toBe(
      `/decks/${deck?.id ?? ""}`,
    );
  });

  it("leaves deleting to the deck's own page", async () => {
    const user = userEvent.setup();
    renderLibrary();

    await addDeck(user, "Atraxa");

    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });
});

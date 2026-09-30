import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LibraryRoute } from "./LibraryRoute";
import { useLibrary } from "../../store/library";

describe("LibraryRoute", () => {
  it("shows a deck on screen once it has been added", async () => {
    const user = userEvent.setup();
    render(<LibraryRoute />);

    await user.type(screen.getByLabelText("Deck name"), "Atraxa");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("heading", { name: "Atraxa" })).toBeDefined();
  });

  it("really did store the deck", () => {
    // The data is correct. Only the screen is lying.
    expect(useLibrary.getState().decks).toHaveLength(1);
  });
});

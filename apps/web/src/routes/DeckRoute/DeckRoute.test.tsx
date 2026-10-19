import { addDeckToPool } from "@deck-roulette/domain";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "../../app/routes";
import { useLibrary } from "../../store/library";

/** Opened from the library, as in the app: Back has somewhere to go. */
function renderDeck(deckName: string) {
  const deck = useLibrary.getState().decks.find((d) => d.name === deckName);
  const router = createMemoryRouter(routes, {
    initialEntries: ["/", `/decks/${deck?.id ?? "unknown"}`],
  });
  render(<RouterProvider router={router} />);
  return router;
}

/** Until a pool's decks can be chosen from the deck's page. */
function putInPool(deckName: string, poolName: string) {
  useLibrary.getState().addPool(poolName);
  const { decks, pools } = useLibrary.getState();
  const deck = decks.find((d) => d.name === deckName);
  if (deck === undefined) throw new Error("seeding failed");

  useLibrary.setState({
    pools: pools.map((p) => (p.name === poolName ? addDeckToPool(p, deck.id) : p)),
  });
}

describe("DeckRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    useLibrary.setState({ decks: [], pools: [] });
  });

  it("titles the page, and the browser tab, with the deck's name", () => {
    useLibrary.getState().addDeck("Atraxa");
    renderDeck("Atraxa");

    expect(screen.getByRole("heading", { level: 1, name: "Atraxa" })).toBeDefined();
    expect(document.title).toBe("Atraxa · Deck Roulette");
  });

  it("says when the deck is in no pool yet", () => {
    useLibrary.getState().addDeck("Atraxa");
    renderDeck("Atraxa");

    expect(screen.getByText("In no pool yet.")).toBeDefined();
  });

  describe("editing the deck", () => {
    it("saves the details into the library, and says so", async () => {
      useLibrary.getState().addDeck("Atraxa");
      const user = userEvent.setup();
      renderDeck("Atraxa");

      await user.type(
        screen.getByRole("textbox", { name: "Commander" }),
        "Atraxa, Praetors' Voice",
      );
      await user.click(screen.getByRole("radio", { name: "4" }));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(useLibrary.getState().decks[0]).toMatchObject({
        commanders: ["Atraxa, Praetors' Voice"],
        bracket: 4,
      });
      expect(await within(screen.getByRole("status")).findByText("Changes saved.")).toBeDefined();
    });

    it("renames the page and the tab along with the deck", async () => {
      useLibrary.getState().addDeck("Atraxa");
      const user = userEvent.setup();
      renderDeck("Atraxa");

      const name = screen.getByRole("textbox", { name: "Name" });
      await user.clear(name);
      await user.type(name, "Superfriends{Enter}");

      expect(screen.getByRole("heading", { level: 1, name: "Superfriends" })).toBeDefined();
      expect(document.title).toBe("Superfriends · Deck Roulette");
    });

    it("refuses the name of another deck, with the library's wording", async () => {
      useLibrary.getState().addDeck("Atraxa");
      useLibrary.getState().addDeck("Krenko");
      const user = userEvent.setup();
      renderDeck("Atraxa");

      const name = screen.getByRole("textbox", { name: "Name" });
      await user.clear(name);
      await user.type(name, "krenko{Enter}");

      expect(screen.getByRole("alert").textContent).toBe(
        "A deck with this name is already in your library.",
      );
      expect(useLibrary.getState().decks[0]?.name).toBe("Atraxa");
    });

    it("lets the deck keep its own name while other details change", async () => {
      useLibrary.getState().addDeck("Atraxa");
      const user = userEvent.setup();
      renderDeck("Atraxa");

      await user.click(screen.getByRole("radio", { name: "2" }));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(screen.queryByRole("alert")).toBeNull();
      expect(useLibrary.getState().decks[0]?.bracket).toBe(2);
    });

    it("shows what was actually saved, once the library has tidied it", async () => {
      useLibrary.getState().addDeck("Atraxa");
      const user = userEvent.setup();
      renderDeck("Atraxa");

      // Colorless next to a color, a partner with no commander: both tidied on save.
      await user.click(screen.getByRole("checkbox", { name: "White" }));
      await user.click(screen.getByRole("checkbox", { name: "Colorless" }));
      await user.click(screen.getByRole("button", { name: "Add a partner" }));
      await user.type(screen.getByRole("textbox", { name: "Partner" }), "Tymna");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(screen.getByRole("checkbox", { name: "Colorless" })).toHaveProperty("checked", false);
      expect(screen.getByRole("textbox", { name: "Commander" })).toHaveProperty("value", "Tymna");
      expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
    });

    it("saves nothing when Enter is pressed without a change", async () => {
      useLibrary.getState().addDeck("Atraxa");
      const user = userEvent.setup();
      renderDeck("Atraxa");
      const before = useLibrary.getState().decks;

      await user.type(screen.getByRole("textbox", { name: "Name" }), "{Enter}");

      // No save button without a change, and HTML only submits on Enter through one.
      expect(useLibrary.getState().decks).toBe(before);
    });

    it("starts afresh on another deck's page", async () => {
      useLibrary.getState().addDeck("Atraxa");
      useLibrary.getState().addDeck("Krenko");
      const user = userEvent.setup();
      const router = renderDeck("Atraxa");

      await user.click(screen.getByRole("radio", { name: "5" }));
      const krenko = useLibrary.getState().decks[1];
      await act(() => router.navigate(`/decks/${krenko?.id ?? ""}`));

      expect(screen.getByRole("heading", { level: 1, name: "Krenko" })).toBeDefined();
      expect(screen.getByRole("radio", { name: "Not set" })).toHaveProperty("checked", true);
      expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
    });
  });

  it("links to every pool holding the deck, and to none other", () => {
    useLibrary.getState().addDeck("Atraxa");
    putInPool("Atraxa", "Thursday table");
    useLibrary.getState().addPool("Sunday");
    renderDeck("Atraxa");

    const pool = useLibrary.getState().pools.find((p) => p.name === "Thursday table");
    expect(screen.getByRole("link", { name: "Thursday table" }).getAttribute("href")).toBe(
      `/pools/${pool?.id ?? ""}`,
    );
    expect(screen.queryByRole("link", { name: "Sunday" })).toBeNull();
  });

  it("leads back to the whole library", async () => {
    useLibrary.getState().addDeck("Atraxa");
    const user = userEvent.setup();
    renderDeck("Atraxa");

    await user.click(screen.getByRole("link", { name: "All decks" }));

    expect(screen.getByRole("heading", { level: 1, name: "Library" })).toBeDefined();
  });

  it("says so when the deck does not exist, with a way back", () => {
    renderDeck("Ghost");

    expect(screen.getByRole("heading", { name: "This deck does not exist" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Back to the library" }).getAttribute("href")).toBe(
      "/",
    );
    expect(document.title).toBe("Deck not found · Deck Roulette");
  });

  describe("deleting the deck", () => {
    async function askToDelete(deckName: string) {
      const user = userEvent.setup();
      const router = renderDeck(deckName);
      const trigger = screen.getByRole("button", { name: "Delete deck" });
      await user.click(trigger);
      return { user, router, trigger };
    }

    it("asks first, saying what will be lost", async () => {
      useLibrary.getState().addDeck("Atraxa");
      await askToDelete("Atraxa");

      expect(screen.getByRole("dialog", { name: "Delete Atraxa?" })).toBeDefined();
      expect(screen.getByText(/removed from every pool/)).toBeDefined();
      expect(useLibrary.getState().decks).toHaveLength(1);
    });

    it("keeps the deck, and focus on the button, when cancelled", async () => {
      useLibrary.getState().addDeck("Atraxa");
      const { user, trigger } = await askToDelete("Atraxa");

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(useLibrary.getState().decks).toHaveLength(1);
      expect(document.activeElement).toBe(trigger);
    });

    it("deletes it from the library and from its pools once confirmed", async () => {
      useLibrary.getState().addDeck("Atraxa");
      useLibrary.getState().addDeck("Krenko");
      putInPool("Atraxa", "Friday night");
      const { user } = await askToDelete("Atraxa");

      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(useLibrary.getState().decks.map((d) => d.name)).toEqual(["Krenko"]);
      expect(useLibrary.getState().pools[0]?.deckIds).toEqual([]);
    });

    it("lands on the library, focused on its heading, and says what was deleted", async () => {
      useLibrary.getState().addDeck("Atraxa");
      const { user } = await askToDelete("Atraxa");

      await user.click(screen.getByRole("button", { name: "Delete" }));

      const heading = screen.getByRole("heading", { level: 1, name: "Library" });
      await waitFor(() => expect(document.activeElement).toBe(heading));
      expect(await within(screen.getByRole("status")).findByText("Atraxa deleted.")).toBeDefined();
    });

    it("never shows the deck as missing on the way out", async () => {
      useLibrary.getState().addDeck("Atraxa");
      await askToDelete("Atraxa");
      const setTitle = vi.spyOn(document, "title", "set");

      // Outside act(): it would batch the navigation with the deletion and hide the race.
      const actEnvironment = Reflect.get(globalThis, "IS_REACT_ACT_ENVIRONMENT");
      Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", false);
      try {
        screen.getByRole("button", { name: "Delete" }).click();
        await screen.findByRole("heading", { level: 1, name: "Library" });
      } finally {
        Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", actEnvironment);
      }

      const titles = setTitle.mock.calls.map(([title]) => title);
      setTitle.mockRestore();
      expect(titles).not.toContain("Deck not found · Deck Roulette");
    });

    it("leaves no way back to the deleted deck's page", async () => {
      useLibrary.getState().addDeck("Atraxa");
      const { user, router } = await askToDelete("Atraxa");

      await user.click(screen.getByRole("button", { name: "Delete" }));
      await act(() => router.navigate(-1));

      expect(screen.queryByRole("heading", { name: "This deck does not exist" })).toBeNull();
      expect(screen.getByRole("heading", { level: 1, name: "Library" })).toBeDefined();
    });
  });
});

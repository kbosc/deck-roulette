import { addDeckToPool } from "@deck-roulette/domain";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "../../app/routes";
import { useLibrary } from "../../store/library";

/** Opened from the list of pools, as in the app: Back has somewhere to go. */
function renderPool(poolName: string) {
  const pool = useLibrary.getState().pools.find((p) => p.name === poolName);
  const router = createMemoryRouter(routes, {
    initialEntries: ["/pools", `/pools/${pool?.id ?? "unknown"}`],
  });
  render(<RouterProvider router={router} />);
  return router;
}

function seedPool(poolName: string, deckNames: readonly string[]) {
  deckNames.forEach((name) => useLibrary.getState().addDeck(name));
  useLibrary.getState().addPool(poolName);
  const { decks, pools } = useLibrary.getState();
  useLibrary.setState({
    pools: pools.map((p) =>
      p.name === poolName ? decks.reduce((acc, deck) => addDeckToPool(acc, deck.id), p) : p,
    ),
  });
}

function poolId() {
  return useLibrary.getState().pools[0]?.id ?? "";
}

describe("PoolRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    useLibrary.setState({ decks: [], pools: [] });
  });

  it("titles the page with the pool's name", () => {
    seedPool("Thursday table", ["Atraxa"]);
    renderPool("Thursday table");

    expect(screen.getByRole("heading", { level: 1, name: "Thursday table" })).toBeDefined();
  });

  it("draws from the page, names the deck and crosses it off the list", async () => {
    seedPool("Thursday table", ["Atraxa"]);
    const user = userEvent.setup();
    renderPool("Thursday table");

    await user.click(screen.getByRole("button", { name: "Draw a deck" }));

    expect(within(screen.getByRole("main")).getByRole("status").textContent).toBe(
      "Atraxa, from Thursday table.",
    );
    const list = screen.getByRole("list", { name: "Decks in Thursday table" });
    expect(within(list).getByRole("listitem").textContent).toContain("Atraxa, drawn last");
  });

  it("starts a new cycle once every deck has come out", async () => {
    seedPool("Thursday table", ["Atraxa"]);
    const user = userEvent.setup();
    renderPool("Thursday table");

    await user.click(screen.getByRole("button", { name: "Draw a deck" }));
    await user.click(screen.getByRole("button", { name: "Start a new cycle" }));

    expect(screen.getByRole("button", { name: "Draw a deck" })).toBeDefined();
    expect(within(screen.getByRole("main")).getByRole("status").textContent).toBe("");
  });

  it("leads to choosing the pool's decks", () => {
    seedPool("Thursday table", ["Atraxa"]);
    renderPool("Thursday table");

    expect(screen.getByRole("link", { name: "Choose decks" }).getAttribute("href")).toBe(
      `/pools/${poolId()}/decks`,
    );
  });

  it("offers a single way to choose the decks of an empty pool", () => {
    seedPool("Thursday table", []);
    renderPool("Thursday table");

    expect(screen.getAllByRole("link", { name: "Choose decks" })).toHaveLength(1);
  });

  it("leads back to the list of pools", () => {
    seedPool("Thursday table", []);
    renderPool("Thursday table");

    expect(screen.getByRole("link", { name: "All pools" }).getAttribute("href")).toBe("/pools");
  });

  it("explains a pool that does not exist, rather than showing a blank page", () => {
    renderPool("Nowhere");

    expect(screen.getByRole("heading", { name: "This pool does not exist" })).toBeDefined();
  });

  describe("turning the pages", () => {
    function seedBook() {
      seedPool("Friday night", ["Atraxa"]);
      useLibrary.getState().addPool("Sunday");
      useLibrary.getState().addPool("Thursday table");
    }

    function idOf(name: string) {
      return useLibrary.getState().pools.find((p) => p.name === name)?.id ?? "";
    }

    it("says where the page sits in the book", () => {
      seedBook();
      renderPool("Sunday");

      expect(screen.getByText("Page 2 of 3")).toBeDefined();
    });

    it("leads to the pages on either side", () => {
      seedBook();
      renderPool("Sunday");

      const pages = screen.getByRole("navigation", { name: "Turn the page" });
      expect(
        within(pages)
          .getByRole("link", { name: "Previous page: Friday night" })
          .getAttribute("href"),
      ).toBe(`/pools/${idOf("Friday night")}`);
      expect(
        within(pages).getByRole("link", { name: "Next page: Thursday table" }).getAttribute("href"),
      ).toBe(`/pools/${idOf("Thursday table")}`);
    });

    it("has no page before the first one, nor after the last", () => {
      seedBook();
      renderPool("Friday night");
      expect(screen.queryByRole("link", { name: /^Previous page/ })).toBeNull();
      cleanup();

      renderPool("Thursday table");
      expect(screen.queryByRole("link", { name: /^Next page/ })).toBeNull();
    });

    it("turns with the arrow keys", () => {
      seedBook();
      renderPool("Sunday");

      fireEvent.keyDown(document.body, { key: "ArrowRight" });
      expect(screen.getByRole("heading", { level: 1, name: "Thursday table" })).toBeDefined();

      fireEvent.keyDown(document.body, { key: "ArrowLeft" });
      expect(screen.getByRole("heading", { level: 1, name: "Sunday" })).toBeDefined();
    });

    it("leaves arrows alone while a dialog is open over the page", async () => {
      seedBook();
      const user = userEvent.setup();
      renderPool("Sunday");

      await user.click(screen.getByRole("button", { name: "Delete pool" }));
      fireEvent.keyDown(screen.getByRole("button", { name: "Cancel" }), { key: "ArrowRight" });

      // Hidden: the modal hides the page behind it from assistive tech.
      expect(screen.getByRole("heading", { level: 1, name: "Sunday", hidden: true })).toBeDefined();
      expect(screen.getByRole("dialog", { name: "Delete Sunday?" })).toBeDefined();
    });

    // Alt+Left is the browser's own Back; the others belong to the OS or to text selection.
    it.each(["altKey", "ctrlKey", "metaKey", "shiftKey"])(
      "leaves arrows with %s to the browser",
      (modifier) => {
        seedBook();
        renderPool("Sunday");

        fireEvent.keyDown(document.body, { key: "ArrowRight", [modifier]: true });

        expect(screen.getByRole("heading", { level: 1, name: "Sunday" })).toBeDefined();
      },
    );

    it("leaves arrows to a control that uses them, like the theme picker", () => {
      seedBook();
      renderPool("Sunday");

      fireEvent.keyDown(screen.getByRole("radio", { name: "System" }), { key: "ArrowRight" });

      expect(screen.getByRole("heading", { level: 1, name: "Sunday" })).toBeDefined();
    });

    it("leaves arrows a component has already handled", () => {
      seedBook();
      renderPool("Sunday");
      document.body.addEventListener("keydown", (event) => event.preventDefault(), { once: true });

      fireEvent.keyDown(document.body, { key: "ArrowRight" });

      expect(screen.getByRole("heading", { level: 1, name: "Sunday" })).toBeDefined();
    });

    it("turns one page per press, not the whole book while the key is held", () => {
      seedBook();
      renderPool("Friday night");

      fireEvent.keyDown(document.body, { key: "ArrowRight" });
      fireEvent.keyDown(document.body, { key: "ArrowRight", repeat: true });

      expect(screen.getByRole("heading", { level: 1, name: "Sunday" })).toBeDefined();
    });

    it("does not carry a draw over to the next page", async () => {
      seedBook();
      const user = userEvent.setup();
      renderPool("Friday night");

      await user.click(screen.getByRole("button", { name: "Draw a deck" }));
      await user.click(screen.getByRole("link", { name: "Next page: Sunday" }));

      expect(within(screen.getByRole("main")).getByRole("status").textContent).toBe("");
    });
  });

  describe("the page-turn animation", () => {
    // jsdom has no View Transitions: stand in for the browser, running the update at once.
    const startViewTransition = vi.fn((update: () => unknown) => {
      void update();
      const done = Promise.resolve();
      return { finished: done, ready: done, updateCallbackDone: done, skipTransition: vi.fn() };
    });

    beforeEach(() => {
      Object.defineProperty(document, "startViewTransition", {
        value: startViewTransition,
        configurable: true,
      });
      startViewTransition.mockClear();
    });

    afterEach(() => {
      Reflect.deleteProperty(document, "startViewTransition");
      delete document.documentElement.dataset["turn"];
    });

    function seedTwoPages() {
      useLibrary.getState().addPool("Friday night");
      useLibrary.getState().addPool("Sunday");
    }

    it("animates a turn made with the corner link, forwards", async () => {
      seedTwoPages();
      const user = userEvent.setup();
      renderPool("Friday night");

      await user.click(screen.getByRole("link", { name: "Next page: Sunday" }));

      expect(startViewTransition).toHaveBeenCalledOnce();
      expect(document.documentElement.dataset["turn"]).toBe("next");
    });

    it("animates a turn made with the keyboard, backwards", () => {
      seedTwoPages();
      renderPool("Sunday");

      fireEvent.keyDown(document.body, { key: "ArrowLeft" });

      expect(startViewTransition).toHaveBeenCalledOnce();
      expect(document.documentElement.dataset["turn"]).toBe("previous");
    });

    function poolPath(name: string) {
      return `/pools/${useLibrary.getState().pools.find((p) => p.name === name)?.id ?? ""}`;
    }

    it("turns backwards when the browser goes back to the previous page", async () => {
      seedTwoPages();
      const router = createMemoryRouter(routes, { initialEntries: [poolPath("Friday night")] });
      render(<RouterProvider router={router} />);

      await act(() => router.navigate(poolPath("Sunday"), { viewTransition: true }));
      await act(() => router.navigate(-1));

      expect(screen.getByRole("heading", { level: 1, name: "Friday night" })).toBeDefined();
      expect(document.documentElement.dataset["turn"]).toBe("previous");
    });

    it("turns no page when coming back from another screen", async () => {
      seedTwoPages();
      const router = createMemoryRouter(routes, { initialEntries: [poolPath("Friday night")] });
      render(<RouterProvider router={router} />);

      await act(() => router.navigate(poolPath("Sunday"), { viewTransition: true }));
      await act(() => router.navigate(`${poolPath("Sunday")}/decks`));
      await act(() => router.navigate(-1));

      expect(screen.getByRole("heading", { level: 1, name: "Sunday" })).toBeDefined();
      expect(document.documentElement.dataset["turn"]).toBeUndefined();
    });

    it("does not animate leaving the page for the table of contents", async () => {
      seedTwoPages();
      const user = userEvent.setup();
      renderPool("Sunday");

      await user.click(screen.getByRole("link", { name: "All pools" }));

      expect(startViewTransition).not.toHaveBeenCalled();
    });
  });

  describe("about this pool", () => {
    function nameField() {
      return screen.getByRole("textbox", { name: "Name" });
    }

    it("offers to rename only once the name has changed", async () => {
      seedPool("Thursday table", ["Atraxa"]);
      const user = userEvent.setup();
      renderPool("Thursday table");

      expect(screen.queryByRole("button", { name: "Rename" })).toBeNull();
      await user.type(nameField(), "!");
      expect(screen.getByRole("button", { name: "Rename" })).toBeDefined();
    });

    it("renames the pool, its page and its tab, and says so", async () => {
      seedPool("Thursday table", ["Atraxa"]);
      const user = userEvent.setup();
      renderPool("Thursday table");

      await user.clear(nameField());
      await user.type(nameField(), " Friday night {Enter}");

      expect(useLibrary.getState().pools[0]?.name).toBe("Friday night");
      expect(screen.getByRole("heading", { level: 1, name: "Friday night" })).toBeDefined();
      expect(document.title).toBe("Friday night · Deck Roulette");
      expect(nameField()).toHaveProperty("value", "Friday night");
      expect(await screen.findByText("Renamed to Friday night.")).toBeDefined();
    });

    it("refuses the name of another pool, next to the field, with focus there", async () => {
      seedPool("Thursday table", ["Atraxa"]);
      useLibrary.getState().addPool("Sunday");
      const user = userEvent.setup();
      renderPool("Thursday table");

      await user.clear(nameField());
      await user.type(nameField(), "sunday");
      await user.click(screen.getByRole("button", { name: "Rename" }));

      expect(screen.getByRole("alert").textContent).toBe("A pool with this name already exists.");
      expect(document.activeElement).toBe(nameField());
      expect(useLibrary.getState().pools[0]?.name).toBe("Thursday table");
    });

    it("renames nothing on Enter without a change", async () => {
      seedPool("Thursday table", ["Atraxa"]);
      const user = userEvent.setup();
      renderPool("Thursday table");
      const before = useLibrary.getState().pools;

      // A form with a single text field submits on Enter even without a submit button.
      await user.type(nameField(), "{Enter}");

      expect(useLibrary.getState().pools).toBe(before);
    });

    it("explains an empty name after a try, and drops it once fixed", async () => {
      seedPool("Thursday table", ["Atraxa"]);
      const user = userEvent.setup();
      renderPool("Thursday table");

      await user.clear(nameField());
      await user.click(screen.getByRole("button", { name: "Rename" }));
      expect(screen.getByRole("alert").textContent).toBe("Give the pool a name.");

      await user.type(nameField(), "F");
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("lets the pool change only the case of its own name", async () => {
      seedPool("Thursday table", ["Atraxa"]);
      const user = userEvent.setup();
      renderPool("Thursday table");

      await user.clear(nameField());
      await user.type(nameField(), "THURSDAY TABLE{Enter}");

      expect(screen.queryByRole("alert")).toBeNull();
      expect(useLibrary.getState().pools[0]?.name).toBe("THURSDAY TABLE");
    });

    it("puts the name back, and focus in the field, when discarded", async () => {
      seedPool("Thursday table", ["Atraxa"]);
      const user = userEvent.setup();
      renderPool("Thursday table");

      await user.type(nameField(), "!");
      await user.click(screen.getByRole("button", { name: "Discard" }));

      expect(nameField()).toHaveProperty("value", "Thursday table");
      expect(document.activeElement).toBe(nameField());
    });

    it("asks before deleting, saying the decks survive", async () => {
      seedPool("Thursday table", ["Atraxa"]);
      const user = userEvent.setup();
      renderPool("Thursday table");

      const trigger = screen.getByRole("button", { name: "Delete pool" });
      await user.click(trigger);
      expect(screen.getByRole("dialog", { name: "Delete Thursday table?" }).textContent).toContain(
        "Its decks stay in your library.",
      );
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(useLibrary.getState().pools).toHaveLength(1);
      expect(document.activeElement).toBe(trigger);
    });

    it("deletes it, keeps its decks, and lands on the pools, focused and told", async () => {
      seedPool("Thursday table", ["Atraxa"]);
      const user = userEvent.setup();
      renderPool("Thursday table");

      await user.click(screen.getByRole("button", { name: "Delete pool" }));
      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(useLibrary.getState().pools).toHaveLength(0);
      expect(useLibrary.getState().decks).toHaveLength(1);
      const heading = screen.getByRole("heading", { level: 1, name: "Pools" });
      await waitFor(() => expect(document.activeElement).toBe(heading));
      expect(await screen.findByText("Thursday table deleted.")).toBeDefined();
    });

    it("never shows the pool as missing on the way out", async () => {
      seedPool("Thursday table", ["Atraxa"]);
      const user = userEvent.setup();
      renderPool("Thursday table");
      await user.click(screen.getByRole("button", { name: "Delete pool" }));
      const setTitle = vi.spyOn(document, "title", "set");

      // Outside act(): it would batch the navigation with the deletion and hide the race.
      const actEnvironment = Reflect.get(globalThis, "IS_REACT_ACT_ENVIRONMENT");
      Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", false);
      try {
        screen.getByRole("button", { name: "Delete" }).click();
        await screen.findByRole("heading", { level: 1, name: "Pools" });
      } finally {
        Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", actEnvironment);
      }

      const titles = setTitle.mock.calls.map(([title]) => title);
      setTitle.mockRestore();
      expect(titles).not.toContain("Pool not found · Deck Roulette");
    });

    it("leaves no way back to the deleted pool's page", async () => {
      seedPool("Thursday table", ["Atraxa"]);
      const user = userEvent.setup();
      const router = renderPool("Thursday table");

      await user.click(screen.getByRole("button", { name: "Delete pool" }));
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await act(() => router.navigate(-1));

      expect(screen.queryByRole("heading", { name: "This pool does not exist" })).toBeNull();
    });
  });
});

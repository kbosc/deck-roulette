import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { useLibrary } from "../store/library";
import { routes } from "./routes";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    useLibrary.setState({ decks: [], pools: [] });
  });

  it("opens on the library", () => {
    renderAt("/");

    expect(screen.getByRole("heading", { level: 1, name: "Library" })).toBeDefined();
  });

  it("navigates to the pools", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByRole("link", { name: "Pools" }));

    expect(screen.getByRole("heading", { level: 1, name: "Pools" })).toBeDefined();
  });

  it("leaves focus to the browser on the first load, StrictMode included", () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );

    expect(document.activeElement).toBe(document.body);
  });

  it("puts focus on the new page's heading after navigating", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByRole("link", { name: "Pools" }));

    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1, name: "Pools" }));
  });

  it("falls back to the main region on a page without a level 1 heading", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    render(<RouterProvider router={router} />);

    await act(() => router.navigate("/nope"));

    expect(document.activeElement).toBe(screen.getByRole("main"));
  });

  it("names the browser tab after the page", async () => {
    const user = userEvent.setup();
    renderAt("/");
    expect(document.title).toBe("Library · Deck Roulette");

    await user.click(screen.getByRole("link", { name: "Pools" }));

    expect(document.title).toBe("Pools · Deck Roulette");
  });

  it("puts focus on a pool's heading after following its link", async () => {
    useLibrary.getState().addPool("Thursday table");
    const user = userEvent.setup();
    renderAt("/pools");

    await user.click(screen.getByRole("link", { name: "Choose decks" }));

    expect(document.activeElement).toBe(
      screen.getByRole("heading", { level: 1, name: "Choose decks for Thursday table" }),
    );
    expect(document.title).toBe("Choose decks for Thursday table · Deck Roulette");
  });

  it("opens a pool's page from the table of contents, focus on its heading", async () => {
    useLibrary.getState().addDeck("Atraxa");
    useLibrary.getState().addPool("Thursday table");
    const { decks, pools } = useLibrary.getState();
    const [deck] = decks;
    const [pool] = pools;
    if (deck === undefined || pool === undefined) throw new Error("seeding failed");
    useLibrary.getState().addDeckToPool(pool.id, deck.id);
    const user = userEvent.setup();
    renderAt("/pools");

    await user.click(screen.getByRole("link", { name: "Thursday table" }));

    expect(document.activeElement).toBe(
      screen.getByRole("heading", { level: 1, name: "Thursday table" }),
    );
    expect(document.title).toBe("Thursday table · Deck Roulette");
  });

  it("names the tab of a pool that does not exist", () => {
    renderAt("/pools/nope");

    expect(document.title).toBe("Pool not found · Deck Roulette");
  });

  it("names the tab of an unknown address", () => {
    renderAt("/nope");

    expect(document.title).toBe("Page not found · Deck Roulette");
  });

  it("marks the current page for assistive technology", () => {
    renderAt("/pools");

    expect(screen.getByRole("link", { name: "Pools" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Library" }).getAttribute("aria-current")).toBeNull();
  });

  it("gives a wrong address a real page", () => {
    renderAt("/nope");

    expect(screen.getByRole("heading", { name: "This page does not exist" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Back to the library" })).toBeDefined();
  });

  it("offers a skip link as the very first thing the keyboard reaches", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.tab();

    expect(document.activeElement?.textContent).toBe("Skip to content");
  });

  it("names its landmarks", () => {
    renderAt("/");

    expect(screen.getByRole("navigation", { name: "Main" })).toBeDefined();
    expect(screen.getByRole("main")).toBeDefined();
  });

  it("keeps the theme picked, across a reload", async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt("/");

    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement.dataset["theme"]).toBe("dark");

    unmount();
    renderAt("/");

    expect(screen.getByRole("radio", { name: "Dark" })).toHaveProperty("checked", true);
  });
});

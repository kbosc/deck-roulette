import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { Layout } from "./Layout";
import { LibraryRoute } from "../routes/LibraryRoute";
import { PoolsRoute } from "../routes/PoolsRoute";
import { NotFoundRoute } from "../routes/NotFoundRoute";

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <LibraryRoute /> },
          { path: "pools", element: <PoolsRoute /> },
          { path: "*", element: <NotFoundRoute /> },
        ],
      },
    ],
    { initialEntries: [path] },
  );

  return render(<RouterProvider router={router} />);
}

describe("App", () => {
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
});

import type { RouteObject } from "react-router";
import { Layout } from "./Layout";
import { DeckRoute } from "../routes/DeckRoute";
import { LibraryRoute } from "../routes/LibraryRoute";
import { NotFoundRoute } from "../routes/NotFoundRoute";
import { PoolDecksRoute } from "../routes/PoolDecksRoute";
import { PoolRoute } from "../routes/PoolRoute";
import { PoolsRoute } from "../routes/PoolsRoute";

/** Shared by the app and its tests, so the two can never route differently. */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <LibraryRoute /> },
      { path: "decks/:deckId", element: <DeckRoute /> },
      { path: "pools", element: <PoolsRoute /> },
      { path: "pools/:poolId", element: <PoolRoute /> },
      { path: "pools/:poolId/decks", element: <PoolDecksRoute /> },
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
];

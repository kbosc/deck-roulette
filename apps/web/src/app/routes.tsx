import type { RouteObject } from "react-router";
import { Layout } from "./Layout";
import { LibraryRoute } from "../routes/LibraryRoute";
import { NotFoundRoute } from "../routes/NotFoundRoute";
import { PoolDetailRoute } from "../routes/PoolDetailRoute";
import { PoolsRoute } from "../routes/PoolsRoute";

/** Shared by the app and its tests, so the two can never route differently. */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <LibraryRoute /> },
      { path: "pools", element: <PoolsRoute /> },
      { path: "pools/:poolId", element: <PoolDetailRoute /> },
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
];

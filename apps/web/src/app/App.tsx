import { createBrowserRouter, RouterProvider } from "react-router";
import { Layout } from "./Layout";
import { LibraryRoute } from "../routes/LibraryRoute";
import { PoolsRoute } from "../routes/PoolsRoute";
import { NotFoundRoute } from "../routes/NotFoundRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <LibraryRoute /> },
      { path: "pools", element: <PoolsRoute /> },
      // A wrong URL gets a real page rather than a blank screen.
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

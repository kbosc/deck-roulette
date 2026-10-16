import { createBrowserRouter } from "react-router";
// The DOM build: without it, a navigation's flushSync option is silently ignored.
import { RouterProvider } from "react-router/dom";
import { routes } from "./routes";

const router = createBrowserRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}

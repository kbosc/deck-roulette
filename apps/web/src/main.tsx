import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";

const container = document.getElementById("root");

if (container === null) {
  throw new Error("#root is missing from index.html");
}

createRoot(container).render(
  // StrictMode double-invokes renders and effects in development, which is how
  // an effect that is not safe to run twice gets caught before production.
  <StrictMode>
    <App />
  </StrictMode>,
);

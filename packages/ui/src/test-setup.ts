import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/** Testing Library only does this by itself in Vitest `globals` mode. */
afterEach(cleanup);

/** jsdom has no layout, so nothing to observe: components only need the API to exist. */
class NoLayoutResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= NoLayoutResizeObserver;

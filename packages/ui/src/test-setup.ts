import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/** Testing Library only does this by itself in Vitest `globals` mode. */
afterEach(cleanup);

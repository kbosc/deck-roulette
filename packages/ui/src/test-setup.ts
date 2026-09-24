import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Unmounts whatever a test rendered.
 *
 * Testing Library installs this by itself only when Vitest runs in `globals`
 * mode. Without it the DOM piles up across tests, and a query that should find
 * one button finds every button the file has ever rendered.
 */
afterEach(cleanup);

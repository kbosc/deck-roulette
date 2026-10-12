import html from "../../index.html?raw";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyThemePreference,
  readThemePreference,
  THEME_STORAGE_KEY,
  writeThemePreference,
} from "./theme";

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  vi.restoreAllMocks();
});

describe("readThemePreference", () => {
  it("follows the system when nothing was chosen", () => {
    expect(readThemePreference()).toBe("system");
  });

  it("returns the stored choice", () => {
    writeThemePreference("dark");

    expect(readThemePreference()).toBe("dark");
  });

  it("follows the system when the stored value is not a theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "sepia");

    expect(readThemePreference()).toBe("system");
  });

  it("follows the system when storage is unavailable", () => {
    // Safari in private mode, or storage blocked by the browser.
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(readThemePreference()).toBe("system");
  });
});

describe("writeThemePreference", () => {
  it("does not throw when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => writeThemePreference("light")).not.toThrow();
  });
});

describe("applyThemePreference", () => {
  it("forces the chosen theme on the page", () => {
    applyThemePreference("light");

    expect(document.documentElement.dataset["theme"]).toBe("light");
  });

  it("hands back to the system preference", () => {
    applyThemePreference("dark");
    applyThemePreference("system");

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});

describe("the script in index.html", () => {
  // It runs before React to avoid a flash of the wrong theme, so it duplicates the logic above.
  /** Runs it the way the browser does; resolves to the errors it raised, if any. */
  function runInlineScript(): readonly unknown[] {
    const code = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];
    if (code === undefined) throw new Error("index.html has no inline script");

    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);
    const script = document.createElement("script");
    script.textContent = code;
    document.head.append(script);
    script.remove();
    window.removeEventListener("error", onError);
    return errors;
  }

  it("applies a stored theme before the app loads", () => {
    writeThemePreference("dark");

    runInlineScript();

    expect(document.documentElement.dataset["theme"]).toBe("dark");
  });

  it.each(["system", "sepia"])("leaves %s to the system preference", (stored) => {
    localStorage.setItem(THEME_STORAGE_KEY, stored);

    runInlineScript();

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("does not break the page when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(runInlineScript()).toEqual([]);
  });
});

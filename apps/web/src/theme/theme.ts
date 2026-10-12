import { useEffect, useState } from "react";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** Also hard-coded in the script of index.html. */
export const THEME_STORAGE_KEY = "deck-roulette:theme";

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.some((preference) => preference === value);
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function writeThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // The choice still applies to this visit; it just won't be remembered.
  }
}

/** No attribute means the tokens' `prefers-color-scheme` query decides. */
export function applyThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;
  root.dataset["themeSwitching"] = "";

  if (preference === "system") {
    delete root.dataset["theme"];
  } else {
    root.dataset["theme"] = preference;
  }

  // Reading a style forces the new colors to apply now, while transitions are still off.
  void getComputedStyle(root).color;
  delete root.dataset["themeSwitching"];
}

export function useThemePreference() {
  const [preference, setPreference] = useState(readThemePreference);

  useEffect(() => {
    applyThemePreference(preference);
    writeThemePreference(preference);
  }, [preference]);

  return [preference, setPreference] as const;
}

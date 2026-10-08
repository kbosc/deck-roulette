import { useEffect } from "react";

/** Names the browser tab, which is also what a screen reader reads on arrival. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Deck Roulette`;
  }, [title]);
}

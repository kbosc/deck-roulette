import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const AnnounceContext = createContext<((message: string) => void) | null>(null);

// Long enough for screen readers to register the emptied region before the new text.
const REFILL_DELAY_MS = 100;

/**
 * One live region for the whole app, mounted once with the layout.
 * A page's own region dies with the page: a message that outlives a navigation goes here.
 */
export function Announcer({ children }: { readonly children: ReactNode }) {
  const [message, setMessage] = useState("");
  const pending = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(pending.current), []);

  // Stable: every consumer of the context would re-render with a new function.
  const announce = useCallback((next: string) => {
    // Emptied first: a region whose text does not change is not read again.
    setMessage("");
    window.clearTimeout(pending.current);
    pending.current = window.setTimeout(() => setMessage(next), REFILL_DELAY_MS);
  }, []);

  return (
    <AnnounceContext value={announce}>
      {children}
      {/* Present and empty from the start: a region that appears with its text is often not read. */}
      <p role="status" className="sr-only">
        {message}
      </p>
    </AnnounceContext>
  );
}

export function useAnnounce(): (message: string) => void {
  const announce = useContext(AnnounceContext);
  if (announce === null) throw new Error("useAnnounce needs an <Announcer> above it.");
  return announce;
}

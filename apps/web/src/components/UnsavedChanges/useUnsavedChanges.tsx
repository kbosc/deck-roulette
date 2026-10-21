import { ConfirmDialog } from "@deck-roulette/ui";
import type { ReactNode } from "react";
import { useCallback, useRef } from "react";
import { useBeforeUnload, useBlocker } from "react-router";

export type UnsavedChanges = {
  /** For a navigation that drops the changes on purpose, like deleting the item. */
  readonly leaveOnPurpose: () => void;
  /** Render it once on the page: it asks before leaving with unsaved changes. */
  readonly dialog: ReactNode;
};

/** Asks before unsaved changes are lost: inside the app, and when the tab closes or reloads. */
export function useUnsavedChanges(dirty: boolean, whatIsLost: string): UnsavedChanges {
  const leaving = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      // A jump within the page, like the skip link, leaves nothing behind.
      dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname,
  );
  // Closing the tab or reloading never reaches the router: only the browser can ask.
  useBeforeUnload(
    useCallback(
      (event) => {
        if (dirty) event.preventDefault();
      },
      [dirty],
    ),
  );

  const dialog = (
    <ConfirmDialog
      open={blocker.state === "blocked"}
      onOpenChange={(open) => {
        if (!open && !leaving.current) blocker.reset?.();
      }}
      title="Leave without saving?"
      description={whatIsLost}
      confirmLabel="Leave"
      cancelLabel="Stay"
      onConfirm={() => {
        leaving.current = true;
        blocker.proceed?.();
      }}
      // The next page focuses its heading; Radix would pull focus back to the link clicked.
      onConfirmedFocus={() => undefined}
    />
  );

  return {
    leaveOnPurpose: () => {
      leaving.current = true;
    },
    dialog,
  };
}

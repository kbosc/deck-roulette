import type { Pool, PoolDrawState } from "@deck-roulette/domain";
import { getPoolDrawState, getRemainingDeckIds } from "@deck-roulette/domain";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";

export type PoolCardProps = {
  readonly pool: Pool;
  readonly onDraw: () => void;
  readonly onReset: () => void;
  readonly actions?: ReactNode;
};

/** Each state renders the control that applies, never a disabled draw button. */
export function PoolCard({ pool, onDraw, onReset, actions }: PoolCardProps) {
  const state = getPoolDrawState(pool);
  const total = pool.deckIds.length;
  const remaining = getRemainingDeckIds(pool).length;
  const drawn = total - remaining;

  // Each state renders its own button, so the one just pressed disappears:
  // hand focus to its replacement, or it falls to the body.
  const controlRef = useRef<HTMLButtonElement>(null);
  const pressedIn = useRef<PoolDrawState | null>(null);

  useEffect(() => {
    const from = pressedIn.current;
    pressedIn.current = null;
    if (from !== null && from !== state) controlRef.current?.focus();
  });

  return (
    <article className="flex flex-col gap-4 p-4 rounded-lg border border-border bg-surface-raised">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-semibold text-text truncate">{pool.name}</h3>

          {/* Spelled out rather than "3/8": read aloud, a slash is noise. */}
          <p className="text-sm text-text-muted">
            {total === 0 ? "No deck in this pool" : `${drawn} of ${total} drawn, ${remaining} left`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {state === "exhausted" ? <Badge tone="warning">Cycle over</Badge> : null}
          {actions}
        </div>
      </div>

      {state === "ready" ? (
        <Button
          ref={controlRef}
          onClick={() => {
            pressedIn.current = state;
            onDraw();
          }}
        >
          Draw a deck
        </Button>
      ) : null}

      {state === "exhausted" ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text">
            Every deck in this pool has come out. Start a new cycle to make them drawable again.
          </p>
          <Button
            ref={controlRef}
            variant="secondary"
            onClick={() => {
              pressedIn.current = state;
              onReset();
            }}
          >
            Start a new cycle
          </Button>
        </div>
      ) : null}

      {state === "empty" ? (
        <p className="text-sm text-text-muted">
          Add decks from your library to draw from this pool.
        </p>
      ) : null}
    </article>
  );
}

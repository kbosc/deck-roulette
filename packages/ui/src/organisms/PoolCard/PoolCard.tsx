import type { Pool } from "@deck-roulette/domain";
import { getPoolDrawState, getRemainingDeckIds } from "@deck-roulette/domain";
import type { ReactNode } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";

export type PoolCardProps = {
  readonly pool: Pool;
  readonly onDraw: () => void;
  readonly onReset: () => void;
  /** Controls belonging to the pool itself — renaming it, deleting it. */
  readonly actions?: ReactNode;
};

/**
 * One pool, with whatever it currently allows.
 *
 * The state is read from the domain before anything is rendered, so the screen
 * never offers a draw that cannot happen. Rather than showing a disabled draw
 * button, each state renders the control that actually applies: a dead button
 * is a promise the interface does not keep, and a disabled one is skipped
 * outright by some screen-reader navigation, leaving no way to learn why.
 */
export function PoolCard({ pool, onDraw, onReset, actions }: PoolCardProps) {
  const state = getPoolDrawState(pool);
  const total = pool.deckIds.length;
  const remaining = getRemainingDeckIds(pool).length;
  const drawn = total - remaining;

  return (
    <article className="flex flex-col gap-4 p-4 rounded-lg border border-border bg-surface-raised">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-semibold text-text truncate">{pool.name}</h3>

          {/* Spelled out rather than "3/8": read aloud, a slash is noise. */}
          <p className="text-sm text-text-muted">
            {total === 0
              ? "No deck in this pool"
              : `${drawn} of ${total} drawn, ${remaining} left`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {state === "exhausted" ? <Badge tone="warning">Cycle over</Badge> : null}
          {actions}
        </div>
      </div>

      {state === "ready" ? (
        <Button onClick={onDraw}>Draw a deck</Button>
      ) : null}

      {state === "exhausted" ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text">
            Every deck in this pool has come out. Start a new cycle to make them drawable again.
          </p>
          <Button variant="secondary" onClick={onReset}>
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

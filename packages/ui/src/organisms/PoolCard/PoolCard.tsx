import type { Deck, Pool, PoolDrawState } from "@deck-roulette/domain";
import { getPoolDrawState, getRemainingDeckIds } from "@deck-roulette/domain";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";

export type PoolCardProps = {
  readonly pool: Pool;
  /** The library's decks: the card picks out the pool's own, in the pool's order. */
  readonly decks: readonly Deck[];
  readonly onDraw: () => void;
  readonly onReset: () => void;
  readonly actions?: ReactNode;
  /** Lets the app make the name a link without the design system knowing its router. */
  readonly renderTitle?: (name: string) => ReactNode;
  /** Shown only while the pool is empty, when there is nothing else to do with it. */
  readonly emptyAction?: ReactNode;
};

/** Each state renders the control that applies, never a disabled draw button. */
export function PoolCard({
  pool,
  decks,
  onDraw,
  onReset,
  actions,
  renderTitle,
  emptyAction,
}: PoolCardProps) {
  const state = getPoolDrawState(pool);
  const total = pool.deckIds.length;
  const remaining = getRemainingDeckIds(pool).length;
  const drawn = total - remaining;
  const poolDecks = pool.deckIds.flatMap((id) => decks.find((deck) => deck.id === id) ?? []);
  const drawnIds = new Set(pool.drawnDeckIds);
  const lastDrawnId = pool.drawnDeckIds.at(-1);

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
    // The seal sits under the page, outside it, but stays in the article: read with its pool.
    <article className="flex flex-col gap-5">
      <div
        data-surface="page"
        className="flex flex-col gap-4 p-4 rounded-sm border border-border bg-surface-raised text-text shadow-elevation-rest"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="font-semibold text-text truncate">
              {renderTitle === undefined ? pool.name : renderTitle(pool.name)}
            </h3>

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

        {poolDecks.length === 0 ? null : (
          <ol aria-label={`Decks in ${pool.name}`} className="flex flex-col font-book">
            {poolDecks.map((deck) => (
              <li
                key={deck.id}
                className="flex gap-2 border-b border-dotted border-border-strong py-2 last:border-b-0"
              >
                {deck.id === lastDrawnId ? (
                  <>
                    <span aria-hidden="true" className="text-text-action">
                      ❦
                    </span>
                    <span className="min-w-0 break-words font-bold">{deck.name}</span>
                    <span className="sr-only">, drawn last</span>
                  </>
                ) : drawnIds.has(deck.id) ? (
                  <>
                    {/* Red ink, as if crossed out by hand. Line-through is never read aloud. */}
                    <span className="min-w-0 break-words text-text-muted line-through decoration-action decoration-2">
                      {deck.name}
                    </span>
                    <span className="sr-only">, drawn</span>
                  </>
                ) : (
                  <span className="min-w-0 break-words">{deck.name}</span>
                )}
              </li>
            ))}
          </ol>
        )}

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
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-text-muted">
              Add decks from your library to draw from this pool.
            </p>
            {emptyAction}
          </div>
        ) : null}
      </div>

      {state === "ready" ? (
        <div className="flex justify-center">
          <Button
            ref={controlRef}
            onClick={() => {
              pressedIn.current = state;
              onDraw();
            }}
          >
            Draw a deck
          </Button>
        </div>
      ) : null}
    </article>
  );
}

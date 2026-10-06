import type { NameProblem, Pool } from "@deck-roulette/domain";
import { Button, ConfirmDialog, EmptyState, PoolCard } from "@deck-roulette/ui";
import { useId, useRef, useState } from "react";
import { NameForm } from "../../components/NameForm";
import { useLibrary } from "../../store/library";

const nameMessages: Record<NameProblem, string> = {
  empty: "Give the pool a name.",
  duplicate: "A pool with this name already exists.",
};

export function PoolsRoute() {
  const decks = useLibrary((state) => state.decks);
  const pools = useLibrary((state) => state.pools);
  const addPool = useLibrary((state) => state.addPool);
  const removePool = useLibrary((state) => state.removePool);
  const drawFromPool = useLibrary((state) => state.drawFromPool);
  const resetPool = useLibrary((state) => state.resetPool);
  // Not a selector: one returning a new array would re-render on every store change.
  const poolNames = pools.map((pool) => pool.name);

  // Same pattern as the library: one dialog, kept mounted, driven by `isAsking`.
  const [poolToDelete, setPoolToDelete] = useState<Pool | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const listHeadingId = useId();

  function draw(pool: Pool) {
    const result = drawFromPool(pool.id);
    if (result.status !== "drawn") return;

    const deck = decks.find((d) => d.id === result.deckId);
    setAnnouncement(`${deck?.name ?? "A deck"}, from ${pool.name}.`);
  }

  function confirmDeletion() {
    if (poolToDelete === null) return;

    removePool(poolToDelete.id);
    setAnnouncement(`${poolToDelete.name} deleted.`);
  }

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold outline-none">
        Pools
      </h1>
      <p className="mt-2 text-text-muted">The sets of decks you draw from.</p>

      <div className="mt-6">
        <NameForm
          label="Pool name"
          placeholder="Thursday table"
          existingNames={poolNames}
          messages={nameMessages}
          onCreate={(name) => {
            addPool(name);
            setAnnouncement("");
          }}
        />
      </div>

      {/* Visible: a draw result is for everyone. Never hidden while empty: a live
          region that appears with its text is often not announced. */}
      <p role="status" className="mt-6 text-lg font-semibold">
        {announcement}
      </p>

      <div className="mt-6">
        {pools.length === 0 ? (
          <EmptyState
            headingLevel={2}
            title="No pool yet"
            description="Create a pool, then pick the decks it draws from."
          />
        ) : (
          <>
            <h2 id={listHeadingId} className="text-lg font-semibold">
              Your pools
            </h2>
            <ul aria-labelledby={listHeadingId} className="mt-3 flex flex-col gap-3">
              {pools.map((pool) => (
                <li key={pool.id}>
                  <PoolCard
                    pool={pool}
                    onDraw={() => draw(pool)}
                    onReset={() => {
                      resetPool(pool.id);
                      setAnnouncement("");
                    }}
                    actions={
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setPoolToDelete(pool);
                          setIsAsking(true);
                        }}
                      >
                        {/* The space stays outside the span, or the name becomes "DeleteThursday table". */}
                        Delete <span className="sr-only">{pool.name}</span>
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {poolToDelete === null ? null : (
        <ConfirmDialog
          open={isAsking}
          onOpenChange={setIsAsking}
          title={`Delete ${poolToDelete.name}?`}
          description="The pool and its draw history will be lost. Its decks stay in your library."
          confirmLabel="Delete"
          onConfirm={confirmDeletion}
          // The opener disappears with its row: focus would fall to the body.
          onConfirmedFocus={() => headingRef.current?.focus()}
        />
      )}
    </>
  );
}

import type { Pool } from "@deck-roulette/domain";
import { Button, EmptyState, PoolCard } from "@deck-roulette/ui";
import { useId, useState } from "react";
import { Link } from "react-router";
import { poolNameMessages } from "../../app/names";
import { NameForm } from "../../components/NameForm";
import { PageHeading } from "../../components/PageHeading";
import { useLibrary } from "../../store/library";

export function PoolsRoute() {
  const decks = useLibrary((state) => state.decks);
  const pools = useLibrary((state) => state.pools);
  const addPool = useLibrary((state) => state.addPool);
  const drawFromPool = useLibrary((state) => state.drawFromPool);
  const resetPool = useLibrary((state) => state.resetPool);
  // Not a selector: one returning a new array would re-render on every store change.
  const poolNames = pools.map((pool) => pool.name);

  const [announcement, setAnnouncement] = useState("");

  const listHeadingId = useId();

  function draw(pool: Pool) {
    const result = drawFromPool(pool.id);
    if (result.status !== "drawn") return;

    const deck = decks.find((d) => d.id === result.deckId);
    setAnnouncement(`${deck?.name ?? "A deck"}, from ${pool.name}.`);
  }

  return (
    <>
      <PageHeading>Pools</PageHeading>
      <p className="mt-2 text-text-muted">The sets of decks you draw from.</p>

      <div className="mt-6">
        <NameForm
          label="Pool name"
          placeholder="Thursday table"
          existingNames={poolNames}
          messages={poolNameMessages}
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
            <ul aria-labelledby={listHeadingId} className="mt-3 flex flex-col gap-8">
              {pools.map((pool) => (
                <li key={pool.id}>
                  <PoolCard
                    pool={pool}
                    // Always a link: renaming and deleting live on the pool's page.
                    renderTitle={(name) => (
                      <Link
                        to={`/pools/${pool.id}`}
                        className="rounded-sm underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
                      >
                        {name}
                      </Link>
                    )}
                    emptyAction={
                      <Button asChild size="sm" variant="secondary">
                        <Link to={`/pools/${pool.id}/decks`}>Choose decks</Link>
                      </Button>
                    }
                    onDraw={() => draw(pool)}
                    onReset={() => {
                      resetPool(pool.id);
                      setAnnouncement("");
                    }}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

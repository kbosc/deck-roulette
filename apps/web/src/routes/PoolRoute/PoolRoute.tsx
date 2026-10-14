import { Button, PoolCard, PoolDeckList } from "@deck-roulette/ui";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { PageHeading, usePageTitle } from "../../components/PageHeading";
import { PoolNotFound } from "../../components/PoolNotFound";
import { useLibrary } from "../../store/library";

/** One pool, one page of the grimoire: every deck it holds, and the seal to draw. */
export function PoolRoute() {
  const { poolId } = useParams();
  const decks = useLibrary((state) => state.decks);
  const pool = useLibrary((state) => state.pools.find((p) => p.id === poolId));
  const drawFromPool = useLibrary((state) => state.drawFromPool);
  const resetPool = useLibrary((state) => state.resetPool);
  const [announcement, setAnnouncement] = useState("");
  // Called before the early return: hooks cannot be conditional.
  usePageTitle(pool === undefined ? "Pool not found" : pool.name);

  if (pool === undefined) return <PoolNotFound />;

  // An arrow, not a function declaration: hoisting would lose the narrowing above.
  const draw = () => {
    const result = drawFromPool(pool.id);
    if (result.status !== "drawn") return;

    const deck = decks.find((d) => d.id === result.deckId);
    setAnnouncement(`${deck?.name ?? "A deck"}, from ${pool.name}.`);
  };

  const chooseDecks = (
    <Button asChild size="sm" variant="secondary">
      <Link to={`/pools/${pool.id}/decks`}>Choose decks</Link>
    </Button>
  );

  return (
    <>
      <Link
        to="/pools"
        className="inline-flex min-h-11 items-center rounded-sm text-sm text-text-action underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        All pools
      </Link>
      <PageHeading>{pool.name}</PageHeading>

      {/* Same live region as the pools list: present and empty before the first draw. */}
      <p role="status" className="mt-6 text-lg font-semibold">
        {announcement}
      </p>

      <div className="mt-6">
        <PoolCard
          pool={pool}
          headingLevel={2}
          // The h1 already names the pool.
          renderTitle={() => "This cycle"}
          // Empty pool: the empty state's link is the single way in.
          {...(pool.deckIds.length === 0 ? {} : { actions: chooseDecks })}
          emptyAction={chooseDecks}
          onDraw={draw}
          onReset={() => {
            resetPool(pool.id);
            setAnnouncement("");
          }}
        >
          <PoolDeckList pool={pool} decks={decks} />
        </PoolCard>
      </div>
    </>
  );
}

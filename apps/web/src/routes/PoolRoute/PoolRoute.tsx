import type { Pool } from "@deck-roulette/domain";
import { Button, PageTurn, PoolCard, PoolDeckList } from "@deck-roulette/ui";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { PageHeading, usePageTitle } from "../../components/PageHeading";
import { PoolNotFound } from "../../components/PoolNotFound";
import { PoolSettings } from "./PoolSettings";
import { useLibrary } from "../../store/library";

export function PoolRoute() {
  const { poolId } = useParams();
  const pool = useLibrary((state) => state.pools.find((p) => p.id === poolId));
  const pageIndex = useLibrary((state) => state.pools.findIndex((p) => p.id === poolId));
  // Called before the early return: hooks cannot be conditional.
  usePageTitle(pool === undefined ? "Pool not found" : pool.name);
  useTurnDirection(pageIndex);

  if (pool === undefined) return <PoolNotFound />;

  // Keyed: turning the page must not carry the last draw's announcement over.
  return <PoolPage key={pool.id} pool={pool} />;
}

type Direction = "previous" | "next";

/**
 * Tells the page-turn animation which way to slide, read from :root[data-turn].
 * Derived from the pages left and reached, not from what was clicked: the browser's
 * Back and Forward replay the transition too, and must turn the right way.
 */
function useTurnDirection(pageIndex: number) {
  const previousIndex = useRef<number | null>(null);

  // Layout effect: set before the browser builds the transition from the updated page.
  useLayoutEffect(() => {
    const from = previousIndex.current;
    previousIndex.current = pageIndex;
    const root = document.documentElement;

    // null: just arrived from another screen, which turns no page.
    if (from === null || from === -1 || pageIndex === -1 || from === pageIndex) {
      delete root.dataset["turn"];
    } else {
      root.dataset["turn"] = pageIndex > from ? "next" : "previous";
    }
  }, [pageIndex]);
}

/** True when the key is meant for what has focus, not for turning the page. */
function belongsToFocus(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return true;
  }
  const target = event.target;
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      // A dialog over the page owns the keyboard: turning would unmount it under the user.
      target.closest("input, textarea, select, [role='dialog'], [role='alertdialog']") !== null)
  );
}

/** One pool, one page of the grimoire: every deck it holds, and the seal to draw. */
function PoolPage({ pool }: { readonly pool: Pool }) {
  const decks = useLibrary((state) => state.decks);
  const pools = useLibrary((state) => state.pools);
  const drawFromPool = useLibrary((state) => state.drawFromPool);
  const resetPool = useLibrary((state) => state.resetPool);
  const [announcement, setAnnouncement] = useState("");
  const navigate = useNavigate();

  const index = pools.findIndex((p) => p.id === pool.id);
  const previous = pools[index - 1];
  const next = pools[index + 1];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // A held key would leaf through the whole book in a blink.
      if (event.repeat || belongsToFocus(event)) return;

      const direction: Direction | undefined =
        event.key === "ArrowLeft" ? "previous" : event.key === "ArrowRight" ? "next" : undefined;
      const target = direction === "previous" ? previous : direction === "next" ? next : undefined;
      if (direction === undefined || target === undefined) return;

      event.preventDefault();
      void navigate(`/pools/${target.id}`, { viewTransition: true });
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navigate, previous, next]);

  function draw() {
    const result = drawFromPool(pool.id);
    if (result.status !== "drawn") return;

    const deck = decks.find((d) => d.id === result.deckId);
    setAnnouncement(`${deck?.name ?? "A deck"}, from ${pool.name}.`);
  }

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
          turnable
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
          footer={
            <PageTurn
              page={index + 1}
              pageCount={pools.length}
              {...(previous === undefined ? {} : { previous: previous.name })}
              {...(next === undefined ? {} : { next: next.name })}
              renderLink={(direction, props) => (
                <Link
                  to={`/pools/${(direction === "previous" ? previous : next)?.id ?? ""}`}
                  viewTransition
                  {...props}
                />
              )}
            />
          }
        >
          <PoolDeckList pool={pool} decks={decks} />
        </PoolCard>
      </div>

      <PoolSettings pool={pool} />
    </>
  );
}

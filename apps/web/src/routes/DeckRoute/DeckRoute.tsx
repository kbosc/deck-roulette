import { DeckDetails } from "@deck-roulette/ui";
import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { DeckNotFound } from "../../components/DeckNotFound";
import { PageHeading, usePageTitle } from "../../components/PageHeading";
import { useLibrary } from "../../store/library";

const LINK =
  "rounded-sm text-text-action underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

export function DeckRoute() {
  const { deckId } = useParams();
  const deck = useLibrary((state) => state.decks.find((d) => d.id === deckId));
  const allPools = useLibrary((state) => state.pools);
  // Not filtered in the selector: a new array on every call would re-render on every store change.
  const pools = useMemo(
    () => allPools.filter((pool) => deck !== undefined && pool.deckIds.includes(deck.id)),
    [allPools, deck],
  );
  // Called before the early return: hooks cannot be conditional.
  usePageTitle(deck === undefined ? "Deck not found" : deck.name);

  if (deck === undefined) return <DeckNotFound />;

  return (
    <>
      <Link to="/" className={`inline-flex min-h-11 items-center text-sm ${LINK}`}>
        All decks
      </Link>
      <PageHeading>{deck.name}</PageHeading>

      <div className="mt-6">
        <DeckDetails
          deck={deck}
          pools={pools}
          renderPoolName={(pool) => (
            <Link to={`/pools/${pool.id}`} className={LINK}>
              {pool.name}
            </Link>
          )}
        />
      </div>
    </>
  );
}

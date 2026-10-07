import { Button, Checkbox, EmptyState } from "@deck-roulette/ui";
import { Link, useParams } from "react-router";
import { useLibrary } from "../../store/library";

export function PoolDetailRoute() {
  const { poolId } = useParams();
  const decks = useLibrary((state) => state.decks);
  const pool = useLibrary((state) => state.pools.find((p) => p.id === poolId));
  const addDeckToPool = useLibrary((state) => state.addDeckToPool);
  const removeDeckFromPool = useLibrary((state) => state.removeDeckFromPool);

  // Also reached from a stale bookmark, or after a deletion in another tab.
  if (pool === undefined) {
    return (
      <EmptyState
        headingLevel={2}
        title="This pool does not exist"
        description="It may have been deleted, or the link may be out of date."
        action={
          <Button asChild>
            <Link to="/pools">Back to the pools</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <Link
        to="/pools"
        className="inline-flex min-h-11 items-center rounded-sm text-sm text-text-action underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        All pools
      </Link>
      <h1 className="text-2xl font-semibold">{pool.name}</h1>

      <div className="mt-6">
        {decks.length === 0 ? (
          <EmptyState
            headingLevel={2}
            title="No deck to choose from"
            description="Add your decks to the library first, then come back to pick this pool's."
            action={
              <Button asChild>
                <Link to="/">Go to the library</Link>
              </Button>
            }
          />
        ) : (
          <fieldset>
            <legend className="text-lg font-semibold">Decks in {pool.name}</legend>
            <div className="mt-3 flex flex-col">
              {decks.map((deck) => (
                <Checkbox
                  key={deck.id}
                  label={deck.name}
                  checked={pool.deckIds.includes(deck.id)}
                  onChange={(event) => {
                    if (event.target.checked) addDeckToPool(pool.id, deck.id);
                    else removeDeckFromPool(pool.id, deck.id);
                  }}
                />
              ))}
            </div>
          </fieldset>
        )}
      </div>
    </>
  );
}

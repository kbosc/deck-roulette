import type { Deck, Pool } from "@deck-roulette/domain";

export type PoolDeckListProps = {
  readonly pool: Pool;
  /** The library's decks: the list picks out the pool's own, in the pool's order. */
  readonly decks: readonly Deck[];
};

/** The page of a pool: drawn decks crossed out in red ink, the last one marked. */
export function PoolDeckList({ pool, decks }: PoolDeckListProps) {
  const poolDecks = pool.deckIds.flatMap((id) => decks.find((deck) => deck.id === id) ?? []);
  const drawnIds = new Set(pool.drawnDeckIds);
  const lastDrawnId = pool.drawnDeckIds.at(-1);

  if (poolDecks.length === 0) return null;

  return (
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
  );
}

import type { Deck, Pool } from "@deck-roulette/domain";
import type { ReactNode } from "react";
import { ManaIdentity } from "../../atoms/ManaIdentity";

export type DeckDetailsProps = {
  readonly deck: Deck;
  /** The pools holding the deck: the deck itself does not know them. */
  readonly pools: readonly Pool[];
  /** A link to the pool's page, typically. */
  readonly renderPoolName?: (pool: Pool) => ReactNode;
};

const NOT_SET = <span className="text-text-muted">Not set</span>;

/** Everything known about a deck, on a page of the grimoire. */
export function DeckDetails({ deck, pools, renderPoolName }: DeckDetailsProps) {
  const commanders = deck.commanders;

  const rows: ReadonlyArray<readonly [term: string, value: ReactNode]> = [
    [
      commanders?.length === 2 ? "Commanders" : "Commander",
      commanders === undefined ? NOT_SET : commanders.join(" // "),
    ],
    [
      "Color identity",
      deck.colors === undefined ? NOT_SET : <ManaIdentity colors={deck.colors} showNames />,
    ],
    ["Bracket", deck.bracket === undefined ? NOT_SET : `Bracket ${deck.bracket}`],
    [
      "Pools",
      pools.length === 0 ? (
        <span className="text-text-muted">In no pool yet</span>
      ) : (
        <ul aria-label="Pools" className="flex flex-col gap-1">
          {pools.map((pool) => (
            <li key={pool.id}>{renderPoolName === undefined ? pool.name : renderPoolName(pool)}</li>
          ))}
        </ul>
      ),
    ],
  ];

  return (
    <dl
      data-surface="page"
      className="rounded-sm border border-border bg-surface-raised px-4 text-text shadow-elevation-rest"
    >
      {rows.map(([term, value]) => (
        <div
          key={term}
          className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:grid sm:grid-cols-3 sm:gap-4"
        >
          <dt className="font-display text-sm tracking-wide text-text-muted">{term}</dt>
          <dd className="min-w-0 break-words sm:col-span-2">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

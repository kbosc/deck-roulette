import { toDeckId, toPoolId } from "./ids";
import type { Deck, Pool } from "./types";

/** Plain strings in, branded ids out: keeps the tests readable. */
type PoolOverrides = Omit<Partial<Pool>, "id" | "deckIds" | "drawnDeckIds"> & {
  readonly id?: string;
  readonly deckIds?: readonly string[];
  readonly drawnDeckIds?: readonly string[];
};

/** Not exported from the package barrel: test scaffolding, not domain API. */
export function makePool({ id, deckIds, drawnDeckIds, ...rest }: PoolOverrides = {}): Pool {
  return {
    id: toPoolId(id ?? "pool-1"),
    name: "Thursday table",
    deckIds: (deckIds ?? []).map(toDeckId),
    drawnDeckIds: (drawnDeckIds ?? []).map(toDeckId),
    createdAt: "2026-09-05T00:00:00.000Z",
    ...rest,
  };
}

type DeckOverrides = Omit<Partial<Deck>, "id"> & { readonly id?: string };

export function makeDeck({ id, ...rest }: DeckOverrides = {}): Deck {
  return {
    id: toDeckId(id ?? "deck-1"),
    name: "Atraxa, Praetors' Voice",
    createdAt: "2026-09-05T00:00:00.000Z",
    ...rest,
  };
}

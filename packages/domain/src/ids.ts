declare const brand: unique symbol;

/** Compile-time only: makes a `DeckId` and a `PoolId` impossible to swap. */
type Branded<TValue, TBrand extends string> = TValue & {
  readonly [brand]: TBrand;
};

export type DeckId = Branded<string, "DeckId">;

export type PoolId = Branded<string, "PoolId">;

/** The only cast to `DeckId`. Call it at the boundaries (generation, import, URL). */
export function toDeckId(value: string): DeckId {
  if (value === "") {
    throw new TypeError("a deck id cannot be empty");
  }
  return value as DeckId;
}

/** See `toDeckId`. */
export function toPoolId(value: string): PoolId {
  if (value === "") {
    throw new TypeError("a pool id cannot be empty");
  }
  return value as PoolId;
}

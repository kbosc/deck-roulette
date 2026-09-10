/**
 * A symbol that exists for the compiler only: `declare` emits no JavaScript.
 * Being a `unique symbol` makes it impossible for another module to produce a
 * matching property key by accident, which a plain string key would allow.
 */
declare const brand: unique symbol;

/**
 * Tags a primitive with a compile-time-only marker, so that two values sharing
 * the same runtime shape stop being interchangeable.
 *
 * TypeScript is structurally typed: `type DeckId = string` is a mere alias and
 * offers no protection at all. The intersection below gives the type a shape
 * that a plain string does not have.
 */
type Branded<TValue, TBrand extends string> = TValue & {
  readonly [brand]: TBrand;
};

/** Identifies a deck. A plain string, as far as the runtime is concerned. */
export type DeckId = Branded<string, "DeckId">;

/** Identifies a pool. Not assignable to `DeckId`, which is the whole point. */
export type PoolId = Branded<string, "PoolId">;

/**
 * The only door into `DeckId`.
 *
 * A brand cannot be produced without an assertion, so every assertion is
 * confined here: one place to audit, instead of casts scattered around. Call it
 * at the boundaries — id generation, file import, URL parameters — never in the
 * middle of domain code, where ids already carry their type.
 */
export function toDeckId(value: string): DeckId {
  if (value === "") {
    throw new TypeError("a deck id cannot be empty");
  }
  return value as DeckId;
}

/** The only door into `PoolId`. See `toDeckId`. */
export function toPoolId(value: string): PoolId {
  if (value === "") {
    throw new TypeError("a pool id cannot be empty");
  }
  return value as PoolId;
}

import type { NameProblem } from "@deck-roulette/domain";

/** Shared by the list's form and the item's page: one rule, one wording. */
export const deckNameMessages: Readonly<Record<NameProblem, string>> = {
  empty: "Give the deck a name.",
  duplicate: "A deck with this name is already in your library.",
};

export const poolNameMessages: Readonly<Record<NameProblem, string>> = {
  empty: "Give the pool a name.",
  duplicate: "A pool with this name already exists.",
};

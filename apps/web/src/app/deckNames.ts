import type { NameProblem } from "@deck-roulette/domain";

/** Shared by the library's form and the deck's page: one rule, one wording. */
export const deckNameMessages: Readonly<Record<NameProblem, string>> = {
  empty: "Give the deck a name.",
  duplicate: "A deck with this name is already in your library.",
};

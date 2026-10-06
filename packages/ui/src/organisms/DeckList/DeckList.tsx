import type { Deck, DeckId } from "@deck-roulette/domain";
import type { ReactNode } from "react";
import { DeckCard } from "../../molecules/DeckCard";
import { EmptyState } from "../../molecules/EmptyState";
import type { EmptyStateProps } from "../../molecules/EmptyState";

export type DeckListProps = {
  readonly decks: readonly Deck[];
  /** Required: a blank area reads as a bug or as loading. */
  readonly empty: EmptyStateProps;
  readonly renderActions?: (deck: Deck) => ReactNode;
  readonly highlightedDeckId?: DeckId;
  /** Tells two lists apart for screen readers: "Decks in Thursday table". */
  readonly label: string;
};

export function DeckList({ decks, empty, renderActions, highlightedDeckId, label }: DeckListProps) {
  if (decks.length === 0) {
    return <EmptyState {...empty} />;
  }

  return (
    <ul aria-label={label} className="flex flex-col gap-3">
      {decks.map((deck) => (
        <li key={deck.id}>
          <DeckCard
            deck={deck}
            highlighted={deck.id === highlightedDeckId}
            {...(renderActions === undefined ? {} : { actions: renderActions(deck) })}
          />
        </li>
      ))}
    </ul>
  );
}

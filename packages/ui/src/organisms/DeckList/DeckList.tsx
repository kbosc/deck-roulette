import type { Deck, DeckId } from "@deck-roulette/domain";
import type { ReactNode } from "react";
import { DeckCard } from "../../molecules/DeckCard";
import { EmptyState } from "../../molecules/EmptyState";
import type { EmptyStateProps } from "../../molecules/EmptyState";

export type DeckListProps = {
  readonly decks: readonly Deck[];
  /**
   * What to show when there is nothing to list.
   *
   * Required: a list that can be empty and has no empty state renders a blank
   * area, which reads as a bug or as something still loading.
   */
  readonly empty: EmptyStateProps;
  /** Controls for one deck. Called per deck so each gets its own handlers. */
  readonly renderActions?: (deck: Deck) => ReactNode;
  /** The deck that has just been drawn, if any. */
  readonly highlightedDeckId?: DeckId;
  /**
   * Names the list for assistive technology — "Decks in Thursday table".
   *
   * A screen holding two lists leaves anyone hearing "list, 8 items" twice
   * unable to tell which is which.
   */
  readonly label: string;
};

/**
 * A list of decks.
 *
 * Rendered as a real `ul`/`li` rather than a grid of divs: a screen reader then
 * announces "list, 8 items" and offers to jump from one to the next. Divs that
 * merely look like a list give none of that, and the loss is invisible to
 * whoever wrote them.
 */
export function DeckList({ decks, empty, renderActions, highlightedDeckId, label }: DeckListProps) {
  if (decks.length === 0) {
    return <EmptyState {...empty} />;
  }

  return (
    <ul aria-label={label} className="flex flex-col gap-3">
      {decks.map((deck) => (
        // Keyed by id, never by index: keyed by index, deleting the first deck
        // makes React reuse that row for the second, and any state inside it —
        // an open menu, a half-typed rename — follows the wrong deck.
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

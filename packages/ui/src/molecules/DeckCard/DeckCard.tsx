import type { Deck } from "@deck-roulette/domain";
import type { ReactNode } from "react";
import { Badge } from "../../atoms/Badge";
import { ManaIdentity } from "../../atoms/ManaIdentity";

export type DeckCardProps = {
  readonly deck: Deck;
  /**
   * Controls belonging to this deck — deleting it, opening its list.
   *
   * They are passed in rather than declared here so the card never has to grow
   * a boolean per possible action. A screen that shows a deck without any
   * control simply passes none.
   */
  readonly actions?: ReactNode;
  /**
   * Marks the deck that has just been drawn.
   *
   * The ring is reinforcement, never the message: a badge says it in words, so
   * the state survives a screen reader and a color vision deficiency alike.
   */
  readonly highlighted?: boolean;
};

/** "Atraxa" or "Tana // Tymna", never an array printed as-is. */
function formatCommanders(deck: Deck): string | undefined {
  return deck.commanders?.join(" // ");
}

/**
 * One deck in a list.
 *
 * Rendered as an `article` with a heading rather than a clickable `div`: a card
 * that is one big button cannot hold a delete button inside it — nesting
 * interactive elements is invalid HTML, and keyboard users end up unable to
 * reach the inner control. Anything that navigates belongs on the title.
 */
export function DeckCard({ deck, actions, highlighted = false }: DeckCardProps) {
  const commanders = formatCommanders(deck);

  return (
    <article
      className={[
        "flex items-start justify-between gap-4",
        "p-4 rounded-lg border",
        "bg-surface-raised",
        highlighted ? "border-action ring-2 ring-action" : "border-border",
      ].join(" ")}
    >
      <div className="flex flex-col gap-2 min-w-0">
        <h3 className="font-semibold text-text truncate">{deck.name}</h3>

        {commanders === undefined ? null : (
          <p className="text-sm text-text-muted truncate">{commanders}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {highlighted ? <Badge tone="success">Just drawn</Badge> : null}

          {deck.colors === undefined ? null : <ManaIdentity colors={deck.colors} size="sm" />}

          {deck.bracket === undefined ? null : (
            // The number is spelled out: "3" alone means nothing to someone
            // meeting the scale for the first time, or hearing it read out.
            <Badge tone="info">Bracket {deck.bracket}</Badge>
          )}
        </div>
      </div>

      {actions === undefined ? null : <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </article>
  );
}

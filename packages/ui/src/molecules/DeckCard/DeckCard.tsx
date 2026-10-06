import type { Deck } from "@deck-roulette/domain";
import type { ReactNode } from "react";
import { Badge } from "../../atoms/Badge";
import { ManaIdentity } from "../../atoms/ManaIdentity";

export type DeckCardProps = {
  readonly deck: Deck;
  readonly actions?: ReactNode;
  /** Said by a badge, not only by the ring: color is never the only signal. */
  readonly highlighted?: boolean;
};

/** "Atraxa" or "Tana // Tymna", never an array printed as-is. */
function formatCommanders(deck: Deck): string | undefined {
  return deck.commanders?.join(" // ");
}

/** Not a clickable card: it holds buttons, and interactive elements cannot nest. */
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

          {deck.bracket === undefined ? null : <Badge tone="info">Bracket {deck.bracket}</Badge>}
        </div>
      </div>

      {actions === undefined ? null : (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </article>
  );
}

import type { Deck, NameProblem } from "@deck-roulette/domain";
import { Button, ConfirmDialog, DeckList } from "@deck-roulette/ui";
import { useRef, useState } from "react";
import { NameForm } from "../../components/NameForm";
import { useLibrary } from "../../store/library";

const nameMessages: Record<NameProblem, string> = {
  empty: "Give the deck a name.",
  duplicate: "A deck with this name is already in your library.",
};

export function LibraryRoute() {
  const decks = useLibrary((state) => state.decks);
  const addDeck = useLibrary((state) => state.addDeck);
  const removeDeck = useLibrary((state) => state.removeDeck);
  // Not a selector: one returning a new array would re-render on every store change.
  const deckNames = decks.map((deck) => deck.name);

  // One dialog for the whole list. Kept mounted after closing, `isAsking` drives it:
  // unmounting it would cut Radix's close sequence and lose focus restoration.
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);

  function askToDelete(deck: Deck) {
    setDeckToDelete(deck);
    setIsAsking(true);
  }

  function confirmDeletion() {
    if (deckToDelete === null) return;

    removeDeck(deckToDelete.id);
    setLastDeleted(deckToDelete.name);
  }

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold outline-none">
        Library
      </h1>

      <div className="mt-6">
        <NameForm
          label="Deck name"
          placeholder="Atraxa, Praetors' Voice"
          existingNames={deckNames}
          messages={nameMessages}
          onCreate={(name) => {
            addDeck(name);
            setLastDeleted(null);
          }}
        />
      </div>

      {/* Always rendered: a live region that appears with its text is often not announced. */}
      <p role="status" className="sr-only">
        {lastDeleted === null ? "" : `${lastDeleted} deleted.`}
      </p>

      <div className="mt-6">
        {/* The empty state carries its own h2; the cards are h3. */}
        {decks.length === 0 ? null : <h2 className="mb-3 text-lg font-semibold">Your decks</h2>}
        <DeckList
          decks={decks}
          label="Your decks"
          renderActions={(deck) => (
            <Button size="sm" variant="ghost" onClick={() => askToDelete(deck)}>
              {/* The space stays outside the span, or the name becomes "DeleteAtraxa". */}
              Delete <span className="sr-only">{deck.name}</span>
            </Button>
          )}
          empty={{
            headingLevel: 2,
            title: "No deck yet",
            description: "Add your first deck and it will start showing up in your draws.",
          }}
        />
      </div>

      {deckToDelete === null ? null : (
        <ConfirmDialog
          open={isAsking}
          onOpenChange={setIsAsking}
          title={`Delete ${deckToDelete.name}?`}
          description={`${deckToDelete.name} will be removed from every pool it belongs to. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDeletion}
          // The opener disappears with its row: focus would fall to the body.
          onConfirmedFocus={() => headingRef.current?.focus()}
        />
      )}
    </>
  );
}

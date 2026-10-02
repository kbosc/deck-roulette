import type { Deck } from "@deck-roulette/domain";
import { Button, ConfirmDialog, DeckList, Field, Input } from "@deck-roulette/ui";
import { useRef, useState } from "react";
import { useLibrary } from "../../store/library";

export function LibraryRoute() {
  const decks = useLibrary((state) => state.decks);
  const addDeck = useLibrary((state) => state.addDeck);
  const removeDeck = useLibrary((state) => state.removeDeck);

  const [name, setName] = useState("");
  /**
   * One dialog for the whole list, told which deck it is about.
   *
   * A dialog per card would mount as many dialogs as there are decks, each with
   * its own focus trap and portal, for a screen that can only ever show one.
   *
   * The deck is kept once the dialog closes, and `isAsking` drives the opening
   * instead: unmounting the dialog on close would cut Radix off mid-sequence,
   * and it would never restore focus to the button the question came from.
   */
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  /** What was just deleted, so it can be announced. Cleared on the next action. */
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

      <form
        className="mt-6 flex items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim() === "") return;
          addDeck(name.trim());
          setName("");
          setLastDeleted(null);
        }}
      >
        <div className="flex-1">
          <Field label="Deck name">
            {(props) => (
              <Input
                {...props}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Atraxa, Praetors' Voice"
              />
            )}
          </Field>
        </div>
        <Button type="submit">Add</Button>
      </form>

      {/*
        A live region: assistive technology reads whatever appears here without
        the focus having to move to it. Rendered empty at all times rather than
        conditionally, because a region that appears at the same moment as its
        text is often missed.
      */}
      <p role="status" className="sr-only">
        {lastDeleted === null ? "" : `${lastDeleted} deleted.`}
      </p>

      <div className="mt-6">
        <DeckList
          decks={decks}
          label="Your decks"
          renderActions={(deck) => (
            <Button size="sm" variant="ghost" onClick={() => askToDelete(deck)}>
              {/* The row already shows the name, so sighted users only need
                  "Delete". Heard out of context, it says nothing: the name is
                  added for screen readers only. The space stays outside the
                  span: inside it, the name is computed as "DeleteAtraxa". */}
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
          // The button this dialog came from disappears with its row, so Radix
          // has nothing to hand focus back to and it would fall to the document
          // body. Somewhere stable has to be chosen on purpose.
          onConfirmedFocus={() => headingRef.current?.focus()}
        />
      )}
    </>
  );
}

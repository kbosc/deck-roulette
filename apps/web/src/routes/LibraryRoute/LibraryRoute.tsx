import type { Deck, NameProblem } from "@deck-roulette/domain";
import { validateName } from "@deck-roulette/domain";
import { Button, ConfirmDialog, DeckList, Field, Input } from "@deck-roulette/ui";
import { useRef, useState } from "react";
import { useLibrary } from "../../store/library";

/**
 * What to tell the user for each way a name can be refused.
 *
 * A Record over the domain's codes: if the domain adds one, this stops
 * compiling until it has a message.
 */
const nameMessages: Record<NameProblem, string> = {
  empty: "Give the deck a name.",
  duplicate: "A deck with this name is already in your library.",
};

export function LibraryRoute() {
  const decks = useLibrary((state) => state.decks);
  const addDeck = useLibrary((state) => state.addDeck);
  const removeDeck = useLibrary((state) => state.removeDeck);
  // Derived on render rather than selected from the store: a selector returning
  // a new array each time would make Zustand re-render on every store change.
  const deckNames = decks.map((deck) => deck.name);

  const [name, setName] = useState("");
  /**
   * Set on submit only, never while typing: nobody should be told off before
   * they have tried. Once shown, it is re-checked on every keystroke so that it
   * goes away the moment the name is fixed.
   */
  const [nameProblem, setNameProblem] = useState<NameProblem | null>(null);
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
  const nameRef = useRef<HTMLInputElement>(null);

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

      {/*
        noValidate: the field is marked required for assistive technology, but
        the browser's own bubble would take over the message, look different in
        every browser, and accept a name made of spaces.
      */}
      <form
        noValidate
        // Three rows (label, control, messages) that the field adopts through
        // subgrid: the button sits in the control's row, level with the input
        // whether or not an error appears below it.
        // One explicit column that takes the free space; placing the button in
        // a second one creates it implicitly, sized to the button.
        className="mt-6 grid grid-cols-1 gap-x-3 gap-y-2"
        onSubmit={(event) => {
          event.preventDefault();

          const problem = validateName(name, deckNames);
          if (problem !== null) {
            setNameProblem(problem);
            // Clicking "Add" left focus on the button; bring it back to where
            // the fix has to be typed.
            nameRef.current?.focus();
            return;
          }

          addDeck(name);
          setName("");
          setLastDeleted(null);
        }}
      >
        <Field
          layout="subgrid"
          label="Deck name"
          required
          error={nameProblem === null ? undefined : nameMessages[nameProblem]}
        >
          {(props) => (
            <Input
              {...props}
              ref={nameRef}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (nameProblem !== null)
                  setNameProblem(validateName(event.target.value, deckNames));
              }}
              placeholder="Atraxa, Praetors' Voice"
            />
          )}
        </Field>
        <Button type="submit" className="col-start-2 row-start-2">
          Add
        </Button>
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

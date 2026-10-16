import type { NameProblem } from "@deck-roulette/domain";
import { DeckList } from "@deck-roulette/ui";
import { Link } from "react-router";
import { NameForm } from "../../components/NameForm";
import { PageHeading } from "../../components/PageHeading";
import { useLibrary } from "../../store/library";

const nameMessages: Record<NameProblem, string> = {
  empty: "Give the deck a name.",
  duplicate: "A deck with this name is already in your library.",
};

export function LibraryRoute() {
  const decks = useLibrary((state) => state.decks);
  const addDeck = useLibrary((state) => state.addDeck);
  // Not a selector: one returning a new array would re-render on every store change.
  const deckNames = decks.map((deck) => deck.name);

  return (
    <>
      <PageHeading>Library</PageHeading>

      <div className="mt-6">
        <NameForm
          label="Deck name"
          placeholder="Atraxa, Praetors' Voice"
          existingNames={deckNames}
          messages={nameMessages}
          onCreate={addDeck}
        />
      </div>

      <div className="mt-6">
        {/* The empty state carries its own h2; the cards are h3. */}
        {decks.length === 0 ? null : <h2 className="mb-3 text-lg font-semibold">Your decks</h2>}
        <DeckList
          decks={decks}
          label="Your decks"
          renderTitle={(deck) => (
            <Link
              to={`/decks/${deck.id}`}
              className="rounded-sm underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
            >
              {deck.name}
            </Link>
          )}
          empty={{
            headingLevel: 2,
            title: "No deck yet",
            description: "Add your first deck and it will start showing up in your draws.",
          }}
        />
      </div>
    </>
  );
}

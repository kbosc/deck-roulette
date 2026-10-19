import type { Deck, Pool } from "@deck-roulette/domain";
import { validateName } from "@deck-roulette/domain";
import { Button, ConfirmDialog, DeckForm } from "@deck-roulette/ui";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { deckNameMessages } from "../../app/deckNames";
import { useAnnounce } from "../../components/Announcer";
import { DeckNotFound } from "../../components/DeckNotFound";
import { PageHeading, usePageTitle } from "../../components/PageHeading";
import { useLibrary } from "../../store/library";

const LINK =
  "rounded-sm text-text-action underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

export function DeckRoute() {
  const { deckId } = useParams();
  const deck = useLibrary((state) => state.decks.find((d) => d.id === deckId));
  const allPools = useLibrary((state) => state.pools);
  // Not filtered in the selector: a new array on every call would re-render on every store change.
  const pools = useMemo(
    () => allPools.filter((pool) => deck !== undefined && pool.deckIds.includes(deck.id)),
    [allPools, deck],
  );
  // Called before the early return: hooks cannot be conditional.
  usePageTitle(deck === undefined ? "Deck not found" : deck.name);

  if (deck === undefined) return <DeckNotFound />;

  return (
    <>
      <Link to="/" className={`inline-flex min-h-11 items-center text-sm ${LINK}`}>
        All decks
      </Link>
      <PageHeading>{deck.name}</PageHeading>

      <div className="mt-6">
        {/* Keyed: another deck's page must not inherit this one's unsaved changes. */}
        <EditDeck key={deck.id} deck={deck} />
      </div>

      <DeckPools pools={pools} />

      <div className="mt-6">
        <DeleteDeck deck={deck} />
      </div>
    </>
  );
}

function EditDeck({ deck }: { readonly deck: Deck }) {
  const decks = useLibrary((state) => state.decks);
  const updateDeck = useLibrary((state) => state.updateDeck);
  const announce = useAnnounce();
  // Itself left out: keeping its own name is not a duplicate.
  const otherNames = decks.filter((d) => d.id !== deck.id).map((d) => d.name);

  return (
    <DeckForm
      deck={deck}
      checkName={(name) => {
        const problem = validateName(name, otherNames);
        return problem === null ? undefined : deckNameMessages[problem];
      }}
      onSave={(edit) => {
        updateDeck(deck.id, edit);
        announce("Changes saved.");
      }}
    />
  );
}

function DeckPools({ pools }: { readonly pools: readonly Pool[] }) {
  return (
    <section aria-labelledby="deck-pools" className="mt-8">
      <h2 id="deck-pools" className="text-lg font-semibold">
        Pools
      </h2>
      {pools.length === 0 ? (
        <p className="mt-2 text-text-muted">In no pool yet.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {pools.map((pool) => (
            <li key={pool.id}>
              <Link
                to={`/pools/${pool.id}`}
                className={`inline-flex min-h-11 items-center ${LINK}`}
              >
                {pool.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DeleteDeck({ deck }: { readonly deck: Deck }) {
  const removeDeck = useLibrary((state) => state.removeDeck);
  const navigate = useNavigate();
  const announce = useAnnounce();
  const [isAsking, setIsAsking] = useState(false);

  async function leaveAndDelete() {
    // Replace: Back must not lead to the page of a deck that no longer exists.
    await navigate("/", { replace: true, flushSync: true });
    // Only once this page is gone, or it would render "deck not found" for a frame.
    removeDeck(deck.id);
    announce(`${deck.name} deleted.`);
  }

  return (
    <ConfirmDialog
      open={isAsking}
      onOpenChange={setIsAsking}
      trigger={<Button variant="ghost">Delete deck</Button>}
      title={`Delete ${deck.name}?`}
      description={`${deck.name} will be removed from every pool it belongs to. This cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={() => void leaveAndDelete()}
    />
  );
}

import { DeckList, Field, Input, Button } from "@deck-roulette/ui";
import { useState } from "react";
import { useLibrary } from "../../store/library";

export function LibraryRoute() {
  const decks = useLibrary((state) => state.decks);
  const addDeck = useLibrary((state) => state.addDeck);
  const [name, setName] = useState("");

  return (
    <>
      <h1 className="text-2xl font-semibold">Library</h1>

      <form
        className="mt-6 flex items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim() === "") return;
          addDeck(name.trim());
          setName("");
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

      <div className="mt-6">
        <DeckList
          decks={decks}
          label="Your decks"
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

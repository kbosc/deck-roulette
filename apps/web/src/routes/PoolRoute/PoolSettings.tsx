import type { Pool } from "@deck-roulette/domain";
import { validateName } from "@deck-roulette/domain";
import { Button, ConfirmDialog, Field, Input } from "@deck-roulette/ui";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { poolNameMessages } from "../../app/names";
import { useAnnounce } from "../../components/Announcer";
import { useUnsavedChanges } from "../../components/UnsavedChanges";
import { useLibrary } from "../../store/library";

/** Renaming and deleting live here, on the pool's own page: the list stays a table of contents. */
export function PoolSettings({ pool }: { readonly pool: Pool }) {
  const pools = useLibrary((state) => state.pools);
  const renamePool = useLibrary((state) => state.renamePool);
  const announce = useAnnounce();

  const [name, setName] = useState(pool.name);
  // Set on submit only; once shown, re-checked on every keystroke.
  const [checked, setChecked] = useState(false);
  // Read back once saved: the library trims what it stores.
  const [shownName, setShownName] = useState(pool.name);
  if (pool.name !== shownName) {
    setShownName(pool.name);
    setName(pool.name);
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const otherNames = pools.filter((p) => p.id !== pool.id).map((p) => p.name);
  const problem = validateName(name, otherNames);
  const error = checked && problem !== null ? poolNameMessages[problem] : undefined;
  const dirty = name.trim() !== pool.name;
  const unsaved = useUnsavedChanges(dirty, `The new name of ${pool.name} will be lost.`);

  /** The bar goes away: focus on one of its buttons would fall to the page. */
  function keepFocus() {
    if (barRef.current?.contains(document.activeElement) === true) inputRef.current?.focus();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    // One text field: Enter submits even when the Rename button is not there.
    if (!dirty) return;
    if (problem !== null) {
      setChecked(true);
      inputRef.current?.focus();
      return;
    }
    renamePool(pool.id, name);
    setChecked(false);
    announce(`Renamed to ${name.trim()}.`);
    keepFocus();
  }

  return (
    <section aria-labelledby="pool-settings" className="mt-10 border-t border-border pt-6">
      <h2 id="pool-settings" className="text-lg font-semibold">
        About this pool
      </h2>

      <form noValidate onSubmit={submit} className="mt-3 flex max-w-md flex-col gap-3">
        <Field label="Name" error={error}>
          {(props) => (
            <Input
              ref={inputRef}
              appearance="blank"
              value={name}
              onChange={(event) => setName(event.target.value)}
              {...props}
            />
          )}
        </Field>

        {dirty ? (
          <div ref={barRef} className="flex gap-3">
            <Button type="submit">Rename</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setName(pool.name);
                setChecked(false);
                keepFocus();
              }}
            >
              Discard
            </Button>
          </div>
        ) : null}
      </form>

      <div className="mt-6">
        {/* Deleting drops the new name with the pool: nothing to warn about. */}
        <DeletePool pool={pool} onLeave={unsaved.leaveOnPurpose} />
      </div>

      {unsaved.dialog}
    </section>
  );
}

type DeletePoolProps = {
  readonly pool: Pool;
  /** Called before navigating away, so the page does not ask about an unsaved name. */
  readonly onLeave: () => void;
};

function DeletePool({ pool, onLeave }: DeletePoolProps) {
  const removePool = useLibrary((state) => state.removePool);
  const navigate = useNavigate();
  const announce = useAnnounce();
  const [isAsking, setIsAsking] = useState(false);

  async function leaveAndDelete() {
    onLeave();
    // Replace: Back must not lead to the page of a pool that no longer exists.
    await navigate("/pools", { replace: true, flushSync: true });
    // Only once this page is gone, or it would render "pool not found" for a frame.
    removePool(pool.id);
    announce(`${pool.name} deleted.`);
  }

  return (
    <ConfirmDialog
      open={isAsking}
      onOpenChange={setIsAsking}
      trigger={<Button variant="ghost">Delete pool</Button>}
      title={`Delete ${pool.name}?`}
      description="The pool and its draw history will be lost. Its decks stay in your library."
      confirmLabel="Delete"
      onConfirm={() => void leaveAndDelete()}
    />
  );
}

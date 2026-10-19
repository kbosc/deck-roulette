import type { Bracket, Color, Deck, DeckEdit } from "@deck-roulette/domain";
import type { FormEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../atoms/Button";
import { Checkbox } from "../../atoms/Checkbox";
import { Input } from "../../atoms/Input";
import { SegmentedControl } from "../../molecules/SegmentedControl";

export type DeckFormProps = {
  readonly deck: Deck;
  /** The naming rules live in the domain: the message, or undefined when the name is fine. */
  readonly checkName: (name: string) => string | undefined;
  readonly onSave: (edit: DeckEdit) => void;
  /** Lets the page warn before unsaved changes are lost. */
  readonly onDirtyChange?: (dirty: boolean) => void;
};

const COLORS: ReadonlyArray<readonly [Color, string]> = [
  ["W", "White"],
  ["U", "Blue"],
  ["B", "Black"],
  ["R", "Red"],
  ["G", "Green"],
  ["C", "Colorless"],
];

type BracketChoice = "none" | "1" | "2" | "3" | "4" | "5";

const BRACKETS: Readonly<Record<BracketChoice, Bracket | undefined>> = {
  none: undefined,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
};

const BRACKET_OPTIONS = [
  { value: "none", label: "Not set" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
] as const;

type Draft = {
  readonly name: string;
  readonly commander: string;
  /** null: no second commander field on screen. */
  readonly second: string | null;
  readonly colors: readonly Color[];
  readonly bracket: BracketChoice;
};

function draftOf(deck: Deck): Draft {
  const [commander = "", second] = deck.commanders ?? [];
  return {
    name: deck.name,
    commander,
    second: second ?? null,
    colors: deck.colors ?? [],
    bracket: deck.bracket === undefined ? "none" : `${deck.bracket}`,
  };
}

/** Blank fields mean "not set": the domain refuses a blank commander. */
function editOf(draft: Draft): DeckEdit {
  const [first, second] = [draft.commander, draft.second ?? ""]
    .map((name) => name.trim())
    .filter((name) => name !== "");
  const bracket = BRACKETS[draft.bracket];
  const colors = COLORS.map(([color]) => color).filter((color) => draft.colors.includes(color));

  return {
    name: draft.name.trim(),
    ...(first === undefined
      ? {}
      : { commanders: second === undefined ? [first] : [first, second] }),
    ...(colors.length === 0 ? {} : { colors }),
    ...(bracket === undefined ? {} : { bracket }),
  };
}

/** Colorless is the absence of colors: ticking it clears them, ticking a color clears it. */
function toggle(colors: readonly Color[], color: Color, checked: boolean): readonly Color[] {
  if (!checked) return colors.filter((c) => c !== color);
  if (color === "C") return ["C"];
  return [...colors.filter((c) => c !== "C"), color];
}

function sameEdit(a: DeckEdit, b: DeckEdit): boolean {
  // Both built by editOf: same keys, in the same order.
  return JSON.stringify(a) === JSON.stringify(b);
}

const ROW = "flex flex-col gap-1 border-b border-border py-3 sm:grid sm:grid-cols-3 sm:gap-4";
const TERM = "font-display text-sm tracking-wide text-text-muted sm:pt-3";

/** Every detail of a deck, editable in place: no edit mode, a save bar once something changed. */
export function DeckForm({ deck, checkName, onSave, onDirtyChange }: DeckFormProps) {
  const [draft, setDraft] = useState(() => draftOf(deck));
  // Read back once saved: the library tidies what it stores (trimmed names, color order…).
  const [shownDeck, setShownDeck] = useState(deck);
  if (deck !== shownDeck) {
    setShownDeck(deck);
    setDraft(draftOf(deck));
  }
  // Set on submit only; once shown, re-checked on every keystroke.
  const [nameChecked, setNameChecked] = useState(false);
  const id = useId();

  const formRef = useRef<HTMLFormElement>(null);
  const saveBarRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  // The field or button to focus once it is rendered: it does not exist yet when clicked.
  const focusNext = useRef<"second" | "add-second" | null>(null);

  const edit = editOf(draft);
  const dirty = !sameEdit(edit, editOf(draftOf(deck)));
  const nameError = nameChecked ? checkName(draft.name) : undefined;

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  function update(changes: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (checkName(draft.name) !== undefined) {
      setNameChecked(true);
      nameRef.current?.focus();
      return;
    }
    onSave(edit);
    setNameChecked(false);
    keepFocus();
  }

  function discard() {
    setDraft(draftOf(deck));
    setNameChecked(false);
    keepFocus();
  }

  /** The save bar goes away: focus on one of its buttons would fall to the page. */
  function keepFocus() {
    if (saveBarRef.current?.contains(document.activeElement) === true) formRef.current?.focus();
  }

  return (
    <form
      ref={formRef}
      aria-label="Deck details"
      tabIndex={-1}
      noValidate
      onSubmit={submit}
      data-surface="page"
      className="rounded-sm border border-border bg-surface-raised px-4 text-text shadow-elevation-rest outline-none"
    >
      <div className={ROW}>
        <label htmlFor={`${id}-name`} className={TERM}>
          Name
        </label>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <Input
            ref={nameRef}
            id={`${id}-name`}
            appearance="blank"
            value={draft.name}
            onChange={(event) => update({ name: event.target.value })}
            aria-invalid={nameError === undefined ? undefined : true}
            aria-describedby={nameError === undefined ? undefined : `${id}-name-error`}
          />
          {nameError === undefined ? null : (
            <p id={`${id}-name-error`} role="alert" className="text-sm text-text-danger">
              {nameError}
            </p>
          )}
        </div>
      </div>

      <div className={ROW}>
        <label htmlFor={`${id}-commander`} className={TERM}>
          Commander
        </label>
        <div className="sm:col-span-2">
          <Input
            id={`${id}-commander`}
            appearance="blank"
            placeholder="Not set"
            value={draft.commander}
            onChange={(event) => update({ commander: event.target.value })}
          />
          {draft.second === null ? (
            <Button
              ref={(button) => {
                if (button !== null && focusNext.current === "add-second") {
                  focusNext.current = null;
                  button.focus();
                }
              }}
              type="button"
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => {
                focusNext.current = "second";
                update({ second: "" });
              }}
            >
              Add a second commander
            </Button>
          ) : null}
        </div>
      </div>

      {draft.second === null ? null : (
        <div className={ROW}>
          <label htmlFor={`${id}-second`} className={TERM}>
            Second commander
          </label>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Input
              ref={(input) => {
                if (input !== null && focusNext.current === "second") {
                  focusNext.current = null;
                  input.focus();
                }
              }}
              id={`${id}-second`}
              appearance="blank"
              placeholder="Not set"
              value={draft.second}
              onChange={(event) => update({ second: event.target.value })}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                focusNext.current = "add-second";
                update({ second: null });
              }}
            >
              Remove <span className="sr-only">second commander</span>
            </Button>
          </div>
        </div>
      )}

      {/* The legend names the checkboxes for screen readers; the term beside them is for the eye. */}
      <fieldset aria-describedby={`${id}-colors-hint`}>
        <legend className="sr-only">Color identity</legend>
        <div className={ROW}>
          <p aria-hidden="true" className={TERM}>
            Color identity
          </p>
          <div className="sm:col-span-2">
            <div className="flex flex-wrap gap-x-4">
              {COLORS.map(([color, label]) => (
                <Checkbox
                  key={color}
                  label={label}
                  checked={draft.colors.includes(color)}
                  onChange={(event) =>
                    update({ colors: toggle(draft.colors, color, event.target.checked) })
                  }
                />
              ))}
            </div>
            {/* Said up front: ticking one unticks the others without a word otherwise. */}
            <p id={`${id}-colors-hint`} className="text-sm text-text-muted">
              Colorless cannot go with a color: ticking it unticks the colors, and the other way
              round.
            </p>
          </div>
        </div>
      </fieldset>

      <div className={`${ROW} border-b-0`}>
        <p aria-hidden="true" className={TERM}>
          Bracket
        </p>
        <div className="sm:col-span-2">
          <SegmentedControl
            legend="Bracket"
            options={BRACKET_OPTIONS}
            value={draft.bracket}
            onChange={(bracket) => update({ bracket })}
          />
        </div>
      </div>

      {dirty ? (
        <div
          ref={saveBarRef}
          className="flex flex-wrap items-center justify-end gap-3 border-t border-border py-3"
        >
          <p className="me-auto text-sm text-text-muted">Unsaved changes</p>
          <Button type="button" variant="secondary" onClick={discard}>
            Discard
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      ) : null}
    </form>
  );
}

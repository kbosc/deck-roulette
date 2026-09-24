import type { ReactNode } from "react";
import { useId } from "react";

/** What a field hands to its control so the two stay wired together. */
export type FieldControlProps = {
  readonly id: string;
  readonly "aria-describedby": string | undefined;
  readonly "aria-invalid": boolean | undefined;
  readonly required: boolean;
};

export type FieldProps = {
  readonly label: string;
  /** Standing help, shown whether or not anything went wrong. */
  readonly hint?: string;
  /** Present only once the field has actually been found invalid. */
  readonly error?: string;
  readonly required?: boolean;
  /**
   * Receives the props that tie the control to its label, hint and error.
   *
   * A render prop rather than a plain child: the identifiers are generated
   * here, and cloning a child to inject them would silently break the day the
   * caller wraps their input in anything.
   */
  readonly children: (props: FieldControlProps) => ReactNode;
};

/**
 * A labelled form control, with its help text and its error message.
 *
 * The label is a real `label` bound by `htmlFor`, never a placeholder: a
 * placeholder disappears as soon as someone types, and is not announced as a
 * name by most screen readers.
 */
export function Field({ label, hint, error, required = false, children }: FieldProps) {
  // useId, not a counter or Math.random: the value has to match between the
  // server-rendered markup and the browser, or React discards the markup.
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Order matters: assistive technology reads these in the order given, and the
  // error is what the person needs first.
  const describedBy = [error === undefined ? undefined : errorId, hint === undefined ? undefined : hintId]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
        {required ? (
          <>
            {" "}
            <span className="text-text-danger" aria-hidden="true">
              *
            </span>
            {/* The asterisk is decorative; the real information is the word,
                available to a screen reader and invisible on screen. */}
            <span className="sr-only">(required)</span>
          </>
        ) : null}
      </label>

      {children({
        id,
        "aria-describedby": describedBy === "" ? undefined : describedBy,
        "aria-invalid": error === undefined ? undefined : true,
        required,
      })}

      {hint === undefined ? null : (
        <p id={hintId} className="text-sm text-text-muted">
          {hint}
        </p>
      )}

      {error === undefined ? null : (
        // role="alert" makes the message announced the moment it appears.
        // Without it, someone who has already moved on never learns the field
        // is wrong.
        <p id={errorId} role="alert" className="text-sm text-text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

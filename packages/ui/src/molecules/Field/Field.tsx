import type { ReactNode } from "react";
import { useId } from "react";

export type FieldControlProps = {
  readonly id: string;
  readonly "aria-describedby": string | undefined;
  readonly "aria-invalid": boolean | undefined;
  readonly required: boolean;
};

export type FieldProps = {
  readonly label: string;
  readonly hint?: string;
  /** `| undefined` spelled out so callers can write `error={problem ? message : undefined}`. */
  readonly error?: string | undefined;
  readonly required?: boolean;
  /** `subgrid` spans and adopts three rows of the parent's grid, which must provide them. */
  readonly layout?: "stack" | "subgrid";
  /** A render prop: cloning a child would break once the input is wrapped in anything. */
  readonly children: (props: FieldControlProps) => ReactNode;
};

export function Field({
  label,
  hint,
  error,
  required = false,
  layout = "stack",
  children,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Read in this order: the error first.
  const describedBy = [
    error === undefined ? undefined : errorId,
    hint === undefined ? undefined : hintId,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={layout === "subgrid" ? "row-span-3 grid grid-rows-subgrid" : "flex flex-col gap-2"}
    >
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
        {required ? (
          <>
            {" "}
            <span className="text-text-danger" aria-hidden="true">
              *
            </span>
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

      {/* One wrapper, so the field always has exactly three rows for a subgrid. */}
      <div className="flex flex-col gap-2 empty:hidden">
        {hint === undefined ? null : (
          <p id={hintId} className="text-sm text-text-muted">
            {hint}
          </p>
        )}

        {error === undefined ? null : (
          <p id={errorId} role="alert" className="text-sm text-text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

import type { ComponentPropsWithRef } from "react";

export type InputAppearance = "boxed" | "blank";

export type InputProps = ComponentPropsWithRef<"input"> & {
  /** `blank`: a line to write on, for a page that reads as text until it is edited. */
  readonly appearance?: InputAppearance;
};

const APPEARANCES: Readonly<Record<InputAppearance, string>> = {
  boxed: "px-3 bg-surface-raised border border-border rounded-md",
  // The underline is what tells a field from text: border-strong keeps it at 3:1.
  blank:
    "px-1 bg-transparent border-b border-border-strong rounded-none hover:bg-surface-sunken placeholder:italic",
};

/** No label, no error: those belong to `Field`. */
export function Input({ appearance = "boxed", className, ...props }: InputProps) {
  return (
    <input
      className={[
        "h-11 w-full",
        "text-text",
        APPEARANCES[appearance],
        "placeholder:text-text-muted",
        "outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
        "focus-visible:ring-offset-surface",
        "disabled:opacity-50",
        // Driven by aria-invalid, so the visual and accessible states cannot disagree.
        "aria-invalid:border-danger aria-invalid:ring-danger",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

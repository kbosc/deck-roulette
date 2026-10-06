import type { ComponentPropsWithRef } from "react";

export type InputProps = ComponentPropsWithRef<"input">;

/** No label, no error: those belong to `Field`. */
export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={[
        "h-11 w-full px-3",
        "bg-surface-raised text-text",
        "border border-border rounded-md",
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

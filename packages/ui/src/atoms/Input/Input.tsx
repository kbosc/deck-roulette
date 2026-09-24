import type { ComponentPropsWithRef } from "react";

export type InputProps = ComponentPropsWithRef<"input">;

/**
 * A bare text input, styled from the tokens and nothing else.
 *
 * It carries no label and no error message on purpose: those belong to `Field`,
 * which owns the identifiers tying them together. An input that labels itself
 * cannot be reused inside a different layout.
 */
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
        // Driven by aria-invalid rather than by a prop: the accessible state and
        // the visual state can then never disagree.
        "aria-invalid:border-danger aria-invalid:ring-danger",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

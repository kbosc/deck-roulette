import type { ComponentPropsWithRef } from "react";

export type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  readonly label: string;
};

/** A native checkbox: keyboard, states and announcements come for free. */
export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label
      className={["flex min-h-11 cursor-pointer items-center gap-3 text-text", className]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        className="size-5 cursor-pointer accent-action outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        {...props}
      />
      {label}
    </label>
  );
}

import { Slot } from "@radix-ui/react-slot";
import type { ComponentPropsWithRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

/** WithRef: Radix's `asChild` (Dialog.Close) needs to reach the DOM node. */
export type ButtonProps = ComponentPropsWithRef<"button"> & {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Renders the child instead: something that navigates must stay an `a`. */
  readonly asChild?: boolean;
  readonly children: ReactNode;
};

/** `primary` (a gilt seal on leather, red wax on a page) is kept for drawing, or for the only way out of a dead end. */
const VARIANTS: Readonly<Record<ButtonVariant, string>> = {
  primary: [
    "rounded-full font-display tracking-wide text-text-on-action",
    // The color shows only if the gradient fails to load.
    "bg-action bg-seal shadow-elevation-seal",
    "hover:-translate-y-px active:translate-y-0 active:shadow-elevation-seal-pressed",
  ].join(" "),
  secondary:
    "rounded-md bg-surface-raised text-text border border-border-strong hover:bg-surface-hover",
  ghost: "rounded-md bg-transparent text-text hover:bg-surface-hover",
  danger: "rounded-md bg-danger text-text-on-danger hover:bg-danger-hover",
};

/** `sm` is below a reliable touch target: only next to a larger one, or pointer-only. */
const SIZES: Readonly<Record<ButtonSize, string>> = {
  sm: "h-8 px-3 text-sm gap-1",
  md: "h-11 px-4 text-base gap-2",
  lg: "h-12 px-6 text-lg gap-2",
};

const BASE = [
  "inline-flex items-center justify-center",
  "font-medium",
  // Tailwind 4's preflight no longer sets it.
  "cursor-pointer",
  "transition ease-standard",
  "outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
  "focus-visible:ring-offset-surface",
  "disabled:opacity-50 disabled:pointer-events-none",
].join(" ");

export function Button({
  variant = "primary",
  size = "md",
  asChild = false,
  className,
  type,
  children,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      // Never submits a form by accident: a submit button asks for it.
      type={asChild ? undefined : (type ?? "button")}
      className={[BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}

import { Slot } from "@radix-ui/react-slot";
import type { ComponentPropsWithRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * `ComponentPropsWithRef` rather than `ButtonHTMLAttributes`: the latter leaves
 * out `ref`, which Radix needs whenever it wraps this component with `asChild`
 * — a Dialog.Close has to reach the real DOM node to focus and close it.
 *
 * Since React 19 a function component takes `ref` as an ordinary prop, so it
 * travels in `...props` and lands on the element. No `forwardRef` needed.
 */
export type ButtonProps = ComponentPropsWithRef<"button"> & {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /**
   * Renders the single child instead of a `button`, keeping every style and
   * prop. Used to make a link look like a button without lying about what it
   * is: a thing that navigates must stay an `a`, or keyboard and screen-reader
   * users lose the behaviour they expect.
   */
  readonly asChild?: boolean;
  readonly children: ReactNode;
};

/**
 * Every value below is a token. No hex, no pixel: rétro-fitting a token costs
 * ten times what declaring one does.
 */
const VARIANTS: Readonly<Record<ButtonVariant, string>> = {
  primary: "bg-action text-text-on-action hover:bg-action-hover active:bg-action-active",
  secondary:
    "bg-surface-raised text-text border border-border-strong hover:bg-surface-hover",
  ghost: "bg-transparent text-text hover:bg-surface-hover",
  danger: "bg-danger text-text-on-danger hover:bg-danger-hover",
};

/**
 * Heights stop at the 44px step for `md` and `lg`.
 *
 * `sm` is deliberately shorter, and is only ever acceptable next to a larger
 * target or on a pointer-only surface — a 32px control is below the size a
 * finger can reliably hit.
 */
const SIZES: Readonly<Record<ButtonSize, string>> = {
  sm: "h-8 px-3 text-sm gap-1",
  md: "h-11 px-4 text-base gap-2",
  lg: "h-12 px-6 text-lg gap-2",
};

const BASE = [
  "inline-flex items-center justify-center",
  "rounded-md font-medium",
  "transition-colors ease-standard",
  // The focus ring is never removed, only restyled: outline-none on its own is
  // the single most common way to make an interface unusable by keyboard.
  "outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
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
      // A button inside a form submits it unless told otherwise. Defaulting to
      // "button" means a component never submits a form by accident; a real
      // submit button asks for it explicitly.
      type={asChild ? undefined : (type ?? "button")}
      className={[BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}

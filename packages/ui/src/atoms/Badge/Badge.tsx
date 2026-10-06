import type { ComponentPropsWithRef, ReactNode } from "react";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export type BadgeProps = ComponentPropsWithRef<"span"> & {
  readonly tone?: BadgeTone;
  readonly children: ReactNode;
};

const TONES: Readonly<Record<BadgeTone, string>> = {
  neutral: "bg-surface-sunken text-text-muted border-border",
  info: "bg-surface-sunken text-text-action border-border",
  success: "bg-surface-success text-text-success border-border-success",
  warning: "bg-surface-warning text-text-warning border-border-warning",
  danger: "bg-surface-danger text-text-danger border-border-danger",
};

/** The tone is decoration: the text must say everything on its own. */
export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1",
        "px-2 h-6 rounded-full border",
        "text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}

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

/**
 * A small, non-interactive label.
 *
 * A badge never carries information on its own: its tone is decoration on top
 * of text that already says everything. "Bracket 3" reads the same in grey as
 * in red.
 */
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

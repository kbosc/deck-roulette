import type { ReactNode } from "react";

/**
 * Heading levels an empty state may use.
 *
 * Exposed because headings must not skip levels: an empty state sitting inside
 * a section already introduced by an `h2` has to be an `h3`. Hard-coding one
 * level would break the outline of whichever screen used it second.
 */
export type HeadingLevel = 2 | 3 | 4;

export type EmptyStateProps = {
  /** What is missing, as a statement — "No deck yet", not "Empty". */
  readonly title: string;
  /**
   * Why it is empty and what to do about it.
   *
   * The two cases read differently and must not share wording: nothing has been
   * created yet, or nothing matched a filter. Telling someone to "add a deck"
   * when they have forty and a bad search term is worse than saying nothing.
   */
  readonly description: string;
  /**
   * The way out. Omit it only when the action genuinely lives elsewhere on the
   * screen — an empty state with no way forward is a dead end with nicer type.
   */
  readonly action?: ReactNode;
  /** Decorative only: it is hidden from assistive technology. */
  readonly illustration?: ReactNode;
  readonly headingLevel?: HeadingLevel;
};

/**
 * What a screen shows instead of nothing.
 *
 * A blank area reads as a bug, or as something still loading. This says what is
 * missing and offers the next step.
 */
export function EmptyState({
  title,
  description,
  action,
  illustration,
  headingLevel = 2,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className="flex flex-col items-center text-center gap-3 px-4 py-12">
      {illustration === undefined ? null : (
        <div aria-hidden="true" className="text-text-muted">
          {illustration}
        </div>
      )}

      <Heading className="text-lg font-semibold text-text">{title}</Heading>

      <p className="max-w-prose text-text-muted">{description}</p>

      {action === undefined ? null : <div className="mt-2">{action}</div>}
    </div>
  );
}

import type { ReactNode } from "react";

/** Exposed because headings must not skip levels: it depends on the screen. */
export type HeadingLevel = 2 | 3 | 4;

export type EmptyStateProps = {
  readonly title: string;
  /** "Nothing yet" and "nothing matched" need different wording. */
  readonly description: string;
  /** Omit only when the action lives elsewhere on the screen. */
  readonly action?: ReactNode;
  /** Hidden from assistive technology. */
  readonly illustration?: ReactNode;
  readonly headingLevel?: HeadingLevel;
};

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

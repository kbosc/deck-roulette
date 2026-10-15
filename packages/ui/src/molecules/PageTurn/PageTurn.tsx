import type { ReactNode } from "react";

export type PageTurnDirection = "previous" | "next";

/** Spread them on the app's router link: the design system does not know the router. */
export type PageTurnLinkProps = {
  readonly className: string;
  readonly rel: "prev" | "next";
  readonly "aria-keyshortcuts": "ArrowLeft" | "ArrowRight";
  readonly children: ReactNode;
};

export type PageTurnProps = {
  /** 1-based, as read aloud. */
  readonly page: number;
  readonly pageCount: number;
  /** The name of the page before, if there is one. */
  readonly previous?: string;
  readonly next?: string;
  readonly renderLink: (direction: PageTurnDirection, props: PageTurnLinkProps) => ReactNode;
};

const LINK = [
  "group flex min-h-11 min-w-0 items-center gap-1 rounded-sm font-book text-text-action",
  "underline-offset-4 hover:underline",
  "outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
].join(" ");

/** A dog-eared corner that lifts on hover: shows there is a page to turn, and turns it when clicked. */
const FOLD = [
  "absolute -bottom-px size-8 bg-page-fold transition-all ease-standard",
  "group-hover:size-11 group-focus-visible:size-11",
].join(" ");

/** The foot of a page in the grimoire. Belongs inside a positioned page: the corners pin to it, over its border. */
export function PageTurn({ page, pageCount, previous, next, renderLink }: PageTurnProps) {
  return (
    <nav aria-label="Turn the page" className="grid grid-cols-3 items-center gap-2 px-8 text-sm">
      <div className="flex justify-start">
        {previous === undefined
          ? null
          : renderLink("previous", {
              className: LINK,
              rel: "prev",
              "aria-keyshortcuts": "ArrowLeft",
              children: (
                <>
                  {/* Mirrored: the same fold, on the left corner. */}
                  <span aria-hidden="true" className={`${FOLD} -left-px -scale-x-100`} />
                  <span aria-hidden="true">‹</span>
                  {/* The space stays outside the spans: a trailing one inside is dropped from the name. */}
                  <span className="sr-only">Previous page:</span>{" "}
                  <span className="truncate">{previous}</span>
                </>
              ),
            })}
      </div>

      <p className="text-center text-text-muted">
        Page {page} of {pageCount}
      </p>

      <div className="flex justify-end">
        {next === undefined
          ? null
          : renderLink("next", {
              className: LINK,
              rel: "next",
              "aria-keyshortcuts": "ArrowRight",
              children: (
                <>
                  <span className="sr-only">Next page:</span>{" "}
                  <span className="truncate">{next}</span>
                  <span aria-hidden="true">›</span>
                  <span aria-hidden="true" className={`${FOLD} -right-px`} />
                </>
              ),
            })}
      </div>
    </nav>
  );
}

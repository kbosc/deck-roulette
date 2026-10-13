import type { Ref } from "react";
import { usePageTitle } from "./usePageTitle";

export type PageHeadingProps = {
  readonly children: string;
  readonly ref?: Ref<HTMLHeadingElement>;
};

/** The page's h1: names the tab, and is focusable so the layout can move focus to it. */
export function PageHeading({ children, ref }: PageHeadingProps) {
  usePageTitle(children);

  return (
    <h1 ref={ref} tabIndex={-1} className="text-3xl font-semibold text-text-action outline-none">
      {children}
    </h1>
  );
}

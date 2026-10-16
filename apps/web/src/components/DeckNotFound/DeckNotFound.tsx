import { Button, EmptyState } from "@deck-roulette/ui";
import { Link } from "react-router";

/** Also reached from a stale bookmark, or after a deletion in another tab. */
export function DeckNotFound() {
  return (
    <EmptyState
      headingLevel={2}
      title="This deck does not exist"
      description="It may have been deleted, or the link may be out of date."
      action={
        <Button asChild>
          <Link to="/">Back to the library</Link>
        </Button>
      }
    />
  );
}

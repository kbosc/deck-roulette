import { Button, EmptyState } from "@deck-roulette/ui";
import { Link } from "react-router";

/** Also reached from a stale bookmark, or after a deletion in another tab. */
export function PoolNotFound() {
  return (
    <EmptyState
      headingLevel={2}
      title="This pool does not exist"
      description="It may have been deleted, or the link may be out of date."
      action={
        <Button asChild>
          <Link to="/pools">Back to the pools</Link>
        </Button>
      }
    />
  );
}

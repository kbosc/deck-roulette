import { EmptyState } from "@deck-roulette/ui";
import { Button } from "@deck-roulette/ui";
import { Link } from "react-router";
import { usePageTitle } from "../../components/PageHeading";

export function NotFoundRoute() {
  usePageTitle("Page not found");

  return (
    <EmptyState
      headingLevel={2}
      title="This page does not exist"
      description="The link may be out of date, or the address may have a typo in it."
      action={
        <Button asChild>
          <Link to="/">Back to the library</Link>
        </Button>
      }
    />
  );
}

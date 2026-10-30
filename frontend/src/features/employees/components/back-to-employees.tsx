import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Eyebrow link back to the list. No hooks or state, so server pages and client containers can both render it. */
export function BackToEmployees() {
  return (
    <Button asChild variant="link" size="sm" className="-ml-2.5 w-fit text-muted-foreground">
      <Link href="/employees">
        <ArrowLeftIcon data-icon="inline-start" />
        Employees
      </Link>
    </Button>
  );
}

import { ShieldAlertIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/molecules/empty-state";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <EmptyState
      icon={ShieldAlertIcon}
      title="403 — You don't have access to this page"
      description="Your role is read-only. Ask an HR Manager if you need to make changes."
      action={
        <Button asChild variant="outline">
          <Link href="/employees">Back to employees</Link>
        </Button>
      }
    />
  );
}

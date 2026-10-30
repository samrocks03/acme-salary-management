import { UserXIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/molecules/empty-state";
import { Button } from "@/components/ui/button";

export default function EmployeeNotFound() {
  return (
    <EmptyState
      icon={UserXIcon}
      title="Employee not found"
      description="They may have been deleted, or the link is wrong."
      action={
        <Button asChild variant="outline">
          <Link href="/employees">Back to employees</Link>
        </Button>
      }
    />
  );
}

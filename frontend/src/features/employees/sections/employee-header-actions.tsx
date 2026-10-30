import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";

/** Role-dependent header action; rendered behind its own Suspense so the header text stays static. */
export async function AddEmployeeButton() {
  const user = await getCurrentUser();
  if (!can(user?.role, "employee:create")) return null;
  return (
    <Button asChild>
      <Link href="/employees/new">
        <PlusIcon data-icon="inline-start" />
        Add employee
      </Link>
    </Button>
  );
}

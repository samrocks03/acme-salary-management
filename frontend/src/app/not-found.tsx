import { SearchXIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/molecules/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={SearchXIcon}
        title="Page not found"
        description="The page you are looking for doesn't exist or has been removed."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}

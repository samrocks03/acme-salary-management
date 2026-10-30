"use client";

import { AlertTriangleIcon } from "lucide-react";
import { EmptyState } from "@/components/molecules/empty-state";
import { Button } from "@/components/ui/button";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangleIcon}
      title="Something went wrong"
      description={error.digest ? `The page failed to load (ref ${error.digest}).` : "The page failed to load."}
      action={<Button onClick={() => retry()}>Try again</Button>}
    />
  );
}

"use client";

import { AlertCircleIcon, RotateCwIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface QueryErrorProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}

export function QueryError({ error, title = "Couldn't load this data", onRetry }: QueryErrorProps) {
  const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      {onRetry ? (
        <AlertAction>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCwIcon data-icon="inline-start" />
            Retry
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
}

export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
        {Icon ? (
          <CardAction>
            <Icon aria-hidden className="size-4 text-muted-foreground" />
          </CardAction>
        ) : null}
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardHeader>
    </Card>
  );
}

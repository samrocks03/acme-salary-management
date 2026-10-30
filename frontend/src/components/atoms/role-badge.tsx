import { Badge } from "@/components/ui/badge";
import type { Role } from "@/lib/permissions";

const ROLE_LABELS: Record<Role, string> = { hr_manager: "HR Manager", viewer: "Viewer" };

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={role === "hr_manager" ? "secondary" : "outline"}>{ROLE_LABELS[role] ?? role}</Badge>;
}

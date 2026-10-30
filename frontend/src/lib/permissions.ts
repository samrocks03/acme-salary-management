/** Single source of truth for what each role may do in the UI. The API (Pundit) still enforces it. */
export type Role = "hr_manager" | "viewer";

export type Action =
  | "employee:read"
  | "employee:create"
  | "employee:update"
  | "employee:delete"
  | "employee:export"
  | "salary_revision:create"
  | "insights:read";

const READ_ACTIONS: ReadonlySet<Action> = new Set(["employee:read", "insights:read"]);

const POLICY: Record<Role, (action: Action) => boolean> = {
  hr_manager: () => true,
  viewer: (action) => READ_ACTIONS.has(action),
};

export function can(role: Role | null | undefined, action: Action): boolean {
  if (!role || !(role in POLICY)) return false;
  return POLICY[role](action);
}

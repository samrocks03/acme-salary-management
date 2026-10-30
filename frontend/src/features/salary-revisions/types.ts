import type { Flattened } from "@/lib/jsonapi";

export const REVISION_REASONS = ["promotion", "annual_review", "market_adjustment", "correction", "other"] as const;
/** `hire` is created by the system when an employee is added; it is never user-selectable. */
export type RevisionReason = (typeof REVISION_REASONS)[number] | "hire";

export interface SalaryRevisionAttributes {
  employee_id: number;
  amount: number;
  previous_amount: number | null;
  change_percent: number | null;
  currency: string;
  effective_on: string;
  reason: RevisionReason;
  note: string | null;
  changed_by_name: string | null;
  created_at: string;
}

export type SalaryRevision = Flattened<SalaryRevisionAttributes>;

export interface SalaryRevisionInput {
  amount: number;
  effective_on: string;
  reason: Exclude<RevisionReason, "hire">;
  note?: string;
}

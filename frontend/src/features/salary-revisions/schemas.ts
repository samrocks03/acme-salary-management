import { z } from "zod";
import { formatDate } from "@/lib/format";
import { isoDate, money } from "@/lib/validation";
import { REVISION_REASONS } from "./types";

export const NOTE_MAX = 500;

export interface RevisionRuleContext {
  /** `YYYY-MM-DD` — revisions can't be future-dated (no scheduling in the MVP). */
  today: string;
  hiredOn: string;
  /** Effective date of the newest revision, which a new one may not precede. */
  latestEffectiveOn?: string;
}

/** Mirrors the API's revision rules (docs/02-architecture.md, domain rule 5). */
export function salaryRevisionSchema({ today, hiredOn, latestEffectiveOn }: RevisionRuleContext) {
  return z.object({
    amount: money("Amount"),
    effective_on: isoDate("Effective date")
      .refine((value) => value <= today, "Effective date can't be in the future")
      .refine((value) => value >= hiredOn, `Effective date can't be before the hire date (${formatDate(hiredOn)})`)
      .refine(
        (value) => !latestEffectiveOn || value >= latestEffectiveOn,
        `Effective date can't be before the latest change (${formatDate(latestEffectiveOn)})`,
      ),
    reason: z.enum(REVISION_REASONS, { error: "Select a reason" }),
    note: z.string().trim().max(NOTE_MAX, `Note must be at most ${NOTE_MAX} characters`),
  });
}

export interface SalaryRevisionFormValues {
  amount: number | undefined;
  effective_on: string;
  reason: (typeof REVISION_REASONS)[number] | "";
  note: string;
}

export const SALARY_REVISION_FORM_FIELDS = ["amount", "effective_on", "reason", "note"] as const;

/** Percentage change from the current salary, or undefined when it can't be computed yet. */
export function changePercent(current: number, next: number | undefined): number | undefined {
  if (!next || Number.isNaN(next) || current <= 0) return undefined;
  return Math.round(((next - current) / current) * 1000) / 10;
}

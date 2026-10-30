import { z } from "zod";

/** Upper bound the API enforces on any salary amount (docs/03-api-contract.md). */
export const MAX_SALARY = 100_000_000;

export const isoDate = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .min(1, `${label} is required`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date`)
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), `${label} must be a valid date`);

export const money = (label: string) =>
  z
    .number({ error: `${label} is required` })
    .positive(`${label} must be greater than 0`)
    .max(MAX_SALARY, `${label} must be at most 100,000,000`);

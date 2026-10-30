import { HOME_PATH } from "@/lib/auth/constants";

/**
 * Open-redirect guard for `?next=`: only same-site absolute paths are honoured
 * (`/employees?page=2` ok; `//evil.com`, `/\evil.com`, `https://evil.com`, `javascript:` rejected).
 */
export function safeNextPath(next: unknown, fallback: string = HOME_PATH): string {
  if (typeof next !== "string" || next.length === 0 || next.length > 2048) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  if (next.startsWith("/api/") || next === "/login" || next.startsWith("/login?")) return fallback;
  return next;
}

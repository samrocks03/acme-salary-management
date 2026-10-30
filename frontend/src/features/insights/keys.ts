/** Insights are aggregates over all employees: any write invalidates the whole subtree. */
export const insightKeys = {
  all: ["insights"] as const,
  overview: () => [...insightKeys.all, "overview"] as const,
  byCountry: () => [...insightKeys.all, "by-country"] as const,
  byJobTitle: (country?: string) => [...insightKeys.all, "by-job-title", country ?? "ALL"] as const,
  byDepartment: (country?: string) => [...insightKeys.all, "by-department", country ?? "ALL"] as const,
  distribution: (country?: string) => [...insightKeys.all, "distribution", country ?? "ALL"] as const,
  recentChanges: (days: number) => [...insightKeys.all, "recent-changes", days] as const,
};

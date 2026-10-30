import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { jsonResponse, mockFetch } from "@/test/http";
import { createTestQueryClient } from "@/test/query";
import { insightKeys } from "../keys";
import { RECENT_CHANGES_DAYS } from "../queries";
import { RecentChangesContainer } from "./recent-changes-container";

const data = { days: 90, revisions_count: 3, employees_count: 2, avg_change_percent: 5, by_reason: [] };

describe("RecentChangesContainer", () => {
  it("renders hydrated data without fetching", () => {
    const fetchMock = mockFetch();
    const { queryClient, wrapper } = createTestQueryClient();
    queryClient.setQueryData(insightKeys.recentChanges(RECENT_CHANGES_DAYS), data);
    render(<RecentChangesContainer />, { wrapper });
    expect(screen.getByText("Recent salary changes")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a skeleton, then an error with retry that recovers", async () => {
    mockFetch(
      jsonResponse({ success: false, errors: { base: ["Boom"] } }, { status: 500 }),
      jsonResponse({ success: true, data }),
    );
    const { wrapper } = createTestQueryClient();
    render(<RecentChangesContainer />, { wrapper });

    expect(screen.getByLabelText("Loading recent changes")).toBeInTheDocument();
    expect(await screen.findByText("Couldn't load recent changes")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText("Recent salary changes")).toBeInTheDocument();
  });
});

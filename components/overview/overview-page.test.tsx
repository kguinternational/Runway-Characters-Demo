import { fireEvent, render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDashboard } from "@/components/layout/dashboard-provider";
import { OverviewPage } from "@/components/overview/overview-page";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/components/layout/dashboard-provider", () => ({
  useDashboard: vi.fn(),
}));

const revenue = {
  total: 122_926,
  changePct: 3.3,
  refundCount: 0,
  dip: null,
  series: [],
};

describe("Overview capability map", () => {
  const openPanel = vi.fn();

  beforeEach(() => {
    openPanel.mockClear();
    vi.mocked(useDashboard).mockReturnValue({
      range: "30d",
      setRange: vi.fn(),
      panel: null,
      openPanel,
      closePanel: vi.fn(),
    });
    vi.mocked(useQuery)
      .mockReturnValueOnce(revenue)
      .mockReturnValueOnce([])
      .mockReturnValueOnce({
        open: 4,
        topTeam: { team: "Support", count: 3 },
      });
  });

  it("shows every Runway session tool with a manual path", () => {
    render(<OverviewPage />);

    for (const label of [
      "get_overview_insights",
      "get_revenue · set_date_range",
      "get_ticket_insights · get_ticket · update_ticket_status",
      "create_ticket",
      "open_panel",
      "click · scroll_to · highlight",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    expect(
      screen.getByRole("link", { name: /read revenue \+ change range/i }),
    ).toHaveAttribute("href", "/revenue#revenue-chart");
    expect(
      screen.getByRole("link", { name: /create a real support ticket/i }),
    ).toHaveAttribute("href", "/tickets#tickets-actions");
    expect(
      screen.getByRole("link", { name: /inspect and update the queue/i }),
    ).toHaveAttribute("href", "/tickets#tickets-table");
  });

  it("keeps details and page insights clickable without a Runway call", () => {
    render(<OverviewPage />);

    fireEvent.click(
      screen.getByRole("button", { name: /open an insight panel/i }),
    );
    expect(openPanel).toHaveBeenLastCalledWith({
      title: "Live dashboard detail",
      body: "No refund anomaly is visible in the current 30-day data.",
    });

    fireEvent.click(
      screen.getByRole("button", { name: /read the overview insight/i }),
    );
    expect(openPanel).toHaveBeenLastCalledWith({
      title: "Overview insight",
      body: "$122,926 in 30-day revenue, 3.3% versus the previous period, 0 refund flags, and 4 open tickets. Support owns the largest queue with 3.",
    });
  });
});

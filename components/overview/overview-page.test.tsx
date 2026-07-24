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
      .mockReturnValueOnce(4);
  });

  it("shows every Runway session tool with a manual path", () => {
    render(<OverviewPage />);

    for (const label of [
      "get_revenue · set_date_range",
      "create_ticket",
      "click · open detail",
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
  });

  it("keeps details and page insights clickable without a Runway call", () => {
    render(<OverviewPage />);

    fireEvent.click(
      screen.getByRole("button", { name: /open a dashboard detail/i }),
    );
    expect(openPanel).toHaveBeenLastCalledWith({
      title: "One anomaly found",
      body: "A refund dip is marked in the 30-day revenue view.",
    });

    fireEvent.click(
      screen.getByRole("button", { name: /get this page’s insight/i }),
    );
    expect(openPanel).toHaveBeenLastCalledWith({
      title: "Overview insight",
      body: "$122,926 in 30-day revenue and 4 open tickets. Open Revenue for the refund detail.",
    });
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDashboard } from "@/components/layout/dashboard-provider";
import { OverviewPage } from "@/components/overview/overview-page";
import {
  DEMO_TICKETS,
  getDemoRevenue,
  getTicketInsights,
} from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";

vi.mock("@/components/layout/dashboard-provider", () => ({
  useDashboard: vi.fn(),
}));

const revenue = getDemoRevenue("30d");
const tickets = [...DEMO_TICKETS].reverse();
const ticketInsights = getTicketInsights(tickets);

describe("Overview capability map", () => {
  const openPanel = vi.fn();

  beforeEach(() => {
    openPanel.mockClear();
    vi.mocked(useDashboard).mockReturnValue({
      range: "30d",
      setRange: vi.fn(),
      ticketFilter: "all",
      setTicketFilter: vi.fn(),
      tickets,
      ticketInsights,
      createTicket: vi.fn(),
      updateTicketStatus: vi.fn(),
      refreshTickets: vi.fn(),
      panel: null,
      openPanel,
      closePanel: vi.fn(),
    });
  });

  it("shows every Runway session tool with a manual path", () => {
    render(<OverviewPage />);

    for (const label of [
      "get_overview_insights",
      "get_revenue · set_date_range",
      "get_ticket_insights · get_ticket · filter_tickets · update_ticket_status · refresh_tickets",
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
      screen.getByRole("link", { name: /create a demo support ticket/i }),
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
      title: "Demo dashboard detail",
      body: `${formatCurrency(revenue.dip!.amount)} is marked as a refund in the 30-day revenue view.`,
    });

    fireEvent.click(
      screen.getByRole("button", { name: /read the overview insight/i }),
    );
    expect(openPanel).toHaveBeenLastCalledWith({
      title: "Overview insight",
      body: `${formatCurrency(revenue.total)} in 30-day revenue, ${revenue.changePct}% versus the previous period, ${revenue.refundCount} refund flags, and ${ticketInsights.open} open tickets. ${ticketInsights.topTeam!.team} owns the largest queue with ${ticketInsights.topTeam!.count}.`,
    });
  });
});

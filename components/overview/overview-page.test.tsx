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

describe("Overview tool examples", () => {
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

  it("clearly separates every Runway session tool with a manual path", () => {
    render(<OverviewPage />);

    expect(
      screen.getByRole("heading", { name: "Changes what you see." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Gives Nova something to say." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Browser only")).toBeInTheDocument();
    expect(screen.getByText("Returns data")).toBeInTheDocument();

    for (const label of [
      "get_overview_insights",
      "get_revenue",
      "get_ticket_insights",
      "get_ticket",
      "create_ticket",
      "update_ticket_status",
      "set_date_range",
      "filter_tickets",
      "open_panel",
      "refresh_tickets",
      "click",
      "scroll_to",
      "highlight",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    expect(
      screen.getByRole("link", { name: /show 30 days of collections/i }),
    ).toHaveAttribute("href", "/revenue#revenue-chart");
    expect(
      screen.getByRole("link", { name: /show only financial tasks/i }),
    ).toHaveAttribute("href", "/tickets#tickets-actions");
    expect(
      screen.getByRole("link", { name: /add a financial task/i }),
    ).toHaveAttribute("href", "/tickets#new-ticket");
    expect(
      screen.getByRole("link", { name: /resolve task #4803/i }),
    ).toHaveAttribute("href", "/tickets#ticket-status-4803");
  });

  it("keeps details and page insights clickable without a Runway call", () => {
    render(<OverviewPage />);

    fireEvent.click(
      screen.getByRole("button", { name: /open the rent roll audit details/i }),
    );
    expect(openPanel).toHaveBeenLastCalledWith({
      title: "Rent Roll Mismatch",
      body: `A rent roll summation variance of ${formatCurrency(revenue.dip!.amount)} is flagged in the monthly pro forma view.`,
    });

    fireEvent.click(
      screen.getByRole("button", { name: /give me the deal summary brief/i }),
    );
    expect(openPanel).toHaveBeenLastCalledWith({
      title: "Acquisition Overview",
      body: `${formatCurrency(revenue.total)} in monthly base rent, ${revenue.changePct}% versus the previous period, ${revenue.refundCount} audit variance flags, and ${ticketInsights.open} active due diligence tasks. The Physical department has the largest workload with ${ticketInsights.topTeam!.count} tasks.`,
    });
  });
});

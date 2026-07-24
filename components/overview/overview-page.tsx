"use client";

import { BadgeAlert, CreditCard, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";

import { useDashboard } from "@/components/layout/dashboard-provider";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { api } from "@/convex/_generated/api";
import { formatCurrency } from "@/lib/utils";

export function OverviewPage() {
  const { openPanel } = useDashboard();
  const revenue = useQuery(api.revenue.getRevenue, { range: "30d" });
  const tickets = useQuery(api.tickets.listRecent, { limit: 4 });
  const ticketInsights = useQuery(api.tickets.getInsights);
  const openCount = ticketInsights?.open;
  const refundCount = revenue?.refundCount;
  const overviewInsight =
    revenue && ticketInsights
      ? `${formatCurrency(revenue.total)} in 30-day revenue, ${revenue.changePct}% versus the previous period, ${revenue.refundCount} refund flags, and ${ticketInsights.open} open tickets.${
          ticketInsights.topTeam
            ? ` ${ticketInsights.topTeam.team} owns the largest queue with ${ticketInsights.topTeam.count}.`
            : ""
        }`
      : "The live overview data is still loading.";

  return (
    <div id="overview-page" data-avatar-target="overview-page">
      <PageHeader
        eyebrow="Live operations · Dubai"
        title="Your support signal."
        description="Open any card yourself, or ask Nova to navigate and take the same actions."
      />

      <section
        id="overview-metrics"
        data-avatar-target="overview-metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <MetricCard
          id="metric-revenue"
          eyebrow="30-day revenue"
          value={revenue ? formatCurrency(revenue.total) : undefined}
          detail={revenue ? `${revenue.changePct}% vs previous period` : "Loading"}
          icon={CreditCard}
          trend={revenue && revenue.changePct < 0 ? "down" : "up"}
          onClick={() =>
            openPanel({
              title: "Revenue snapshot",
              body: revenue
                ? `${formatCurrency(revenue.total)} over 30 days, ${revenue.changePct}% versus the previous period.`
                : "Revenue is still loading.",
            })
          }
        />
        <MetricCard
          id="metric-refunds"
          eyebrow="Refunds flagged"
          value={refundCount === undefined ? undefined : String(refundCount)}
          detail="Marked in live Convex rows"
          icon={BadgeAlert}
          trend={refundCount ? "down" : "neutral"}
          onClick={() =>
            openPanel({
              title: "Refund flags",
              body: `${refundCount ?? 0} refund rows are marked in the current 30-day period.`,
            })
          }
        />
        <MetricCard
          id="metric-tickets"
          eyebrow="Tickets open"
          value={openCount === undefined ? undefined : String(openCount)}
          detail="Updates from live Convex data"
          icon={TicketCheck}
          trend="neutral"
          onClick={() =>
            openPanel({
              title: "Support queue",
              body: `${openCount ?? 0} tickets are currently open. Visit Tickets to inspect or create one.`,
            })
          }
          className="sm:col-span-2 xl:col-span-1"
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
        <Card
          id="overview-activity"
          data-avatar-target="overview-activity"
          className="overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-[var(--line)] p-5 sm:px-6">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                Recent activity
              </p>
              <h2 className="mt-2 text-xl font-semibold">Latest tickets</h2>
            </div>
            <Link
              id="overview-view-tickets"
              data-avatar-target="overview-view-tickets"
              href="/tickets"
              className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {tickets?.map((ticket) => (
              <button
                key={ticket.ticketId}
                id={`overview-ticket-${ticket.ticketId}`}
                data-avatar-target={`overview-ticket-${ticket.ticketId}`}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[var(--surface-raised)] sm:px-6"
                onClick={() =>
                  openPanel({
                    title: `Ticket #${ticket.ticketId}`,
                    body: `${ticket.subject} · ${ticket.team} · ${ticket.status}.`,
                  })
                }
              >
                <span className="font-mono text-xs text-[var(--muted)]">
                  #{ticket.ticketId}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {ticket.subject}
                </span>
                <StatusPill tone={ticket.status === "open" ? "warning" : "positive"}>
                  {ticket.status}
                </StatusPill>
              </button>
            ))}
          </div>
        </Card>

        <Card
          id="overview-quick-actions"
          data-avatar-target="overview-quick-actions"
          className="p-5 sm:p-6"
        >
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--muted)]">
            Nova capability map
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Every function is clickable.
          </h2>
          <div className="mt-5 grid gap-2">
            <button
              id="overview-insight"
              data-avatar-target="overview-insight"
              className="rounded-xl bg-[var(--ink)] px-4 py-3 text-left text-[var(--paper)]"
              onClick={() =>
                openPanel({
                  title: "Overview insight",
                  body: overviewInsight,
                })
              }
            >
              <span className="block text-sm font-semibold">
                Read the overview insight
              </span>
              <span className="mt-1 block font-mono text-[0.56rem] uppercase tracking-[0.12em] opacity-55">
                get_overview_insights
              </span>
            </button>
            <Link
              id="overview-open-revenue"
              data-avatar-target="overview-open-revenue"
              href="/revenue#revenue-chart"
              className="rounded-xl border border-[var(--line)] px-4 py-3"
            >
              <span className="block text-sm font-semibold">
                Read revenue + change range
              </span>
              <span className="mt-1 block font-mono text-[0.56rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                get_revenue · set_date_range
              </span>
            </Link>
            <Link
              id="overview-open-tickets"
              data-avatar-target="overview-open-tickets"
              href="/tickets#tickets-table"
              className="rounded-xl border border-[var(--line)] px-4 py-3"
            >
              <span className="block text-sm font-semibold">
                Inspect and update the queue
              </span>
              <span className="mt-1 block font-mono text-[0.56rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                get_ticket_insights · get_ticket · filter_tickets ·
                update_ticket_status
              </span>
            </Link>
            <Link
              id="overview-create-ticket"
              data-avatar-target="overview-create-ticket"
              href="/tickets#tickets-actions"
              className="rounded-xl border border-[var(--line)] px-4 py-3"
            >
              <span className="block text-sm font-semibold">
                Create a real support ticket
              </span>
              <span className="mt-1 block font-mono text-[0.56rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                create_ticket
              </span>
            </Link>
            <button
              id="overview-open-panel"
              data-avatar-target="overview-open-panel"
              className="rounded-xl border border-[var(--line)] px-4 py-3 text-left"
              onClick={() =>
                openPanel({
                  title: "Live dashboard detail",
                  body: revenue?.dip
                    ? `${formatCurrency(revenue.dip.amount)} is marked as a refund in the 30-day revenue view.`
                    : "No refund anomaly is visible in the current 30-day data.",
                })
              }
            >
              <span className="block text-sm font-semibold">
                Open an insight panel
              </span>
              <span className="mt-1 block font-mono text-[0.56rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                open_panel
              </span>
            </button>
            <a
              id="overview-page-actions"
              data-avatar-target="overview-page-actions"
              href="#overview-activity"
              className="rounded-xl border border-[var(--line)] px-4 py-3"
            >
              <span className="block text-sm font-semibold">
                Preview page actions
              </span>
              <span className="mt-1 block font-mono text-[0.56rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                click · scroll_to · highlight
              </span>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}

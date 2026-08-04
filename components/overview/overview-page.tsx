"use client";

import { BadgeAlert, CreditCard, TicketCheck } from "lucide-react";
import Link from "next/link";

import { useDashboard } from "@/components/layout/dashboard-provider";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { ToolExamples } from "@/components/overview/tool-examples";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { getDemoRevenue } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";

export function OverviewPage() {
  const { openPanel, tickets, ticketInsights } = useDashboard();
  const revenue = getDemoRevenue("30d");
  const recentTickets = tickets.slice(0, 4);
  const overviewInsight = `${formatCurrency(revenue.total)} in monthly base rent, ${revenue.changePct}% versus the previous period, ${revenue.refundCount} audit variance flags, and ${ticketInsights.open} active due diligence tasks.${
    ticketInsights.topTeam
      ? ` The ${ticketInsights.topTeam.team === "Billing" ? "Financial" : ticketInsights.topTeam.team === "Support" ? "Legal" : "Physical"} department has the largest workload with ${ticketInsights.topTeam.count} tasks.`
      : ""
  }`;
  const refundInsight = revenue.dip
    ? `A rent roll summation variance of ${formatCurrency(revenue.dip.amount)} is flagged in the monthly pro forma view.`
    : "No audit variance is visible in the current monthly projections.";

  return (
    <div id="overview-page" data-avatar-target="overview-page">
      <PageHeader
        eyebrow="Acquisition Command Center · West Palm Beach"
        title="Forum Buildings Deal Room."
        description="Open any card yourself, or ask Nova to navigate and explain the acquisition metrics."
      />

      <section
        id="overview-metrics"
        data-avatar-target="overview-metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <MetricCard
          id="metric-revenue"
          eyebrow="Monthly Base Rent"
          value={formatCurrency(revenue.total)}
          detail="Stated $430k vs Audited $449k"
          icon={CreditCard}
          trend={revenue.changePct < 0 ? "down" : "up"}
          onClick={() =>
            openPanel({
              title: "Base Rent Reconciliation",
              body: `Audited occupied base rent of ${formatCurrency(revenue.total)} (annualized $5.39M) reflects the actual sum of active leases, uncovering a +$18,823/month under-reporting mismatch.`,
            })
          }
        />
        <MetricCard
          id="metric-refunds"
          eyebrow="Audit Surpluses"
          value={String(revenue.refundCount)}
          detail="11,336 sqft & $18.8k/mo missing"
          icon={BadgeAlert}
          trend={revenue.refundCount ? "up" : "neutral"}
          onClick={() =>
            openPanel({
              title: "Rent Roll Audit Discrepancies",
              body: `The seller's sheet omitted crucial 10th-floor, fiber, and parking leases from the summation formulas, creating a +11,336 sqft and +$18.8k/month gap that works to our favor.`,
            })
          }
        />
        <MetricCard
          id="metric-tickets"
          eyebrow="Active Due Diligence"
          value={String(ticketInsights.open)}
          detail="Checklist of critical tasks"
          icon={TicketCheck}
          trend="neutral"
          onClick={() =>
            openPanel({
              title: "Due Diligence Checklist",
              body: `${ticketInsights.open} active checklist items remaining across Legal, Financial, and Physical categories.`,
            })
          }
          className="sm:col-span-2 xl:col-span-1"
        />
      </section>
 
      <ToolExamples
        overviewInsight={overviewInsight}
        refundInsight={refundInsight}
      />

      <Card
        id="overview-activity"
        data-avatar-target="overview-activity"
        className="mt-5 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] p-5 sm:px-6">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--muted)]">
              Recent activity
            </p>
            <h2 className="mt-2 text-xl font-semibold">Latest tasks</h2>
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
          {recentTickets.map((ticket) => (
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
    </div>
  );
}

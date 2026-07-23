"use client";

import { CreditCard, TicketCheck, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";

import { useDashboard } from "@/components/layout/dashboard-provider";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import {
  getOpenCountRef,
  getRevenueRef,
  listRecentTicketsRef,
} from "@/lib/convex-functions";
import type { RevenueResult, TicketRecord } from "@/lib/types";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";

export function OverviewPage() {
  const { openPanel } = useDashboard();
  const revenue = useQuery(getRevenueRef, { range: "30d" }) as RevenueResult | undefined;
  const tickets = useQuery(listRecentTicketsRef, { limit: 4 }) as TicketRecord[] | undefined;
  const openCount = useQuery(getOpenCountRef, {}) as number | undefined;
  const activeAccounts = useMemo(
    () =>
      revenue
        ? Math.round(
            revenue.series.reduce(
              (total, point) => total + Math.max(point.amount, 0),
              0,
            ) / 37.5,
          )
        : undefined,
    [revenue],
  );

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
          id="metric-accounts"
          eyebrow="Active accounts"
          value={activeAccounts ? formatCompactNumber(activeAccounts) : undefined}
          detail="Derived from settled volume"
          icon={Users}
          trend="up"
          onClick={() =>
            openPanel({
              title: "Active accounts",
              body: `${activeAccounts ?? 0} accounts contributed settled volume in this demo period.`,
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
            Clickable actions
          </p>
          <h2 className="mt-2 text-xl font-semibold">Go straight to the work.</h2>
          <div className="mt-5 grid gap-2">
            <Link
              id="overview-open-revenue"
              data-avatar-target="overview-open-revenue"
              href="/revenue"
              className="rounded-xl bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--paper)]"
            >
              Investigate revenue
            </Link>
            <Link
              id="overview-open-tickets"
              data-avatar-target="overview-open-tickets"
              href="/tickets"
              className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-semibold"
            >
              Open support queue
            </Link>
            <button
              id="overview-alerts"
              data-avatar-target="overview-alerts"
              className="rounded-xl border border-[var(--line)] px-4 py-3 text-left text-sm font-semibold"
              onClick={() =>
                openPanel({
                  title: "One anomaly found",
                  body: "A refund dip is marked in the 30-day revenue view.",
                })
              }
            >
              Review alerts
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

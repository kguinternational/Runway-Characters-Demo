import type {
  RevenuePoint,
  RevenueRange,
  RevenueResult,
  TicketInsights,
  TicketRecord,
} from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1_000;
const DEMO_END_DATE = Date.UTC(2026, 6, 24);
const HISTORY_DAYS = 180;
const CHART_DAYS = 90;

const DAYS_BY_RANGE: Record<RevenueRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function round(value: number, precision: number) {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}

function total(rows: Array<{ amount: number }>) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

export const DEMO_REVENUE: RevenuePoint[] = Array.from(
  { length: HISTORY_DAYS },
  (_, index) => {
    const daysBeforeEnd = HISTORY_DAYS - 1 - index;
    const chartIndex = index - (HISTORY_DAYS - CHART_DAYS);
    const timestamp = DEMO_END_DATE - daysBeforeEnd * DAY_MS;
    const date = new Date(timestamp);

    if (daysBeforeEnd === 14) {
      return {
        date: date.toISOString().slice(0, 10),
        amount: -18_823,
        refunded: true,
      };
    }

    const weekdayAdjustment = [-220, 40, 110, 145, 210, 270, -90][
      date.getUTCDay()
    ];
    const wave = Math.round(
      Math.sin(chartIndex / 4.2) * 170 +
        Math.cos(chartIndex / 9.5) * 85,
    );

    return {
      date: date.toISOString().slice(0, 10),
      amount: 14_346 + chartIndex * 15 + weekdayAdjustment + wave,
      refunded: false,
    };
  },
);

export const DEMO_TICKETS: TicketRecord[] = [
  {
    ticketId: 4803,
    subject: "Verify Crown Castle Fiber contract ($8,485.71/mo missing from summaries)",
    team: "Billing",
    status: "open",
    createdAt: Date.UTC(2026, 6, 15, 9, 15),
  },
  {
    ticketId: 4804,
    subject: "Audit Malan Law Firm lease for Suites 1005 & 1010 ($7,991.68/mo missing)",
    team: "Billing",
    status: "closed",
    createdAt: Date.UTC(2026, 6, 16, 11, 30),
  },
  {
    ticketId: 4805,
    subject: "Confirm West Palm Park parking garage license ($7,500/mo omitted)",
    team: "Billing",
    status: "open",
    createdAt: Date.UTC(2026, 6, 17, 14, 5),
  },
  {
    ticketId: 4806,
    subject: "Verify Kelley Fulton lease terms for Suite 1010 ($1,888.13/mo under-reported)",
    team: "Billing",
    status: "closed",
    createdAt: Date.UTC(2026, 6, 18, 8, 45),
  },
  {
    ticketId: 4807,
    subject: "Review Master Lease Option (MLO) clause for deferred Option Fee ($50k over 5 months)",
    team: "Support",
    status: "open",
    createdAt: Date.UTC(2026, 6, 19, 12, 20),
  },
  {
    ticketId: 4808,
    subject: "Check existing $20.5M mortgage interest-only terms (3.9% IO through Jan 2027)",
    team: "Support",
    status: "closed",
    createdAt: Date.UTC(2026, 6, 20, 10),
  },
  {
    ticketId: 4809,
    subject: "Confirm JC Coffey Foundation tax-exempt assignee clause for joint venture",
    team: "Support",
    status: "open",
    createdAt: Date.UTC(2026, 6, 21, 15, 40),
  },
  {
    ticketId: 4810,
    subject: "Deploy 3D Gaussian Splatting Digital Twin scanning equipment to Building A & B",
    team: "Product",
    status: "open",
    createdAt: Date.UTC(2026, 6, 22, 9, 50),
  },
  {
    ticketId: 4811,
    subject: "Integrate smart building sensors and AI thermostats to optimize HVAC cycles",
    team: "Product",
    status: "open",
    createdAt: Date.UTC(2026, 6, 23, 13, 10),
  },
  {
    ticketId: 4812,
    subject: "Verify parking garage structural integrity and Phase I environmental report",
    team: "Product",
    status: "open",
    createdAt: Date.UTC(2026, 6, 24, 8, 30),
  },
];

export function getDemoRevenue(range: RevenueRange): RevenueResult {
  const days = DAYS_BY_RANGE[range];
  const series = DEMO_REVENUE.slice(-days);
  const comparisonRows = DEMO_REVENUE.slice(-days);
  const previousRows = DEMO_REVENUE.slice(
    -(days * 2),
    -days,
  );

  const comparisonTotal = total(comparisonRows);
  const previousTotal = total(previousRows);
  const selectedTotal = round(total(series), 2);
  const dip =
    series
      .filter((point) => point.refunded || point.amount < 0)
      .sort((a, b) => a.amount - b.amount)[0] ?? null;
  const peakDay =
    series.length === 0
      ? null
      : series.reduce((peak, point) =>
          point.amount > peak.amount ? point : peak,
        );

  return {
    total: selectedTotal,
    changePct:
      previousTotal === 0
        ? 0
        : round(
            ((comparisonTotal - previousTotal) / Math.abs(previousTotal)) *
              100,
            1,
          ),
    dailyAverage: round(selectedTotal / series.length, 2),
    peakDay: peakDay
      ? {
          date: peakDay.date,
          amount: peakDay.amount,
        }
      : null,
    refundCount: series.filter(
      (point) => point.refunded || point.amount < 0,
    ).length,
    dip,
    series,
  };
}

export function getTicketInsights(tickets: TicketRecord[]): TicketInsights {
  const sortedTickets = [...tickets].sort(
    (a, b) => b.createdAt - a.createdAt || b.ticketId - a.ticketId,
  );
  const openTickets = sortedTickets.filter(
    (ticket) => ticket.status === "open",
  );
  const teamCounts = new Map<TicketRecord["team"], number>();

  for (const ticket of openTickets) {
    teamCounts.set(ticket.team, (teamCounts.get(ticket.team) ?? 0) + 1);
  }

  const byTeam = Array.from(teamCounts, ([team, count]) => ({
    team,
    count,
  })).sort((a, b) => b.count - a.count || a.team.localeCompare(b.team));

  return {
    total: sortedTickets.length,
    open: openTickets.length,
    closed: sortedTickets.length - openTickets.length,
    byTeam,
    topTeam: byTeam[0] ?? null,
    latestTicket: sortedTickets[0] ?? null,
  };
}

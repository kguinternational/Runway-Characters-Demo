import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

const DAY_MS = 24 * 60 * 60 * 1_000;
const HOUR_MS = 60 * 60 * 1_000;
const REVENUE_DAYS = 90;
const REFUND_DAYS_AGO = 14;

type RevenueSeed = Omit<Doc<"revenue">, "_id" | "_creationTime">;
type TicketSeed = Omit<Doc<"tickets">, "_id" | "_creationTime">;

function utcDayStart(timestamp: number) {
  const date = new Date(timestamp);
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
}

function toDateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function buildRevenueSeed(today: number): RevenueSeed[] {
  return Array.from({ length: REVENUE_DAYS }, (_, index) => {
    const daysAgo = REVENUE_DAYS - 1 - index;
    const timestamp = today - daysAgo * DAY_MS;
    const date = new Date(timestamp);

    if (daysAgo === REFUND_DAYS_AGO) {
      return {
        date: toDateKey(timestamp),
        amount: -2_850,
        refunded: true,
      };
    }

    const weekdayAdjustment = [-220, 40, 110, 145, 210, 270, -90][
      date.getUTCDay()
    ];
    const wave = Math.round(
      Math.sin(index / 4.2) * 170 + Math.cos(index / 9.5) * 85,
    );

    return {
      date: toDateKey(timestamp),
      amount: 3_350 + index * 12 + weekdayAdjustment + wave,
    };
  });
}

function buildTicketSeed(today: number): TicketSeed[] {
  return [
    {
      ticketId: 4_798,
      subject: "Invoice export contains duplicate line items",
      team: "Billing",
      status: "closed",
      createdAt: today - 8 * DAY_MS + 9 * HOUR_MS,
    },
    {
      ticketId: 4_799,
      subject: "Renewal charged the previous payment method",
      team: "Billing",
      status: "open",
      createdAt: today - 6 * DAY_MS + 13 * HOUR_MS,
    },
    {
      ticketId: 4_800,
      subject: "Revenue total differs from weekly payout",
      team: "Finance",
      status: "closed",
      createdAt: today - 4 * DAY_MS + 11 * HOUR_MS,
    },
    {
      ticketId: 4_801,
      subject: "Refund is missing from the customer timeline",
      team: "Billing",
      status: "open",
      createdAt: today - 3 * DAY_MS + 15 * HOUR_MS,
    },
    {
      ticketId: 4_802,
      subject: "CSV report uses the wrong account timezone",
      team: "Analytics",
      status: "open",
      createdAt: today - 2 * DAY_MS + 10 * HOUR_MS,
    },
    {
      ticketId: 4_803,
      subject: "Clarify tax shown on the latest invoice",
      team: "Billing",
      status: "open",
      createdAt: today - DAY_MS + 16 * HOUR_MS,
    },
    {
      ticketId: 4_804,
      subject: "Dashboard chart briefly shows stale totals",
      team: "Platform",
      status: "closed",
      createdAt: today + 9 * HOUR_MS,
    },
  ];
}

/**
 * Creates the complete demo dataset and is safe to run repeatedly.
 *
 * Revenue is reconciled to exactly 90 UTC calendar days so the marked refund
 * always sits exactly 14 days ago. Seeded tickets are upserted by ticketId;
 * tickets created during the live demo are intentionally preserved.
 */
export const seedDemo = mutation({
  args: {},
  returns: v.object({
    revenue: v.object({
      inserted: v.number(),
      updated: v.number(),
      deleted: v.number(),
    }),
    tickets: v.object({
      inserted: v.number(),
      updated: v.number(),
    }),
  }),
  handler: async (ctx) => {
    const today = utcDayStart(Date.now());
    const revenueSeed = buildRevenueSeed(today);
    const ticketSeed = buildTicketSeed(today);

    const existingRevenue = await ctx.db.query("revenue").collect();
    const revenueByDate = new Map(
      existingRevenue.map((row) => [row.date, row]),
    );
    const desiredRevenueDates = new Set(revenueSeed.map((row) => row.date));

    let revenueInserted = 0;
    let revenueUpdated = 0;
    let revenueDeleted = 0;

    for (const row of revenueSeed) {
      const existing = revenueByDate.get(row.date);
      if (existing) {
        await ctx.db.replace(existing._id, row);
        revenueUpdated += 1;
      } else {
        await ctx.db.insert("revenue", row);
        revenueInserted += 1;
      }
    }

    for (const row of existingRevenue) {
      if (!desiredRevenueDates.has(row.date)) {
        await ctx.db.delete(row._id);
        revenueDeleted += 1;
      }
    }

    let ticketsInserted = 0;
    let ticketsUpdated = 0;

    for (const row of ticketSeed) {
      const existing = await ctx.db
        .query("tickets")
        .withIndex("by_ticket_id", (q) => q.eq("ticketId", row.ticketId))
        .unique();

      if (existing) {
        await ctx.db.replace(existing._id, row);
        ticketsUpdated += 1;
      } else {
        await ctx.db.insert("tickets", row);
        ticketsInserted += 1;
      }
    }

    return {
      revenue: {
        inserted: revenueInserted,
        updated: revenueUpdated,
        deleted: revenueDeleted,
      },
      tickets: {
        inserted: ticketsInserted,
        updated: ticketsUpdated,
      },
    };
  },
});

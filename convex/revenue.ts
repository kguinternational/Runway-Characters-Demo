import { v } from "convex/values";

import { query } from "./_generated/server";

const DAY_MS = 24 * 60 * 60 * 1_000;

const rangeValidator = v.union(
  v.literal("7d"),
  v.literal("30d"),
  v.literal("90d"),
);

const pointValidator = v.object({
  date: v.string(),
  amount: v.number(),
  refunded: v.boolean(),
});

const dipValidator = v.union(
  v.object({
    date: v.string(),
    amount: v.number(),
    refunded: v.boolean(),
  }),
  v.null(),
);

const peakDayValidator = v.union(
  v.object({
    date: v.string(),
    amount: v.number(),
  }),
  v.null(),
);

const DAYS_BY_RANGE = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
} as const;

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

function sum(rows: Array<{ amount: number }>) {
  return rows.reduce((total, row) => total + row.amount, 0);
}

function round(value: number, precision: number) {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}

/**
 * Revenue for the selected chart range.
 *
 * The change compares the latest equally-sized period with the preceding one.
 * For the 90-day view the comparison is capped at 30 days so the intentionally
 * small 90-row demo dataset can still produce a real database-backed trend.
 */
export const getRevenue = query({
  args: { range: rangeValidator },
  returns: v.object({
    total: v.number(),
    changePct: v.number(),
    dailyAverage: v.number(),
    peakDay: peakDayValidator,
    refundCount: v.number(),
    dip: dipValidator,
    series: v.array(pointValidator),
  }),
  handler: async (ctx, { range }) => {
    const days = DAYS_BY_RANGE[range];
    const comparisonDays = Math.min(days, 30);
    const today = utcDayStart(Date.now());

    const rangeStart = toDateKey(today - (days - 1) * DAY_MS);
    const comparisonStart = toDateKey(
      today - (comparisonDays - 1) * DAY_MS,
    );
    const previousStart = toDateKey(
      today - (comparisonDays * 2 - 1) * DAY_MS,
    );
    const previousEnd = toDateKey(today - comparisonDays * DAY_MS);
    const todayKey = toDateKey(today);
    const readStart = rangeStart < previousStart ? rangeStart : previousStart;

    const rows = await ctx.db
      .query("revenue")
      .withIndex("by_date", (q) =>
        q.gte("date", readStart).lte("date", todayKey),
      )
      .collect();

    const selectedRows = rows.filter((row) => row.date >= rangeStart);
    const comparisonRows = rows.filter((row) => row.date >= comparisonStart);
    const previousRows = rows.filter(
      (row) => row.date >= previousStart && row.date <= previousEnd,
    );

    const currentComparisonTotal = sum(comparisonRows);
    const previousComparisonTotal = sum(previousRows);
    const changePct =
      previousComparisonTotal === 0
        ? 0
        : round(
            ((currentComparisonTotal - previousComparisonTotal) /
              Math.abs(previousComparisonTotal)) *
              100,
            1,
          );

    const series = selectedRows.map((row) => ({
      date: row.date,
      amount: row.amount,
      refunded: row.refunded ?? false,
    }));

    const dip = series
      .filter((point) => point.refunded || point.amount < 0)
      .sort((a, b) => a.amount - b.amount)[0] ?? null;

    const total = round(sum(selectedRows), 2);
    const peakPoint =
      series.length === 0
        ? null
        : series.reduce((peak, point) =>
            point.amount > peak.amount ? point : peak,
          );

    return {
      total,
      changePct,
      dailyAverage: series.length === 0 ? 0 : round(total / series.length, 2),
      peakDay: peakPoint
        ? { date: peakPoint.date, amount: peakPoint.amount }
        : null,
      refundCount: series.filter(
        (point) => point.refunded || point.amount < 0,
      ).length,
      dip,
      series,
    };
  },
});

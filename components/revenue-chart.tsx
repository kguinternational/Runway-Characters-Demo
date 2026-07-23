"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import type { RevenueRange, RevenueResult } from "@/lib/types";
import { cn, formatCurrency, formatShortDate } from "@/lib/utils";

const ranges: Array<{ value: RevenueRange; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export function RevenueChart({
  range,
  onRangeChange,
  data,
  loading,
}: {
  range: RevenueRange;
  onRangeChange: (range: RevenueRange) => void;
  data?: RevenueResult;
  loading: boolean;
}) {
  const chartData = data?.series ?? [];
  const dip = data?.dip ?? null;

  return (
    <section
      id="revenue-chart"
      data-avatar-target="revenue-chart"
      className="reveal-up reveal-up-delay-2 overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_22px_70px_rgba(21,26,25,0.07)]"
      aria-labelledby="revenue-chart-title"
    >
      <div className="flex flex-col gap-5 border-b border-[var(--line)] px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2.5">
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Net revenue
            </p>
            {dip ? (
              <StatusPill tone="danger">Refund marked</StatusPill>
            ) : (
              <StatusPill tone="positive">Live from Convex</StatusPill>
            )}
          </div>
          <h2
            id="revenue-chart-title"
            className="text-[1.7rem] font-semibold tracking-[-0.045em] text-[var(--ink)]"
          >
            Revenue pulse
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Daily settled revenue. Refunds remain negative so changes are easy to audit.
          </p>
        </div>

        <div
          className="flex w-fit rounded-full border border-[var(--line)] bg-[var(--surface-raised)] p-1"
          aria-label="Revenue date range"
        >
          {ranges.map((option) => (
            <Button
              key={option.value}
              id={`range-${option.value}`}
              data-avatar-target={`range-${option.value}`}
              variant="ghost"
              size="sm"
              aria-pressed={range === option.value}
              className={cn(
                "h-8 px-3.5 text-[0.72rem]",
                range === option.value &&
                  "bg-[var(--ink)] text-[var(--paper)] shadow-sm hover:bg-[var(--ink)] hover:text-[var(--paper)]",
              )}
              onClick={() => onRangeChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative h-[330px] px-2 pb-3 pt-7 sm:px-5">
        {loading ? <ChartSkeleton /> : null}
        {!loading && chartData.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div>
              <p className="font-semibold text-[var(--ink)]">No revenue rows yet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Run the seed command after connecting the Convex deployment.
              </p>
            </div>
          </div>
        ) : null}
        {!loading && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 14, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--line)"
                strokeDasharray="4 5"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                tickFormatter={formatShortDate}
                tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
                tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              />
              <Tooltip
                cursor={{ stroke: "var(--line-strong)", strokeDasharray: "3 3" }}
                formatter={(value) => [formatCurrency(Number(value)), "Net revenue"]}
                labelFormatter={(label) => formatShortDate(String(label))}
                contentStyle={{
                  border: "1px solid var(--line-strong)",
                  borderRadius: "14px",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  boxShadow: "0 14px 36px rgba(13,18,16,.14)",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--chart)"
                strokeWidth={2.6}
                fill="url(#revenueFill)"
                activeDot={{ r: 5, strokeWidth: 3, stroke: "var(--surface)", fill: "var(--chart)" }}
                animationDuration={650}
              />
              {dip ? (
                <ReferenceDot
                  x={dip.date}
                  y={dip.amount}
                  r={6}
                  fill="var(--danger)"
                  stroke="var(--surface)"
                  strokeWidth={3}
                  ifOverflow="extendDomain"
                />
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {dip ? (
        <div className="mx-5 mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm sm:mx-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface)] font-mono text-xs font-bold text-[var(--danger)]">
              ↓
            </span>
            <p className="text-[var(--ink)]">
              <span className="font-semibold">Refund dip · {formatShortDate(dip.date)}</span>
              <span className="text-[var(--muted)]"> — the point Nova can investigate live.</span>
            </p>
          </div>
          <span className="font-mono text-sm font-semibold text-[var(--danger)]">
            {formatCurrency(dip.amount)}
          </span>
        </div>
      ) : null}
    </section>
  );
}

function ChartSkeleton() {
  return (
    <div className="absolute inset-7 animate-pulse rounded-2xl bg-[linear-gradient(180deg,var(--surface-raised),transparent)]">
      <svg viewBox="0 0 600 240" className="h-full w-full opacity-60" aria-hidden="true">
        <path
          d="M0 190 C60 170 90 182 145 128 S235 74 290 116 390 182 445 120 525 42 600 70"
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

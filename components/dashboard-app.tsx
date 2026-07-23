"use client";

import {
  BarChart3,
  Bell,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Command,
  CreditCard,
  DatabaseZap,
  Moon,
  Settings2,
  Sparkles,
  Sun,
  TicketCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  ConvexProvider,
  ConvexReactClient,
  useQuery,
} from "convex/react";

import { InfoPanel } from "@/components/info-panel";
import { NovaCard } from "@/components/nova-card";
import { RevenueChart } from "@/components/revenue-chart";
import { TicketsTable } from "@/components/tickets-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import {
  getOpenCountRef,
  getRevenueRef,
  listRecentTicketsRef,
} from "@/lib/convex-functions";
import type {
  InfoPanelState,
  RevenueRange,
  RevenueResult,
  TicketRecord,
} from "@/lib/types";
import {
  cn,
  formatCompactNumber,
  formatCurrency,
} from "@/lib/utils";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export function DashboardApp() {
  const convex = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [],
  );

  if (!convex) return <ConfigurationRequired />;

  return (
    <ConvexProvider client={convex}>
      <ConnectedDashboard />
    </ConvexProvider>
  );
}

function ConnectedDashboard() {
  const [range, setRange] = useState<RevenueRange>("90d");
  const [panel, setPanel] = useState<InfoPanelState | null>(null);
  const revenue = useQuery(getRevenueRef, { range }) as RevenueResult | undefined;
  const tickets = useQuery(listRecentTicketsRef, { limit: 7 }) as
    | TicketRecord[]
    | undefined;
  const openCount = useQuery(getOpenCountRef, {}) as number | undefined;

  const activeAccounts = useMemo(() => {
    if (!revenue?.series.length) return undefined;
    const positiveRevenue = revenue.series.reduce(
      (total, point) => total + Math.max(point.amount, 0),
      0,
    );
    return Math.round(positiveRevenue / 37.5);
  }, [revenue]);

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar />
      <main className="min-h-screen pb-[440px] sm:pb-[470px] md:ml-[218px] lg:pb-16 lg:pr-[390px]">
        <TopBar />
        <div className="mx-auto max-w-[1240px] px-4 pb-10 pt-6 sm:px-7 lg:px-8 lg:pt-8">
          <section className="reveal-up mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 font-mono text-[0.67rem] font-semibold uppercase tracking-[0.19em] text-[var(--muted)]">
                <span className="size-1.5 rounded-full bg-[var(--positive)]" />
                Live operations · Dubai
              </div>
              <h1 className="max-w-3xl text-[clamp(2.1rem,5vw,4.25rem)] font-semibold leading-[0.96] tracking-[-0.068em]">
                Revenue, with a pulse.
              </h1>
              <p className="mt-4 max-w-xl text-[0.98rem] leading-7 text-[var(--muted)]">
                Ask Nova what changed. She can see this screen, operate the dashboard,
                and answer from the live database.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill tone="positive" className="h-fit">
                <DatabaseZap className="size-3" />
                Convex synced
              </StatusPill>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.13em] text-[var(--muted-soft)]">
                Updated now
              </p>
            </div>
          </section>

          <section
            id="overview-metrics"
            data-avatar-target="overview-metrics"
            className="reveal-up reveal-up-delay-1 mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Key performance indicators"
          >
            <MetricCard
              eyebrow="Net revenue"
              value={revenue ? formatCurrency(revenue.total) : undefined}
              detail={
                revenue
                  ? `${Math.abs(revenue.changePct).toFixed(1)}% vs previous period`
                  : "Loading live totals"
              }
              icon={CreditCard}
              trend={revenue && revenue.changePct < 0 ? "down" : "up"}
            />
            <MetricCard
              eyebrow="Active accounts"
              value={
                activeAccounts === undefined
                  ? undefined
                  : formatCompactNumber(activeAccounts)
              }
              detail="Derived from settled volume"
              icon={Users}
              trend="up"
            />
            <MetricCard
              eyebrow="Tickets open"
              value={openCount === undefined ? undefined : String(openCount)}
              detail="Updates the moment Nova files one"
              icon={TicketCheck}
              trend="neutral"
              className="sm:col-span-2 xl:col-span-1"
            />
          </section>

          <RevenueChart
            range={range}
            onRangeChange={setRange}
            data={revenue}
            loading={revenue === undefined}
          />

          <div className="mt-5">
            <TicketsTable tickets={tickets} loading={tickets === undefined} />
          </div>
        </div>
      </main>

      <NovaCard onRangeChange={setRange} onPanelOpen={setPanel} />
      <InfoPanel panel={panel} onClose={() => setPanel(null)} />
    </div>
  );
}

function Sidebar() {
  const items = [
    { label: "Overview", icon: BarChart3, active: true },
    { label: "Revenue", icon: ChartNoAxesCombined, target: "revenue-chart" },
    { label: "Tickets", icon: TicketCheck, target: "tickets-table" },
    { label: "Settings", icon: Settings2 },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[218px] flex-col border-r border-white/8 bg-[#111514] text-[#f4f1e8] md:flex">
      <div className="flex h-[78px] items-center gap-3 border-b border-white/8 px-5">
        <div className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-[#101510] shadow-[0_9px_25px_rgba(201,244,79,.16)]">
          <Command className="size-[18px]" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[1.05rem] font-semibold leading-none tracking-[-0.04em]">
            Northstar
          </p>
          <p className="mt-1 font-mono text-[0.56rem] uppercase tracking-[0.15em] text-white/38">
            Signal room
          </p>
        </div>
      </div>

      <nav className="space-y-1 px-3 py-5" aria-label="Primary navigation">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() =>
              item.target
                ? document.getElementById(item.target)?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  })
                : undefined
            }
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
              item.active
                ? "bg-white/[0.09] text-white"
                : "text-white/48 hover:bg-white/[0.05] hover:text-white/80",
            )}
          >
            <item.icon className="size-4" />
            <span className="font-medium">{item.label}</span>
            {item.active ? (
              <span className="ml-auto size-1.5 rounded-full bg-[var(--accent)]" />
            ) : null}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <div className="dashboard-grid absolute inset-0 opacity-15" />
          <div className="relative">
            <Sparkles className="size-4 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-semibold">Nova is on call</p>
            <p className="mt-1 text-xs leading-5 text-white/42">
              Three live tool types. One conversation.
            </p>
          </div>
        </div>
        <button className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition hover:bg-white/5 hover:text-white/75">
          <CircleHelp className="size-4" />
          Demo guide
          <ChevronRight className="ml-auto size-3.5" />
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-[var(--line)] bg-[color:var(--paper)]/85 px-4 backdrop-blur-xl sm:px-7 lg:px-8">
      <div className="flex items-center gap-3 md:hidden">
        <div className="grid size-8 place-items-center rounded-xl bg-[var(--ink)] text-[var(--accent)]">
          <Command className="size-4" />
        </div>
        <span className="font-semibold tracking-[-0.04em]">Northstar</span>
      </div>
      <div className="hidden items-center gap-2 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-[var(--muted)] md:flex">
        <span>Workspace</span>
        <span className="text-[var(--muted-soft)]">/</span>
        <span className="text-[var(--ink)]">Revenue overview</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <Button
          id="theme-toggle"
          data-avatar-target="theme-toggle"
          variant="outline"
          size="icon"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={isDark}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <div className="ml-1 grid size-9 place-items-center rounded-full bg-[var(--ink)] text-xs font-semibold text-[var(--paper)]">
          SS
        </div>
      </div>
    </header>
  );
}

function MetricCard({
  eyebrow,
  value,
  detail,
  icon: Icon,
  trend,
  className,
}: {
  eyebrow: string;
  value?: string;
  detail: string;
  icon: typeof CreditCard;
  trend: "up" | "down" | "neutral";
  className?: string;
}) {
  return (
    <Card className={cn("metric-sheen min-h-[168px] p-5 sm:p-6", className)}>
      <div className="relative z-[1] flex h-full flex-col">
        <div className="flex items-start justify-between">
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[var(--muted)]">
            {eyebrow}
          </p>
          <span className="grid size-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--muted)]">
            <Icon className="size-4" />
          </span>
        </div>
        <div className="mt-auto">
          {value ? (
            <p className="text-[2rem] font-semibold leading-none tracking-[-0.055em]">
              {value}
            </p>
          ) : (
            <div className="h-8 w-28 animate-pulse rounded-lg bg-[var(--surface-raised)]" />
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
            {trend === "up" ? (
              <TrendingUp className="size-3.5 text-[var(--positive)]" />
            ) : trend === "down" ? (
              <TrendingDown className="size-3.5 text-[var(--danger)]" />
            ) : (
              <TicketCheck className="size-3.5 text-[var(--warning)]" />
            )}
            <span>{detail}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ConfigurationRequired() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-16">
      <div className="dashboard-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] size-[42rem] -translate-x-1/2 rounded-full bg-[var(--accent)]/20 blur-3xl" />
      <Card className="reveal-up relative z-10 w-full max-w-2xl overflow-hidden">
        <div className="border-b border-[var(--line)] p-6 sm:p-8">
          <StatusPill tone="warning">
            <DatabaseZap className="size-3" />
            One setup step remains
          </StatusPill>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
            Connect the live Convex data.
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-[var(--muted)]">
            The interface intentionally does not substitute mock data. Start the local
            Convex deployment, seed it, then reload this page.
          </p>
        </div>
        <div className="space-y-3 bg-[var(--surface-raised)]/55 p-6 sm:p-8">
          {[
            ["01", "npm run convex:dev"],
            ["02", "npm run convex:seed"],
            ["03", "npm run dev"],
          ].map(([step, command]) => (
            <div
              key={step}
              className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
            >
              <span className="font-mono text-xs font-semibold text-[var(--positive)]">
                {step}
              </span>
              <code className="font-mono text-sm text-[var(--ink)]">{command}</code>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}

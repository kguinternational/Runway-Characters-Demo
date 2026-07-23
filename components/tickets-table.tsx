import { ArrowUpRight, CircleCheck, Clock3 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import type { TicketRecord } from "@/lib/types";

export function TicketsTable({
  tickets,
  loading,
}: {
  tickets?: TicketRecord[];
  loading: boolean;
}) {
  return (
    <Card
      id="tickets-table"
      data-avatar-target="tickets-table"
      className="reveal-up reveal-up-delay-3 overflow-hidden"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-[var(--line)]">
        <div>
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Support queue
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
            Recent tickets
          </h2>
        </div>
        <button
          className="grid size-9 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
          aria-label="Open all tickets"
        >
          <ArrowUpRight className="size-4" />
        </button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[660px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--line)] font-mono text-[0.64rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                <th className="px-6 py-3.5 font-medium">Ticket</th>
                <th className="px-4 py-3.5 font-medium">Subject</th>
                <th className="px-4 py-3.5 font-medium">Team</th>
                <th className="px-6 py-3.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-[var(--line)] last:border-0">
                      <td colSpan={4} className="px-6 py-4">
                        <div className="h-5 animate-pulse rounded-full bg-[var(--surface-raised)]" />
                      </td>
                    </tr>
                  ))
                : null}
              {!loading && tickets?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center text-sm text-[var(--muted)]">
                    No tickets yet. Seed Convex to load the demo queue.
                  </td>
                </tr>
              ) : null}
              {!loading
                ? tickets?.map((ticket) => (
                    <tr
                      key={ticket.ticketId}
                      className="group border-b border-[var(--line)] text-sm transition-colors last:border-0 hover:bg-[var(--surface-raised)]/55"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-[var(--muted)]">
                        #{ticket.ticketId}
                      </td>
                      <td className="max-w-[360px] px-4 py-4 font-medium text-[var(--ink)]">
                        <span className="line-clamp-1">{ticket.subject}</span>
                      </td>
                      <td className="px-4 py-4 text-[var(--muted)]">{ticket.team}</td>
                      <td className="px-6 py-4 text-right">
                        <StatusPill tone={ticket.status === "open" ? "warning" : "positive"}>
                          {ticket.status === "open" ? (
                            <Clock3 className="size-3" />
                          ) : (
                            <CircleCheck className="size-3" />
                          )}
                          {ticket.status}
                        </StatusPill>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

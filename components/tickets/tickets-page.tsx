"use client";

import { Plus, SlidersHorizontal } from "lucide-react";
import { useQuery } from "convex/react";
import { useState } from "react";

import { useDashboard } from "@/components/layout/dashboard-provider";
import { PageHeader } from "@/components/layout/page-header";
import { NewTicketDialog } from "@/components/tickets/new-ticket-dialog";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

type Filter = "all" | "open" | "billing";

export function TicketsPage() {
  const { openPanel } = useDashboard();
  const tickets = useQuery(api.tickets.listRecent, { limit: 30 });
  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const filteredTickets = tickets?.filter((ticket) => {
    if (filter === "open") return ticket.status === "open";
    if (filter === "billing") return ticket.team === "Billing";
    return true;
  });

  return (
    <div id="tickets-page" data-avatar-target="tickets-page">
      <PageHeader
        eyebrow="Customer support"
        title="Work the queue."
        description="Filter, inspect, and create the same real tickets available to Nova’s server tool."
      />

      <section
        id="tickets-actions"
        data-avatar-target="tickets-actions"
        className="mb-5 flex flex-col gap-3 rounded-[1.4rem] border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div id="tickets-filters" data-avatar-target="tickets-filters" className="flex gap-1">
          {(["all", "open", "billing"] as const).map((value) => (
            <button
              key={value}
              id={`ticket-filter-${value}`}
              data-avatar-target={`ticket-filter-${value}`}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold capitalize",
                filter === value
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-raised)]",
              )}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            id="ticket-filter-help"
            data-avatar-target="ticket-filter-help"
            variant="outline"
            onClick={() =>
              openPanel({
                title: "Queue filters",
                body: "All shows every ticket, Open shows active work, and Billing narrows the owning team.",
              })
            }
          >
            <SlidersHorizontal className="size-4" />
            Filters
          </Button>
          <Button
            id="new-ticket"
            data-avatar-target="new-ticket"
            variant="accent"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4" />
            New ticket
          </Button>
        </div>
      </section>

      <TicketsTable
        tickets={filteredTickets}
        onTicketClick={(ticket) =>
          openPanel({
            title: `Ticket #${ticket.ticketId}`,
            body: `${ticket.subject} is ${ticket.status} and owned by ${ticket.team}.`,
          })
        }
      />

      <NewTicketDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(ticketId, subject, team) =>
          openPanel({
            title: `Ticket #${ticketId} created`,
            body: `${subject} is open and assigned to ${team}.`,
          })
        }
      />
    </div>
  );
}

import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const ticketValidator = v.object({
  ticketId: v.number(),
  subject: v.string(),
  team: v.string(),
  status: v.union(v.literal("open"), v.literal("closed")),
  createdAt: v.number(),
});

const statusValidator = v.union(v.literal("open"), v.literal("closed"));

const teamCountValidator = v.object({
  team: v.string(),
  count: v.number(),
});

export const createTicket = mutation({
  args: {
    subject: v.string(),
    team: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const subject = args.subject.trim();
    const team = args.team.trim();

    if (!subject || !team) {
      throw new Error("Ticket subject and team are required.");
    }

    if (subject.length > 180 || team.length > 60) {
      throw new Error("Ticket subject or team is too long.");
    }

    // Convex mutations are transactional, so concurrent calls cannot allocate
    // the same human-readable ticket number.
    const latest = await ctx.db
      .query("tickets")
      .withIndex("by_ticket_id")
      .order("desc")
      .first();
    const ticketId = (latest?.ticketId ?? 4_799) + 1;

    await ctx.db.insert("tickets", {
      ticketId,
      subject,
      team,
      status: "open",
      createdAt: Date.now(),
    });

    return ticketId;
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(ticketValidator),
  handler: async (ctx, { limit }) => {
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit ?? 8)));
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_created_at")
      .order("desc")
      .take(safeLimit);

    return tickets.map(({ ticketId, subject, team, status, createdAt }) => ({
      ticketId,
      subject,
      team,
      status,
      createdAt,
    }));
  },
});

export const getOpenCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const openTickets = await ctx.db
      .query("tickets")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    return openTickets.length;
  },
});

export const getInsights = query({
  args: {},
  returns: v.object({
    total: v.number(),
    open: v.number(),
    closed: v.number(),
    byTeam: v.array(teamCountValidator),
    topTeam: v.union(teamCountValidator, v.null()),
    latestTicket: v.union(ticketValidator, v.null()),
  }),
  handler: async (ctx) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_created_at")
      .order("desc")
      .take(100);

    const teamCounts = new Map<string, number>();
    for (const ticket of tickets) {
      if (ticket.status !== "open") continue;
      teamCounts.set(ticket.team, (teamCounts.get(ticket.team) ?? 0) + 1);
    }

    const byTeam = Array.from(teamCounts, ([team, count]) => ({
      team,
      count,
    })).sort((a, b) => b.count - a.count || a.team.localeCompare(b.team));

    const latestTicket = tickets[0]
      ? {
          ticketId: tickets[0].ticketId,
          subject: tickets[0].subject,
          team: tickets[0].team,
          status: tickets[0].status,
          createdAt: tickets[0].createdAt,
        }
      : null;

    const open = tickets.filter((ticket) => ticket.status === "open").length;

    return {
      total: tickets.length,
      open,
      closed: tickets.length - open,
      byTeam,
      topTeam: byTeam[0] ?? null,
      latestTicket,
    };
  },
});

export const getByTicketId = query({
  args: { ticketId: v.number() },
  returns: v.union(ticketValidator, v.null()),
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ticket_id", (q) => q.eq("ticketId", ticketId))
      .unique();

    if (!ticket) return null;

    return {
      ticketId: ticket.ticketId,
      subject: ticket.subject,
      team: ticket.team,
      status: ticket.status,
      createdAt: ticket.createdAt,
    };
  },
});

export const updateStatus = mutation({
  args: {
    ticketId: v.number(),
    status: statusValidator,
  },
  returns: ticketValidator,
  handler: async (ctx, { ticketId, status }) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ticket_id", (q) => q.eq("ticketId", ticketId))
      .unique();

    if (!ticket) {
      throw new Error(`Ticket #${ticketId} was not found.`);
    }

    await ctx.db.patch(ticket._id, { status });

    return {
      ticketId: ticket.ticketId,
      subject: ticket.subject,
      team: ticket.team,
      status,
      createdAt: ticket.createdAt,
    };
  },
});

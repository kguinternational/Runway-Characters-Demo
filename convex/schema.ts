import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  revenue: defineTable({
    date: v.string(),
    amount: v.number(),
    refunded: v.optional(v.boolean()),
  }).index("by_date", ["date"]),

  tickets: defineTable({
    ticketId: v.number(),
    subject: v.string(),
    team: v.string(),
    status: v.union(v.literal("open"), v.literal("closed")),
    createdAt: v.number(),
  })
    .index("by_ticket_id", ["ticketId"])
    .index("by_created_at", ["createdAt"])
    .index("by_status", ["status"]),
});

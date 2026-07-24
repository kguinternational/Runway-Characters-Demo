import { clientTool, pageActionTools } from "@runwayml/avatars-react/api";
import type { RealtimeSessionCreateParams } from "@runwayml/sdk/resources/realtime-sessions";
import { z } from "zod";

export const setDateRangeTool = clientTool("set_date_range", {
  description:
    "Change the visible Revenue chart to 7, 30, or 90 days when the user asks for that range. This browser action returns no data.",
  schema: z.object({ range: z.enum(["7d", "30d", "90d"]) }),
});

export const openPanelTool = clientTool("open_panel", {
  description:
    "Open the dashboard info panel when the user asks to show a short insight or explanation on screen. This browser action returns no data.",
  schema: z.object({
    title: z.string(),
    body: z.string(),
  }),
});

export const sessionTools = [
  ...pageActionTools,
  {
    ...setDateRangeTool,
    parameters: [
      {
        name: "range",
        type: "string",
        enum: ["7d", "30d", "90d"],
        description: "The visible range: 7d, 30d, or 90d.",
      },
    ],
  },
  {
    ...openPanelTool,
    parameters: [
      {
        name: "title",
        type: "string",
        description: "A short title for the visible panel.",
      },
      {
        name: "body",
        type: "string",
        description: "A concise insight or explanation to show in the panel.",
      },
    ],
  },
  {
    type: "backend_rpc",
    name: "get_overview_insights",
    description:
      "Get a live dashboard brief from Convex when the user asks about the overview, KPIs, priorities, or overall business health. Returns revenue and support queue facts for the spoken answer.",
    timeoutSeconds: 8,
  },
  {
    type: "backend_rpc",
    name: "get_revenue",
    description:
      "Get live revenue facts from Convex when the user asks about revenue, trends, comparisons, averages, peak days, or refunds. Returns the selected range total, change, daily average, peak day, refund count, and refund dip.",
    timeoutSeconds: 8,
    parameters: [
      {
        name: "range",
        type: "string",
        enum: ["7d", "30d", "90d"],
        description: "The database range: 7d, 30d, or 90d.",
      },
    ],
  },
  {
    type: "backend_rpc",
    name: "get_ticket_insights",
    description:
      "Get live support queue facts from Convex when the user asks about ticket workload, open or closed counts, team ownership, or the latest ticket.",
    timeoutSeconds: 8,
  },
  {
    type: "backend_rpc",
    name: "get_ticket",
    description:
      "Look up one real support ticket in Convex when the user asks about a specific ticket number. Returns an object whose ticket is the matching record or null when it does not exist.",
    timeoutSeconds: 8,
    parameters: [
      {
        name: "ticketId",
        type: "integer",
        description: "The numeric ticket ID to look up.",
      },
    ],
  },
  {
    type: "backend_rpc",
    name: "create_ticket",
    description:
      "Create a real support ticket in Convex only when the user explicitly asks to create, file, or log one. Returns the new ticket ID.",
    timeoutSeconds: 8,
    parameters: [
      { name: "subject", type: "string", description: "Ticket subject." },
      {
        name: "team",
        type: "string",
        enum: ["Billing", "Support", "Product"],
        description: "Owning team.",
      },
    ],
  },
  {
    type: "backend_rpc",
    name: "update_ticket_status",
    description:
      "Close or reopen a real support ticket in Convex only when the user explicitly asks to change its status. Returns the updated ticket.",
    timeoutSeconds: 8,
    parameters: [
      {
        name: "ticketId",
        type: "integer",
        description: "The numeric ticket ID to update.",
      },
      {
        name: "status",
        type: "string",
        enum: ["open", "closed"],
        description: "The new ticket status.",
      },
    ],
  },
] as NonNullable<RealtimeSessionCreateParams["tools"]>;

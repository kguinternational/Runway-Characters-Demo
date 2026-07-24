import { clientTool, pageActionTools } from "@runwayml/avatars-react/api";
import type { RealtimeSessionCreateParams } from "@runwayml/sdk/resources/realtime-sessions";
import { z } from "zod";

export const setDateRangeTool = clientTool("set_date_range", {
  description: "Change the visible range on the Revenue page.",
  schema: z.object({ range: z.enum(["7d", "30d", "90d"]) }),
});

export const openPanelTool = clientTool("open_panel", {
  description: "Open an information panel on the dashboard.",
  schema: z.object({
    title: z.string(),
    body: z.string(),
  }),
});

// Zod validates browser events. Parameters tell the model what arguments to send.
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
      { name: "title", type: "string", description: "Short panel title." },
      { name: "body", type: "string", description: "Short panel message." },
    ],
  },
  {
    type: "backend_rpc",
    name: "get_revenue",
    description:
      "Read the live revenue total, change, and refund dip from Convex. Use this for any revenue question instead of estimating from the chart.",
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
    name: "create_ticket",
    description:
      "Create a real support ticket in Convex when the user asks. Return and speak the ticket ID, then open a confirmation panel.",
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
] as NonNullable<RealtimeSessionCreateParams["tools"]>;

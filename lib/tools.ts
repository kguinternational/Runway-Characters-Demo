import { clientTool, pageActionTools } from "@runwayml/avatars-react/api";
import type { RealtimeSessionCreateParams } from "@runwayml/sdk/resources/realtime-sessions";
import { z } from "zod";

export const setDateRangeTool = clientTool("set_date_range", {
  description:
    "After telling the user what you are changing, show 7, 30, or 90 days on the visible Revenue chart.",
  schema: z.object({ range: z.enum(["7d", "30d", "90d"]) }),
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
    type: "backend_rpc",
    name: "get_revenue",
    description:
      "Read the live revenue total, change, and refund dip from Convex when the user asks about revenue or chart insights. Speak the returned values instead of estimating.",
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
      "Create a real support ticket in Convex only when the user asks. Speak the returned ticket ID, then show the new ticket on the Tickets page.",
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

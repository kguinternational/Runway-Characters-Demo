import { clientTool, pageActionTools } from "@runwayml/avatars-react/api";
import type { RealtimeSessionCreateParams } from "@runwayml/sdk/resources/realtime-sessions";
import { z } from "zod";

type SessionTools = NonNullable<RealtimeSessionCreateParams["tools"]>;

export const setDateRangeTool = clientTool("set_date_range", {
  description:
    "Show a revenue date range. Navigate to Revenue first, change the visible chart, then briefly confirm the change.",
  schema: z.object({ range: z.enum(["7d", "30d", "90d"]) }),
});

export const openPanelTool = clientTool("open_panel", {
  description:
    "Open the same information panel the user can open by clicking the dashboard, then briefly confirm it.",
  schema: z.object({
    title: z.string(),
    body: z.string(),
  }),
});

const clientTools = [
  {
    ...setDateRangeTool,
    parameters: [
      {
        name: "range",
        type: "string",
        enum: ["7d", "30d", "90d"],
        required: true,
        description: "The visible range: 7d, 30d, or 90d.",
      },
    ],
  },
  {
    ...openPanelTool,
    parameters: [
      { name: "title", type: "string", required: true, description: "Short panel title." },
      { name: "body", type: "string", required: true, description: "Short panel message." },
    ],
  },
] satisfies SessionTools;

const serverTools = [
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
        required: true,
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
      { name: "subject", type: "string", required: true, description: "Ticket subject." },
      {
        name: "team",
        type: "string",
        enum: ["Billing", "Support", "Product"],
        required: true,
        description: "Owning team.",
      },
    ],
  },
] satisfies SessionTools;

const pageActions = pageActionTools.map((tool) => ({
  ...tool,
  description:
    tool.name === "click"
      ? "Click an interactive element by target ID. Always highlight that same target first, then click it, then briefly confirm the action."
      : `${tool.description}, then briefly tell the user what you did.`,
})) as SessionTools;

// The SDK owns the Page Action parameters; this cast only bridges a declaration mismatch.
export const sessionTools: SessionTools = [
  ...pageActions,
  ...clientTools,
  ...serverTools,
];

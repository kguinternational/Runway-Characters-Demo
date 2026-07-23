import {
  clientTool,
  pageActionTools,
  type ClientEventsFrom,
} from "@runwayml/avatars-react/api";
import type { RealtimeSessionCreateParams } from "@runwayml/sdk/resources/realtime-sessions";
import { z } from "zod";

import type { RevenueRange } from "@/lib/convex-functions";

type SessionTools = NonNullable<RealtimeSessionCreateParams["tools"]>;

// The published 0.17 declaration widens Page Action parameter `type` values
// to `string`, even though the runtime objects use the API's string/number
// literals. Narrow the verified SDK-owned definitions at this boundary.
const typedPageActionTools = pageActionTools as unknown as SessionTools;

export const revenueRangeSchema = z.enum(["7d", "30d", "90d"]);

export const setDateRangeTool = clientTool("set_date_range", {
  description:
    "Change the revenue chart to the requested trailing date range. When the user says the chart looks off, first scroll to and highlight revenue-chart, then set 30d here, then call get_revenue with 30d.",
  schema: z.object({ range: revenueRangeSchema }).strict(),
});

export const openPanelTool = clientTool("open_panel", {
  description:
    "Open the dashboard's right-hand information panel with a concise title and body. Use it only after the underlying action succeeds; a ticket confirmation must include the exact ticketId returned by create_ticket.",
  schema: z
    .object({
      title: z.string().trim().min(1).max(80),
      body: z.string().trim().min(1).max(320),
    })
    .strict(),
});

/**
 * Keep this tuple separate from the API-facing tools. The schemas above power
 * browser-side inference and validation; Runway still needs the explicit
 * `parameters` arrays below so the model knows how to construct arguments.
 */
export const clientToolDefinitions = [
  setDateRangeTool,
  openPanelTool,
] as const;

export type NovaClientEvents = ClientEventsFrom<
  typeof clientToolDefinitions
>;

export const clientEventTools = [
  {
    ...setDateRangeTool,
    parameters: [
      {
        name: "range",
        type: "string",
        enum: ["7d", "30d", "90d"],
        required: true,
        description: "Trailing revenue range to display: 7d, 30d, or 90d.",
      },
    ],
  },
  {
    ...openPanelTool,
    parameters: [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Short panel heading, no more than 80 characters.",
      },
      {
        name: "body",
        type: "string",
        required: true,
        description:
          "Concise confirmation or explanatory text, no more than 320 characters.",
      },
    ],
  },
] satisfies SessionTools;

export const getRevenueArgsSchema = z
  .object({ range: revenueRangeSchema })
  .strict();

export const createTicketArgsSchema = z
  .object({
    subject: z.string().trim().min(1).max(180),
    team: z.string().trim().min(1).max(60),
  })
  .strict();

export type GetRevenueArgs = z.infer<typeof getRevenueArgsSchema>;
export type CreateTicketArgs = z.infer<typeof createTicketArgsSchema>;

export const backendRpcTools = [
  {
    type: "backend_rpc",
    name: "get_revenue",
    description:
      "Read revenue analytics from the live database for a trailing range. Call this whenever the user asks for a revenue total, change, anomaly, dip, or refund explanation; never estimate those values from the chart.",
    timeoutSeconds: 8,
    parameters: [
      {
        name: "range",
        type: "string",
        enum: ["7d", "30d", "90d"],
        required: true,
        description: "Trailing database range to analyze: 7d, 30d, or 90d.",
      },
    ],
  },
  {
    type: "backend_rpc",
    name: "create_ticket",
    description:
      "Create a real support ticket in the database and return its numeric ticket ID. Use only after the user asks to log, file, or create a ticket, then speak the returned ID and call open_panel with that exact ID.",
    timeoutSeconds: 8,
    parameters: [
      {
        name: "subject",
        type: "string",
        required: true,
        description:
          "Specific action-oriented ticket subject, no more than 180 characters.",
      },
      {
        name: "team",
        type: "string",
        required: true,
        description:
          "Owning team name. Use Billing for the refund investigation in this demo.",
      },
    ],
  },
] satisfies SessionTools;

export const novaSessionTools: SessionTools = [
  ...typedPageActionTools,
  ...clientEventTools,
  ...backendRpcTools,
];

export function isRevenueRange(value: string): value is RevenueRange {
  return revenueRangeSchema.safeParse(value).success;
}

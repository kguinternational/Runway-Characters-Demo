"use server";

import { createRpcHandler, type RpcHandler } from "@runwayml/avatars-node-rpc";
import Runway from "@runwayml/sdk";
import { consumeSession, pollUntilReady } from "@runwayml/avatars-react/api";

import {
  NOVA_AVATAR_ID,
  NOVA_PERSONALITY,
  NOVA_START_SCRIPT,
} from "@/lib/avatar";
import { getDemoRevenue } from "@/lib/demo-data";
import {
  createDemoTicket,
  getDemoTicket,
  getDemoTicketInsights,
  updateDemoTicketStatus,
} from "@/lib/demo-store";
import { sessionTools } from "@/lib/tools";
import type {
  RevenueRange,
  TicketStatus,
  TicketTeam,
} from "@/lib/types";

const handlers = new Map<string, RpcHandler>();
let runwayClient: Runway | null = null;

function getRunwayClient() {
  if (!runwayClient) {
    const apiKey = process.env.RUNWAYML_API_SECRET;
    if (!apiKey) {
      throw new Error(
        "Runway API Key is missing. Please add RUNWAYML_API_SECRET to your .env.local file to connect the live video agent."
      );
    }
    runwayClient = new Runway({ apiKey });
  }
  return runwayClient;
}

export async function createAvatarSession() {
  const apiKey = process.env.RUNWAYML_API_SECRET!;
  const client = getRunwayClient();
  const { id: sessionId } = await client.realtimeSessions.create({
    model: "gwm1_avatars",
    avatar: { type: "runway-preset", presetId: "human-resource" },
    personality: NOVA_PERSONALITY,
    startScript: NOVA_START_SCRIPT,
    tools: sessionTools,
  });

  const { sessionKey } = await pollUntilReady({
    sessionId,
    apiKey,
  });

  const handler = await createRpcHandler({
    apiKey,
    sessionId,
    tools: {
      get_overview_insights: async () => {
        const revenue = getDemoRevenue("30d");
        const tickets = getDemoTicketInsights();

        return {
          revenue: {
            total: revenue.total,
            changePct: revenue.changePct,
            refundCount: revenue.refundCount,
          },
          support: {
            total: tickets.total,
            open: tickets.open,
            topTeam: tickets.topTeam,
            latestTicket: tickets.latestTicket,
          },
        };
      },
      get_revenue: async (args) => {
        const revenue = getDemoRevenue(String(args.range) as RevenueRange);
        return {
          total: revenue.total,
          changePct: revenue.changePct,
          dailyAverage: revenue.dailyAverage,
          peakDay: revenue.peakDay,
          refundCount: revenue.refundCount,
          dip: revenue.dip,
        };
      },
      get_ticket_insights: async () => ({ ...getDemoTicketInsights() }),
      get_ticket: async (args) => ({
        ticket: getDemoTicket(Number(args.ticketId)),
      }),
      create_ticket: async (args) => {
        const ticket = createDemoTicket({
          subject: String(args.subject),
          team: String(args.team) as TicketTeam,
        });
        return { ticket };
      },
      update_ticket_status: async (args) => {
        const ticket = updateDemoTicketStatus({
          ticketId: Number(args.ticketId),
          status: String(args.status) as TicketStatus,
        });
        return { ...ticket };
      },
    },
    onDisconnected: () => handlers.delete(sessionId),
    onError: (error) => console.error("Runway RPC error:", error.message),
  });

  handlers.set(sessionId, handler);
  const credentials = await consumeSession({ sessionId, sessionKey });

  return {
    sessionId,
    serverUrl: credentials.url,
    token: credentials.token,
    roomName: credentials.roomName,
  };
}

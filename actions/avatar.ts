"use server";

import { createRpcHandler, type RpcHandler } from "@runwayml/avatars-node-rpc";
import Runway from "@runwayml/sdk";
import { consumeSession, pollUntilReady } from "@runwayml/avatars-react/api";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import {
  NOVA_AVATAR_ID,
  NOVA_PERSONALITY,
  NOVA_START_SCRIPT,
} from "@/lib/avatar";
import { sessionTools } from "@/lib/tools";
import type { RevenueRange } from "@/lib/types";

const handlers = new Map<string, RpcHandler>();
const runway = new Runway();
const convex = new ConvexHttpClient(
  process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL!,
);

export async function createAvatarSession() {
  const apiKey = process.env.RUNWAYML_API_SECRET!;
  const { id: sessionId } = await runway.realtimeSessions.create({
    model: "gwm1_avatars",
    avatar: { type: "custom", avatarId: NOVA_AVATAR_ID },
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
      get_revenue: async (args) => {
        const revenue = await convex.query(api.revenue.getRevenue, {
          range: String(args.range) as RevenueRange,
        });
        return {
          total: revenue.total,
          changePct: revenue.changePct,
          dip: revenue.dip,
        };
      },
      create_ticket: async (args) => {
        const ticketId = await convex.mutation(api.tickets.createTicket, {
          subject: String(args.subject),
          team: String(args.team),
        });
        return { ticketId };
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

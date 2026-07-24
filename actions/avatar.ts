"use server";

import { createRpcHandler, type RpcHandler } from "@runwayml/avatars-node-rpc";
import Runway from "@runwayml/sdk";
import { consumeSession, pollUntilReady } from "@runwayml/avatars-react/api";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

import {
  NOVA_AVATAR_ID,
  NOVA_PERSONALITY,
  NOVA_START_SCRIPT,
} from "@/lib/avatar";
import { createTicketRef, getRevenueRef } from "@/lib/convex-functions";
import { sessionTools } from "@/lib/tools";

const handlers = new Map<string, RpcHandler>();

const revenueArgs = z.object({
  range: z.enum(["7d", "30d", "90d"]),
});

const ticketArgs = z.object({
  subject: z.string().trim().min(1).max(180),
  team: z.enum(["Billing", "Support", "Product"]),
});

export async function createAvatarSession() {
  const apiKey = process.env.RUNWAYML_API_SECRET!;
  const runway = new Runway();
  const convex = new ConvexHttpClient(
    process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL!,
  );
  const { id: sessionId } = await runway.realtimeSessions.create({
    model: "gwm1_avatars",
    avatar: { type: "custom", avatarId: NOVA_AVATAR_ID },
    maxDuration: 300,
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
        const { range } = revenueArgs.parse(args);
        const revenue = await convex.query(getRevenueRef, { range });
        return {
          total: revenue.total,
          changePct: revenue.changePct,
          dip: revenue.dip,
        };
      },
      create_ticket: async (args) => {
        const { subject, team } = ticketArgs.parse(args);
        const ticketId = await convex.mutation(createTicketRef, {
          subject,
          team,
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

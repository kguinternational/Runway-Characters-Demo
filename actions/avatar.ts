"use server";

import { createRpcHandler, type RpcHandler } from "@runwayml/avatars-node-rpc";
import Runway from "@runwayml/sdk";
import { consumeSession, pollUntilReady } from "@runwayml/avatars-react/api";
import { ConvexHttpClient } from "convex/browser";

import { NOVA_PERSONALITY, NOVA_START_SCRIPT } from "@/lib/avatar";
import { createTicketRef, getRevenueRef } from "@/lib/convex-functions";
import { sessionTools } from "@/lib/tools";
import type { RevenueRange } from "@/lib/types";

const handlers = new Map<string, RpcHandler>();

export async function createAvatarSession(avatarId: string) {
  const apiKey = process.env.RUNWAYML_API_SECRET!;
  const runway = new Runway();
  const convex = new ConvexHttpClient(
    process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL!,
  );
  const { id: sessionId } = await runway.realtimeSessions.create({
    model: "gwm1_avatars",
    avatar: { type: "custom", avatarId },
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
        const revenue = await convex.query(getRevenueRef, {
          range: args.range as RevenueRange,
        });
        return {
          total: revenue.total,
          changePct: revenue.changePct,
          dip: revenue.dip,
        };
      },
      create_ticket: async (args) => {
        const ticketId = await convex.mutation(createTicketRef, {
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
